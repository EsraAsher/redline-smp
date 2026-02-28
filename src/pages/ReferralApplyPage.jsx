import { useState } from 'react';
import { submitReferralApplication } from '../api';

const ReferralApplyPage = () => {
  const [form, setForm] = useState({
    creatorName: '',
    email: '',
    minecraftUsername: '',
    discordId: '',
    channelLink: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.creatorName || !form.email || !form.minecraftUsername || !form.discordId || !form.channelLink) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await submitReferralApplication(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 max-w-2xl mx-auto min-h-screen">
        <div className="bg-dark-surface border border-green-500/30 rounded-2xl p-8 sm:p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-pixel text-lg sm:text-xl text-green-400 mb-3">
            APPLICATION SUBMITTED!
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
            Thanks for applying to the Redline SMP Creator Referral Program!
            Check your email for a confirmation. Our team will review your application within 1–3 days.
          </p>
          <a
            href="/"
            className="inline-block mt-6 px-6 py-3 font-pixel text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            BACK TO HOME
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 max-w-2xl mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="text-4xl mb-3">🤝</div>
        <h1 className="font-pixel text-lg sm:text-2xl text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)] mb-2">
          CREATOR REFERRAL PROGRAM
        </h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
          Are you a content creator? Join our referral program and earn commission on every sale
          made with your custom code. Your audience gets a discount, you get paid.
        </p>
      </div>

      {/* Discord prerequisite card */}
      <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="font-pixel text-sm text-white mb-3">JOIN DISCORD BEFORE FILLING APPLICATION</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-1">
          To participate in the referral program, you must first join our Discord server.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-1">
          After joining, you can submit your application for review.
        </p>
        <p className="text-yellow-400/80 text-sm leading-relaxed mb-5">
          ⚠️ Important: If you do not join the Discord server, your application will not be reviewed.
        </p>
        <a
          href="https://discord.gg/DPZ57hXdcM"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 font-pixel text-xs rounded-lg bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Creator Server
        </a>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="font-pixel text-sm text-red-400 mb-2">APPLY NOW</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Creator Name */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Creator / Brand Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="creatorName"
            value={form.creatorName}
            onChange={handleChange}
            placeholder="Your name or brand name"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Minecraft Username */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Minecraft Username <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="minecraftUsername"
            value={form.minecraftUsername}
            onChange={handleChange}
            placeholder="Steve"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Discord ID */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Discord ID <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="discordId"
            value={form.discordId}
            onChange={handleChange}
            placeholder="e.g. 123456789012345678"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">
            Right-click your name in Discord → Copy User ID (enable Developer Mode in settings)
          </p>
        </div>

        {/* Channel Link */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Channel / Profile Link <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            name="channelLink"
            value={form.channelLink}
            onChange={handleChange}
            placeholder="https://youtube.com/@yourchannel"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-400 text-xs mb-1.5">
            Why should we partner with you? <span className="text-gray-600">(optional)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Tell us about your content, audience, and why you'd be a great fit..."
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 font-pixel text-xs bg-linear-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,0,0,0.2)]"
        >
          {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
        </button>
      </form>
    </main>
  );
};

export default ReferralApplyPage;
