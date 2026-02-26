import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createTicket } from '../api';

const CATEGORIES = [
  'Payment Issue',
  'Missing Items',
  'Account Problem',
  'Bug Report',
  'General Question',
  'Other',
];

const HelpPage = () => {
  const [ticket, setTicket] = useState({
    email: '',
    username: '',
    category: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setTicket({ ...ticket, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createTicket(ticket.email.trim(), ticket.username.trim(), ticket.category, ticket.message.trim());
      setSubmitted(true);
      setTicket({ email: '', username: '', category: '', message: '' });
    } catch (err) {
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-pixel text-center text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] mb-4">
          HELP CENTER
        </h1>
        <p className="text-gray-400 text-center mb-8 sm:mb-12 md:mb-16 max-w-xl mx-auto">
          Need help? Submit a ticket or reach out to us directly.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Ticket Generator */}
          <div className="bg-dark-surface border border-red-500/20 rounded-xl p-5 sm:p-8">
            <h2 className="text-base sm:text-xl font-pixel text-red-400 mb-4 sm:mb-6 flex items-center gap-3">
              <span className="text-2xl">🎫</span> SUBMIT A TICKET
            </h2>

            {submitted ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <p className="font-pixel text-sm text-green-400 mb-2">TICKET SUBMITTED!</p>
                <p className="text-gray-400 text-sm">We'll get back to you via email shortly.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                >
                  Submit another ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-pixel mb-2">EMAIL *</label>
                  <input
                    type="email"
                    name="email"
                    value={ticket.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-red-500/30 rounded p-3 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(255,0,0,0.2)] transition-all font-mono text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-pixel mb-2">MINECRAFT USERNAME</label>
                  <input
                    type="text"
                    name="username"
                    value={ticket.username}
                    onChange={handleChange}
                    className="w-full bg-black/50 border border-red-500/30 rounded p-3 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(255,0,0,0.2)] transition-all font-mono text-sm"
                    placeholder="Your in-game name (optional)"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-pixel mb-2">CATEGORY *</label>
                  <select
                    name="category"
                    value={ticket.category}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-red-500/30 rounded p-3 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(255,0,0,0.2)] transition-all text-sm"
                  >
                    <option value="" disabled>Select a category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-pixel mb-2">MESSAGE *</label>
                  <textarea
                    name="message"
                    value={ticket.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full bg-black/50 border border-red-500/30 rounded p-3 text-white focus:outline-none focus:border-red-500 focus:shadow-[0_0_10px_rgba(255,0,0,0.2)] transition-all font-mono text-sm resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-red-500/20 border border-red-500 text-red-400 font-pixel text-sm rounded hover:bg-red-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT TICKET'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Discord Card */}
            <a
              href="https://discord.gg/wBNMMj2PE4"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-dark-surface border border-red-500/20 rounded-xl p-5 sm:p-8 hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.15)] group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-[#5865F2] rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-pixel text-red-400">DISCORD</h2>
                  <p className="text-gray-400 text-sm">Join our community server</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Get instant help from staff and the community. Open a support ticket in our Discord for the fastest response.
              </p>
              <div className="mt-4 font-pixel text-xs text-red-400 group-hover:text-white transition-colors">
                CLICK TO JOIN →
              </div>
            </a>

            {/* Email Card */}
            <div className="bg-dark-surface border border-red-500/20 rounded-xl p-5 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-pixel text-red-400">EMAIL US</h2>
                  <p className="text-gray-400 text-sm">For business or formal inquiries</p>
                </div>
              </div>
              <a
                href="mailto:support@redlinesmp.com"
                className="block mt-2 text-lg font-mono text-white hover:text-red-400 transition-colors break-all"
              >
                support@redlinesmp.com
              </a>
              <p className="text-gray-500 text-xs mt-3">
                Expect a response within 24-48 hours.
              </p>
            </div>

            {/* FAQ Preview */}
            <div className="bg-dark-surface border border-red-500/20 rounded-xl p-5 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-2xl">❓</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-pixel text-red-400">QUICK FAQ</h2>
                  <p className="text-gray-400 text-sm">Common questions answered</p>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="border-b border-white/5 pb-3">
                  <span className="text-red-400 font-bold">Q:</span> How do I join the server?
                  <br />
                  <span className="text-gray-500">Connect with: mc.redlinesmp.fun (Java Edition)</span>
                </li>
                <li className="border-b border-white/5 pb-3">
                  <span className="text-red-400 font-bold">Q:</span> When do I receive my rank?
                  <br />
                  <span className="text-gray-500">Ranks are applied instantly after purchase.</span>
                </li>
                <li>
                  <span className="text-red-400 font-bold">Q:</span> Can I get a refund?
                  <br />
                  <span className="text-gray-500">Check our refund policy on Discord or email us.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
  );
};

export default HelpPage;
