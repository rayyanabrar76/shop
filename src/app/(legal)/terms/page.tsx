export const metadata = {
  title: 'Terms of Service — ShopFlow',
}

const EFFECTIVE = 'May 9, 2026'
const COMPANY = 'ShopFlow'
const CONTACT = 'support@shopflow.app'

export default function TermsPage() {
  return (
    <div className="text-zinc-800 leading-relaxed">
      <h1 className="text-3xl font-black tracking-tight text-zinc-900">Terms of Service</h1>
      <p className="text-sm text-zinc-500">Effective date: {EFFECTIVE}</p>

      <p className="mt-6">
        These Terms of Service (the &ldquo;Terms&rdquo;) govern your access to and use of {COMPANY} (the &ldquo;Service&rdquo;), a hosted platform that lets you create and operate an online store. By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2 className="text-xl font-bold mt-10">1. Eligibility &amp; Account</h2>
      <p>You must be at least 18 years old and capable of forming a binding contract. You are responsible for maintaining the confidentiality of your account credentials and for any activity under your account. You must promptly notify us of any unauthorized use.</p>

      <h2 className="text-xl font-bold mt-8">2. Your Store &amp; Content</h2>
      <p>You retain ownership of all content you upload, including products, images, text, and customer data (&ldquo;Your Content&rdquo;). You grant {COMPANY} a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, and distribute Your Content solely as needed to operate the Service.</p>
      <p>You represent that you have all necessary rights to Your Content and that it does not infringe any third-party rights or violate any law.</p>

      <h2 className="text-xl font-bold mt-8">3. Subscription Plans &amp; Fees</h2>
      <p>{COMPANY} is offered on the plans listed at our pricing page. Paid plans are billed monthly or annually in advance. Plans may include a free trial; you will not be charged during the trial period unless otherwise stated.</p>
      <p>In addition to the subscription fee, {COMPANY} charges a per-transaction take rate on payments processed through Stripe Connect (the rate depends on your plan). These fees are deducted automatically from each transaction.</p>
      <p>Fees are non-refundable except as required by law. You can cancel your subscription at any time from the billing portal; your access continues through the end of the current billing period. We may change prices upon 30 days&rsquo; notice.</p>

      <h2 className="text-xl font-bold mt-8">4. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>sell prohibited products (illegal goods, counterfeit items, weapons, regulated substances) or operate a high-risk business prohibited by Stripe;</li>
        <li>harass, defraud, deceive, or harm other users;</li>
        <li>upload malware, run unauthorized scans, or attempt to circumvent platform security;</li>
        <li>scrape or reverse-engineer the Service;</li>
        <li>resell, sublicense, or white-label the Service without our written agreement.</li>
      </ul>
      <p>We may suspend or terminate stores that violate these rules, with or without notice.</p>

      <h2 className="text-xl font-bold mt-8">5. Payments via Stripe Connect</h2>
      <p>Payments to your store are processed by Stripe under their <a href="https://stripe.com/connect-account/legal" className="text-violet-600 underline">Stripe Connected Account Agreement</a>. By accepting payments, you agree to Stripe&rsquo;s terms. {COMPANY} is not a party to your transaction with the buyer; we facilitate the payment but do not take possession of funds beyond our application fee.</p>
      <p>You are solely responsible for fulfilling orders, providing customer support, handling returns and refunds, and complying with consumer-protection and tax laws applicable to your sales.</p>

      <h2 className="text-xl font-bold mt-8">6. Customer Data</h2>
      <p>When buyers shop on your store, you act as the data controller of their personal information; {COMPANY} acts as your data processor. You agree to maintain a privacy policy on your store, comply with applicable privacy laws (GDPR, CCPA, etc.), and respond to data-subject requests within legally required timeframes. See our <a href="/privacy" className="text-violet-600 underline">Privacy Policy</a> for more.</p>

      <h2 className="text-xl font-bold mt-8">7. Intellectual Property</h2>
      <p>The Service, including its software, design, and brand, is owned by {COMPANY} and protected by intellectual-property laws. We grant you a limited, non-exclusive, non-transferable license to use the Service during your active subscription. No other rights are granted.</p>

      <h2 className="text-xl font-bold mt-8">8. Termination</h2>
      <p>You may delete your account at any time. We may suspend or terminate your account for material breach of these Terms. On termination, you may export your data; after 60 days, we may permanently delete it.</p>

      <h2 className="text-xl font-bold mt-8">9. Warranty Disclaimer</h2>
      <p>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or secure.</p>

      <h2 className="text-xl font-bold mt-8">10. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, {COMPANY} and its affiliates will not be liable for any indirect, incidental, consequential, special, or punitive damages, or for any loss of profits, revenue, data, or goodwill. Our aggregate liability under these Terms will not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.</p>

      <h2 className="text-xl font-bold mt-8">11. Indemnification</h2>
      <p>You agree to indemnify and hold {COMPANY} harmless from any claim arising out of Your Content, your sales, your violation of these Terms, or your violation of any law or third-party right.</p>

      <h2 className="text-xl font-bold mt-8">12. Governing Law &amp; Disputes</h2>
      <p>These Terms are governed by the laws of the jurisdiction in which {COMPANY} is established, without regard to conflict-of-law principles. Disputes will be resolved in the courts of that jurisdiction, except that you may bring small-claims actions in your local court.</p>

      <h2 className="text-xl font-bold mt-8">13. Changes</h2>
      <p>We may update these Terms from time to time. Material changes will be announced by email or in-app at least 14 days before they take effect. Continued use after the effective date constitutes acceptance.</p>

      <h2 className="text-xl font-bold mt-8">14. Contact</h2>
      <p>Questions about these Terms? Email <a href={`mailto:${CONTACT}`} className="text-violet-600 underline">{CONTACT}</a>.</p>

      <p className="mt-10 text-xs text-zinc-400">
        This document is provided as a starting point and does not constitute legal advice. Have an attorney review before relying on it in production.
      </p>
    </div>
  )
}
