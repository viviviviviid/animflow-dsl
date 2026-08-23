export default function ReportPage() {
  const contact = process.env.ANIMFLOW_ABUSE_CONTACT;
  return <main className="policy-page"><article><span>AnimFlow public service</span><h1>Report content</h1><p>Include the immutable revision ID and a short explanation. Do not send private source or credentials.</p>{contact ? <a href={`mailto:${contact}?subject=AnimFlow%20content%20report`}>Email the abuse contact</a> : <p className="policy-warning">This deployment has not configured an abuse contact. The operator must set ANIMFLOW_ABUSE_CONTACT before opening anonymous publishing.</p>}<a href="/privacy">Read the privacy notice</a></article></main>;
}
