export function legalVerificationError(status: number, payload: any): string {
  if (status === 401) return 'Your session has expired. Please sign in again and retry.';
  if (status === 413) return 'The uploaded documents are too large. Please choose smaller files and retry.';
  if (status === 429) return 'The verification service is busy. Please wait a moment and retry.';
  if (status === 502 || status === 503 || status === 504) {
    return 'The verification service is unavailable or timed out. Please retry shortly.';
  }

  for (const value of [payload?.message, payload?.error, payload?.detail]) {
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 600);
  }

  // Processing failures can arrive as HTTP 200 with the reason in the report.
  if (typeof payload?.report === 'string') {
    const report = payload.report;
    const issues = report.match(/ISSUES FOUND IN THIS DOCUMENT:\s*([\s\S]*?)(?:\n\s*\n|\n[A-Z][A-Z ]+:|$)/i)?.[1];
    const processing = report.match(/Processing error:\s*([^\r\n]+)/i)?.[1];
    const reason = issues?.replace(/^[\s•*\-]+/, '').trim() || processing?.trim();
    if (reason) return reason.slice(0, 600);
  }

  if (status >= 500) return 'Verification could not be completed because of a server error. Please retry shortly.';
  if (status >= 400) return `The verification request was rejected (HTTP ${status}). Please check your document and retry.`;
  return 'The service could not complete this document review. Try a clear, readable sale deed PDF or image.';
}
