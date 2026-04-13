export const PAYMENT_AMOUNT = '$487.30';
export const PAYMENT_METHOD = 'ACH';
export const ACCOUNT_LAST4 = '9876';
export const ACCOUNT_DISPLAY = `****${ACCOUNT_LAST4}`;

export const RECEIPT_LINES = [
  { label: 'Payment', value: PAYMENT_AMOUNT },
  { label: 'Method', value: PAYMENT_METHOD },
  { label: 'Account', value: ACCOUNT_DISPLAY },
  { label: 'Ref', value: 'TXN-2024-03-20-A7F2' },
  { label: 'Status', value: '✅ SUCCESS' },
];
