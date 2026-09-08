export const metadata = {
  title: 'Privacy Policy, ShopFlow',
}

const EFFECTIVE = 'May 9, 2026'
const COMPANY = 'ShopFlow'
const CONTACT = 'privacy@shopflow.app'

export default function PrivacyPage() {
  return (
    <div className="text-zinc-800 leading-relaxed">
      <h1 className="text-3xl font-black tracking-tight text-zinc-900">Privacy Policy</h1>
      <p className="text-sm text-zinc-500">Effective date: {EFFECTIVE}</p>

      <p className="mt-6">
        This Privacy Policy explains how {COMPANY} (&ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, uses, and shares information when you use our service. We act in two capacities: as a <strong>data controller</strong> for store owners&rsquo; account data, and as a <strong>data processor</strong> for the customer data store owners collect from their shoppers.
      </p>

      <h2 className="text-xl font-bold mt-10">1. Information we collect</h2>

      <h3 className="text-base font-bold mt-5">From store owners</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Account data:</strong> name, email, password (managed by Clerk), profile photo.</li>
        <li><strong>Billing data:</strong> last four digits of card, billing address, transaction history (stored by Stripe; we never see full card numbers).</li>
        <li><strong>Store metadata:</strong> store name, subdomain, custom domain, branding settings, products, orders, customers.</li>
        <li><strong>Usage data:</strong> pages visited, IP address, device type, browser, referrer.</li>
      </ul>

      <h3 className="text-base font-bold mt-5">From buyers (on behalf of store owners)</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Account data:</strong> email, name, password (hashed with bcrypt), and Google OAuth identifier when applicable.</li>
        <li><strong>Order data:</strong> shipping address, phone, items purchased, payment method, payment status.</li>
        <li><strong>Cookies:</strong> session cookies for cart and authentication.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8">2. How we use information</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>operate, maintain, and improve the Service;</li>
        <li>process payments via Stripe;</li>
        <li>send transactional emails (order confirmations, password resets);</li>
        <li>detect and prevent fraud and abuse;</li>
        <li>comply with legal obligations.</li>
      </ul>
      <p>We do not sell personal information.</p>

      <h2 className="text-xl font-bold mt-8">3. Sharing &amp; sub-processors</h2>
      <p>We share information with the following service providers, only as needed to operate the Service:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li><strong>Vercel</strong>, application hosting</li>
        <li><strong>Neon</strong>, database hosting (PostgreSQL)</li>
        <li><strong>Clerk</strong>, store owner authentication</li>
        <li><strong>Stripe</strong>, payment processing</li>
        <li><strong>ImageKit</strong>, image &amp; video hosting</li>
        <li><strong>Resend</strong>, transactional email</li>
        <li><strong>Google</strong>, OAuth login (when buyers choose it)</li>
      </ul>
      <p>Each sub-processor is bound by its own privacy and security commitments.</p>

      <h2 className="text-xl font-bold mt-8">4. Cookies</h2>
      <p>We use a small number of strictly necessary cookies (auth tokens, cart state). We do not use third-party advertising or tracking cookies.</p>

      <h2 className="text-xl font-bold mt-8">5. Your rights</h2>
      <p>Depending on where you live, you may have the right to access, correct, delete, port, or restrict processing of your personal information. To exercise these rights:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>If you&rsquo;re a store owner, use the dashboard or email <a href={`mailto:${CONTACT}`} className="text-violet-600 underline">{CONTACT}</a>.</li>
        <li>If you&rsquo;re a buyer, contact the store owner first; they are the data controller for their store. You may also email us and we&rsquo;ll forward your request.</li>
      </ul>

      <h2 className="text-xl font-bold mt-8">6. Data retention</h2>
      <p>Account data is retained while your account is active and for up to 60 days after deletion to allow recovery. Backups may persist for up to 30 additional days. Order records may be retained longer to comply with tax and accounting laws.</p>

      <h2 className="text-xl font-bold mt-8">7. International transfers</h2>
      <p>Our infrastructure is hosted in the United States. By using the Service, you consent to your information being transferred to and processed in the U.S. We rely on Standard Contractual Clauses or other appropriate safeguards where required.</p>

      <h2 className="text-xl font-bold mt-8">8. Security</h2>
      <p>We use industry-standard security: encryption in transit (TLS 1.2+), encryption at rest, bcrypt-hashed passwords, JWT-signed session tokens, and least-privilege access controls. No system is perfectly secure, however; you use the Service at your own risk.</p>

      <h2 className="text-xl font-bold mt-8">9. Children</h2>
      <p>The Service is not directed to children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal information from children. If we discover such collection, we will delete the data promptly.</p>

      <h2 className="text-xl font-bold mt-8">10. Changes</h2>
      <p>We may update this Policy. Material changes will be announced 14 days in advance.</p>

      <h2 className="text-xl font-bold mt-8">11. Contact</h2>
      <p>Questions or requests? Email <a href={`mailto:${CONTACT}`} className="text-violet-600 underline">{CONTACT}</a>.</p>

      <p className="mt-10 text-xs text-zinc-400">
        This document is provided as a starting point and does not constitute legal advice. Have an attorney review and customize for your jurisdiction before launch.
      </p>
    </div>
  )
}
