import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <main className="relative z-10 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 max-w-4xl mx-auto min-h-screen">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Store
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-pixel text-xl sm:text-3xl text-red-400 drop-shadow-[0_0_12px_rgba(255,0,0,0.5)] mb-3">
          TERMS &amp; CONDITIONS
        </h1>
        <p className="text-gray-500 text-sm">Last updated: February 26, 2026</p>
      </div>

      {/* Content */}
      <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
        {/* 1 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">1. ACCEPTANCE OF TERMS</h2>
          <p>
            By accessing and using the Redline SMP store ("Service"), you agree to be bound by these
            Terms &amp; Conditions. If you do not agree to all terms, do not use the Service. Your
            continued use of the Service constitutes acceptance of any changes or updates to these terms.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">2. PURCHASES &amp; PAYMENTS</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes.</li>
            <li>Payment is processed securely through Razorpay. We do not store your payment details.</li>
            <li>You must provide a valid Minecraft username and verify your identity using an in-game store code before purchasing.</li>
            <li>Items are delivered automatically to your in-game account upon successful payment verification.</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">3. REFUND POLICY</h2>
          <p>
            <strong className="text-white">All purchases are final and non-refundable.</strong> Since
            digital items are delivered instantly to your in-game account, we cannot reverse or undo
            deliveries. If you experience a technical issue with delivery, please contact us through the{' '}
            <Link to="/help" className="text-red-400 underline hover:text-red-300">
              Help page
            </Link>{' '}
            and we will investigate on a case-by-case basis.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">4. DIGITAL ITEMS</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Purchased items are virtual goods for use within the Redline SMP Minecraft server only.</li>
            <li>Items have no real-world monetary value and cannot be transferred, traded, or resold.</li>
            <li>We reserve the right to modify, balance, or remove items for gameplay integrity.</li>
            <li>Access to purchased items requires an active account on the Redline SMP server.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">5. ACCOUNT RESPONSIBILITY</h2>
          <p>
            You are responsible for maintaining the security of your Minecraft account. Redline SMP is
            not liable for any loss arising from unauthorized access to your account. Ensure you enter
            the correct Minecraft username during checkout — items delivered to the wrong account due to
            user error cannot be recovered.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">6. SERVER RULES &amp; BANS</h2>
          <p>
            If your account is banned from the Redline SMP server for violating server rules, you will
            lose access to all purchased items. No refunds will be issued for bans resulting from rule
            violations. Server rules are available in our Discord and in-game.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">7. SERVICE AVAILABILITY</h2>
          <p>
            We strive to maintain the store and server at all times, but do not guarantee uninterrupted
            access. Scheduled maintenance, updates, or unforeseen issues may cause temporary downtime.
            We are not liable for any losses caused by service interruptions.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">8. PRIVACY</h2>
          <p>
            We collect only the information necessary to process your order: Minecraft username, email
            address (optional), and payment confirmation from Razorpay. We do not sell or share your
            personal information with third parties. Payment data is handled entirely by Razorpay under
            their privacy policy.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">9. DISCLAIMER</h2>
          <p>
            Redline SMP is not affiliated with, endorsed by, or associated with Mojang AB, Microsoft
            Corporation, or any of their subsidiaries. "Minecraft" is a trademark of Mojang AB.
            All purchases support the independent Redline SMP community server.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">10. CHANGES TO TERMS</h2>
          <p>
            We reserve the right to update these Terms &amp; Conditions at any time. Changes will be
            reflected on this page with an updated date. Continued use of the Service after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="font-pixel text-xs text-red-400 mb-3">11. CONTACT</h2>
          <p>
            If you have questions about these terms or need assistance, please reach out through our{' '}
            <Link to="/help" className="text-red-400 underline hover:text-red-300">
              Help &amp; Support
            </Link>{' '}
            page.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-white/10 text-center">
        <p className="text-gray-500 text-xs">
          &copy; 2026 Redline SMP. All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default TermsPage;
