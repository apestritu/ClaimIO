#!/usr/bin/env python
"""
MCP stdio server — Document Store for ClaimIO.

Exposes tools for listing, reading, and extracting text from claim documents.
Designed to be launched as a subprocess via MCPServerStdio.
"""

from __future__ import annotations

import base64
import io
import json
import os
import sys
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image
from openai import OpenAI
from mcp.server.fastmcp import FastMCP

INPUT_DIR = Path(__file__).resolve().parent.parent.parent / "input"

mcp = FastMCP("ClaimIO Document Store")

client: OpenAI | None = None


def _get_client() -> OpenAI:
    global client
    if client is None:
        client = OpenAI()
    return client


def _render_pdf_to_images(pdf_path: Path) -> list[Image.Image]:
    pdf = pdfium.PdfDocument(pdf_path)
    images = []
    for i in range(len(pdf)):
        page = pdf[i]
        try:
            bitmap = page.render(scale=2)
            images.append(bitmap.to_pil())
        except AttributeError:
            images.append(page.render_topil(scale=2))
    return images


def _pil_to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _vision_ocr(b64_pngs: list[str]) -> str:
    content = [
        {"type": "input_image", "image_url": f"data:image/png;base64,{b64}"}
        for b64 in b64_pngs
    ]
    content.append(
        {"type": "input_text", "text": "Extract all readable text exactly as it appears."}
    )
    resp = _get_client().responses.create(
        model="gpt-5.4",
        reasoning={"effort": "medium"},
        input=[{"role": "user", "content": content}],
    )
    return resp.output_text or ""


@mcp.tool()
def list_claim_documents(case_id: str) -> str:
    """List all documents available for a given case (ShowCase1 or ShowCase2).

    Args:
        case_id: The case folder name, e.g. 'ShowCase1' or 'ShowCase2'.
    """
    case_dir = INPUT_DIR / case_id
    if not case_dir.exists():
        return json.dumps({"error": f"Case '{case_id}' not found"})
    files = []
    for f in sorted(case_dir.iterdir()):
        if f.suffix.lower() in (".pdf", ".txt"):
            files.append({"name": f.name, "size_bytes": f.stat().st_size, "type": f.suffix})
    return json.dumps({"case_id": case_id, "documents": files, "count": len(files)})


@mcp.tool()
def read_document_text(case_id: str, filename: str) -> str:
    """OCR and return the full text of a specific document.

    Args:
        case_id: The case folder name.
        filename: The document filename within the case folder.
    """
    file_path = INPUT_DIR / case_id / filename
    if not file_path.exists():
        return json.dumps({"error": f"File '{filename}' not found in '{case_id}'"})

    if file_path.suffix.lower() == ".txt":
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        return json.dumps({"filename": filename, "text": text, "method": "direct_read"})

    pages = _render_pdf_to_images(file_path)
    if not pages:
        return json.dumps({"filename": filename, "text": "", "method": "ocr_empty"})

    MAX_PAGES = 25
    full_text = []
    for start in range(0, len(pages), MAX_PAGES):
        batch = pages[start : start + MAX_PAGES]
        b64s = [_pil_to_b64(img) for img in batch]
        txt = _vision_ocr(b64s).strip()
        full_text.append(txt)

    return json.dumps({
        "filename": filename,
        "text": "\n\n".join(full_text),
        "pages": len(pages),
        "method": "vision_ocr",
    })


@mcp.tool()
def get_policy_text(case_id: str) -> str:
    """Find and return the policy document text for a given case.

    Args:
        case_id: The case folder name.
    """
    case_dir = INPUT_DIR / case_id
    if not case_dir.exists():
        return json.dumps({"error": f"Case '{case_id}' not found"})

    policy_file = None
    for f in case_dir.iterdir():
        if "policy" in f.name.lower() and f.suffix.lower() == ".pdf":
            policy_file = f
            break

    if not policy_file:
        return json.dumps({"error": "No policy document found"})

    pages = _render_pdf_to_images(policy_file)
    if not pages:
        return json.dumps({"error": "Policy PDF has no pages"})

    b64s = [_pil_to_b64(img) for img in pages[:25]]
    text = _vision_ocr(b64s).strip()

    return json.dumps({
        "filename": policy_file.name,
        "text": text,
        "pages": len(pages),
    })


if __name__ == "__main__":
    mcp.run(transport="stdio")
