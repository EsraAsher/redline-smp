import { Link } from 'react-router-dom';

const CreatorProgramPage = () => {
  return (
    <main className="relative z-10 pt-20 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-pixel text-center text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] mb-4">
        CREATOR PROGRAM
      </h1>
      <p className="text-gray-400 text-center mb-8 sm:mb-12 md:mb-16 max-w-xl mx-auto">
        Partner with Redline SMP, grow your audience, and earn commission on every sale.
      </p>

      {/* Hero Card */}
      <div className="bg-dark-surface border border-red-500/20 rounded-xl p-5 sm:p-8 md:p-10 mb-8 sm:mb-12 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-4">BECOME A REDLINE CREATOR</h2>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          The <span className="text-red-400 font-bold">Redline SMP Creator Program</span> is our official partnership for content creators, streamers, and community builders.
          Get your own referral code, offer your audience exclusive discounts, and earn real commission on every purchase made with your code.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-10 sm:mb-16">
        <h2 className="text-xl sm:text-2xl font-pixel text-red-400 text-center mb-6 sm:mb-10 drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
          HOW IT WORKS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              step: '01',
              title: 'APPLY',
              icon: '📋',
              desc: 'Fill out a quick application with your creator info, Discord ID, and content channel. Our team reviews every application personally.',
            },
            {
              step: '02',
              title: 'GET APPROVED',
              icon: '✅',
              desc: 'Once approved, you\'ll receive a unique referral code with a custom discount for your audience and a commission rate for you.',
            },
            {
              step: '03',
              title: 'EARN',
              icon: '💰',
              desc: 'Share your code. Every time someone uses it at checkout, they save money and you earn commission. Track everything in your creator dashboard.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-dark-surface border border-red-500/20 rounded-xl p-5 sm:p-8 hover:border-red-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,0,0.1)] group relative"
            >
              <div className="absolute top-4 right-4 font-pixel text-xs text-red-500/30">{item.step}</div>
              <div className="text-4xl mb-4 group-hover:scale-110 inline-block transition-transform">{item.icon}</div>
              <h3 className="font-pixel text-sm text-red-400 mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-10 sm:mb-16">
        <h2 className="text-xl sm:text-2xl font-pixel text-red-400 text-center mb-6 sm:mb-10 drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
          CREATOR BENEFITS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: '🏷️', label: 'Custom Code', desc: 'Your own unique referral code' },
            { icon: '💸', label: 'Commission', desc: 'Earn on every sale made with your code' },
            { icon: '📊', label: 'Dashboard', desc: 'Track stats, revenue & payouts in real-time' },
            { icon: '🎁', label: 'Audience Discount', desc: 'Your viewers get exclusive discounts' },
          ].map((b) => (
            <div
              key={b.label}
              className="bg-dark-surface border border-red-500/20 rounded-xl p-4 sm:p-6 text-center hover:border-red-500/50 transition-all hover:shadow-[0_0_15px_rgba(255,0,0,0.1)]"
            >
              <div className="text-2xl sm:text-3xl mb-2">{b.icon}</div>
              <div className="font-pixel text-xs text-red-400 mb-1">{b.label}</div>
              <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-dark-surface border border-white/10 rounded-xl p-5 sm:p-8 mb-10 sm:mb-16">
        <h2 className="font-pixel text-sm text-red-400 mb-6">REQUIREMENTS</h2>
        <ul className="space-y-3 text-gray-400 text-sm leading-relaxed">
          {[
            'An active content creation channel (YouTube, Twitch, TikTok, etc.)',
            'A Discord account (used for communication and dashboard login)',
            'A Minecraft account (Java Edition)',
            'Genuine interest in the Redline SMP community',
          ].map((req, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-red-400 mt-0.5">▸</span>
              <span>{req}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Section */}
      <div className="bg-dark-surface border border-red-500/30 rounded-2xl p-6 sm:p-10 text-center space-y-6">
        <div className="text-4xl">🚀</div>
        <h2 className="font-pixel text-base sm:text-lg text-red-400 drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
          READY TO JOIN?
        </h2>
        <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
          Apply now to become a Redline SMP Creator. Join our Creator Program Discord server for updates, announcements, and community.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/apply"
            className="px-8 py-3 font-pixel text-xs bg-red-500 text-black rounded-lg hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            APPLY NOW
          </Link>
          <a
            href="https://discord.gg/KDKtwK8aTc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 py-3 font-pixel text-xs bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] rounded-lg hover:bg-[#5865F2]/30 transition-all duration-300"
          >
            <svg width="16" height="12" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309-0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4832 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2804 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
            </svg>
            CREATOR DISCORD
          </a>
        </div>

        <p className="text-gray-600 text-xs">
          Applications are reviewed within 1–3 business days.
        </p>
      </div>
    </main>
  );
};

export default CreatorProgramPage;
