"""Vision-based OCR — renders PDF pages and sends to GPT-5.4 Vision."""

from __future__ import annotations

import base64
import io
from pathlib import Path
from typing import Tuple

import pypdfium2 as pdfium
from PIL import Image
from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


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


def _vision_call(b64_pngs: list[str]) -> str:
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


def extract_pdf_text(pdf_path: Path) -> Tuple[str, float]:
    """Returns (full_text, heuristic_confidence)."""
    pages = _render_pdf_to_images(pdf_path)
    if not pages:
        return "", 0.0

    MAX_PAGES_PER_CALL = 25
    full_text, confs = [], []
    for start in range(0, len(pages), MAX_PAGES_PER_CALL):
        batch = pages[start : start + MAX_PAGES_PER_CALL]
        b64s = [_pil_to_b64(img) for img in batch]
        txt = _vision_call(b64s).strip()
        full_text.append(txt)
        confs.append(0.9 if len(txt) > 10 else 0.3)

    return "\n\n".join(full_text), sum(confs) / len(confs)


def extract_txt_file(txt_path: Path) -> Tuple[str, float]:
    """Read a plain text file directly."""
    text = txt_path.read_text(encoding="utf-8", errors="ignore")
    return text, 0.95 if len(text) > 10 else 0.3
