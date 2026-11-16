/** Display evidence received from the service; missing data is never a pass. */
export function verificationChecks(result: any) {
  const portal = result?.data?.portal_check || {};
  const qr = portal.qr_check_status || 'NOT_CHECKED';
  const signature = portal.signature_status || 'NOT_CHECKED';
  const signatureIsPresenceOnly = signature === 'SIGNATURE_PRESENT' ||
    /Signature fields detected/i.test(portal.portal_details?.signature?.note || '');
  const hasEc = Boolean(result?.downloaded_files?.ec);
  const ecMatched = hasEc && result?.ec_download?.verification?.status === 'matched';
  const manual = result?.ec_download?.code === 'EC_MANUAL_UPLOAD' || result?.ec_download?.status === 'manual';
  return {
    qr: { label: qr, confirmed: qr === 'MATCH' },
    signature: { label: signatureIsPresenceOnly ? 'PRESENT — INTEGRITY NOT VERIFIED' : signature, confirmed: signature === 'VALID' && !signatureIsPresenceOnly },
    ec: { label: ecMatched ? 'EC IDENTITY MATCHED' : hasEc ? (manual ? 'MANUALLY SUPPLIED' : 'PDF RETRIEVED — SEE AUDIT FINDINGS') : 'NOT RETRIEVED', confirmed: hasEc },
  };
}
