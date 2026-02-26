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

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: '🏷️', title: 'Custom Code', desc: 'Get your own unique referral code' },
          { icon: '💰', title: 'Earn Commission', desc: 'Earn on every sale with your code' },
          { icon: '🎁', title: 'Audience Discount', desc: 'Your fans save on purchases' },
        ].map((b) => (
          <div
            key={b.title}
            className="bg-dark-surface border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="text-2xl mb-2">{b.icon}</div>
            <div className="text-white text-xs font-bold mb-1">{b.title}</div>
            <div className="text-gray-500 text-xs">{b.desc}</div>
          </div>
        ))}
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
