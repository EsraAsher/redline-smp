import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchVotingSites } from '../api';

const LandingPage = () => {
  const [copied, setCopied] = useState(false);
  const [votingSites, setVotingSites] = useState([]);

  useEffect(() => {
    fetchVotingSites()
      .then((sites) => setVotingSites(sites.slice(0, 3)))
      .catch(() => setVotingSites([]));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('play.redline.gg');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative z-10 w-full">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <img
            src="https://i.postimg.cc/3JjMvMM7/nobg-logo-hero-sec.png"
            alt="Redline SMP"
            className="w-auto h-28 sm:h-40 md:h-52 mx-auto mb-6 sm:mb-8 drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]"
          />

          <p className="text-base sm:text-lg md:text-2xl text-gray-300 font-light tracking-wide leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto">
            The ultimate survival voyage begins here. Gear up, explore, and conquer.
          </p>

          {/* Server IP pill */}
          <div
            onClick={handleCopy}
            className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 cursor-pointer hover:border-red-500/40 transition-all mb-8 sm:mb-10 group"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-sm sm:text-base tracking-wider">PLAY.REDLINE.GG</span>
            <span className="text-gray-500 text-xs group-hover:text-gray-300 transition-colors">
              {copied ? '✓ Copied!' : 'Click to copy'}
            </span>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/store"
              className="px-8 py-3.5 bg-red-600 text-white font-pixel text-sm rounded-lg hover:bg-red-500 shadow-[0_0_25px_rgba(255,0,0,0.3)] hover:shadow-[0_0_40px_rgba(255,0,0,0.5)] transition-all duration-300"
            >
              ENTER STORE
            </Link>
            <Link
              to="/vote"
              className="px-8 py-3.5 bg-white/5 border border-white/20 text-white font-pixel text-sm rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              VOTE &amp; EARN REWARDS
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">ABOUT REDLINE SMP</h2>
            <div className="w-16 h-0.5 bg-red-500/50 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: '⚔️',
                title: 'Survival Experience',
                desc: 'A hardcore survival world where only the strongest thrive. Custom gear, epic battles, and endless adventure await.',
              },
              {
                icon: '🔓',
                title: 'Cracked Support',
                desc: 'Play with both premium and cracked Minecraft accounts. Everyone is welcome in the Redline community.',
              },
              {
                icon: '🎁',
                title: 'Automatic Rewards',
                desc: 'Vote for the server and earn in-game rewards automatically. Support us and get rewarded instantly.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-red-500/30 transition-all duration-300"
              >
                <span className="text-3xl block mb-4">{card.icon}</span>
                <h3 className="text-white font-bold text-base mb-3">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ VOTING PREVIEW ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">VOTE FOR US</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              Support the server by voting daily. Every vote earns you in-game rewards automatically.
            </p>
          </div>

          {votingSites.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {votingSites.map((site) => (
                <div
                  key={site._id}
                  className="bg-white/3 border border-white/10 rounded-xl p-5 hover:border-green-500/30 transition-all"
                >
                  <h3 className="text-white font-bold text-sm mb-2">{site.name}</h3>
                  <p className="text-gray-500 text-xs mb-4 line-clamp-2">{site.description}</p>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/40 text-green-400 text-xs font-pixel rounded hover:bg-green-600/30 transition-colors"
                  >
                    VOTE NOW ↗
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {['TopG', 'Minecraft Server List', 'Planet Minecraft'].map((name, i) => (
                <div
                  key={i}
                  className="bg-white/3 border border-white/10 rounded-xl p-5"
                >
                  <h3 className="text-white font-bold text-sm mb-2">{name}</h3>
                  <p className="text-gray-500 text-xs mb-4">Vote for Redline SMP and earn rewards!</p>
                  <span className="inline-block px-4 py-2 bg-gray-800 border border-gray-700 text-gray-500 text-xs font-pixel rounded">
                    COMING SOON
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/vote"
              className="inline-block px-6 py-3 bg-white/5 border border-white/20 text-white font-pixel text-xs rounded-lg hover:bg-white/10 hover:border-white/30 transition-all"
            >
              VIEW ALL VOTING LINKS →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STORE PREVIEW ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">STORE</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              Get exclusive ranks, kits, and cosmetics to enhance your gameplay.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: 'Ranks', desc: 'Unlock exclusive perks and abilities with premium ranks.', icon: '👑' },
              { name: 'Kits', desc: 'Gain a competitive edge with powerful starter kits.', icon: '🎒' },
              { name: 'Cosmetics', desc: 'Stand out with unique cosmetic items and effects.', icon: '✨' },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-white/3 border border-white/10 rounded-xl p-6 hover:border-red-500/30 transition-all text-center"
              >
                <span className="text-4xl block mb-4">{item.icon}</span>
                <h3 className="text-white font-bold text-base mb-2">{item.name}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/store"
              className="inline-block px-8 py-3 bg-red-600 text-white font-pixel text-xs rounded-lg hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-all duration-300"
            >
              BROWSE STORE →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TUTORIAL ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">HOW TO JOIN</h2>
            <p className="text-gray-500 text-sm">Watch the tutorial to get started on Redline SMP.</p>
          </div>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="How to join Redline SMP"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/10 py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="https://i.postimg.cc/ZRSXwVzv/logo-nobg-png.png"
                alt="Redline SMP"
                className="h-8 w-auto"
              />
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 font-pixel text-xs text-gray-400">
              <Link to="/store" className="hover:text-white transition-colors">STORE</Link>
              <Link to="/vote" className="hover:text-white transition-colors">VOTE</Link>
              <Link to="/help" className="hover:text-white transition-colors">HELP</Link>
              <Link to="/terms" className="hover:text-white transition-colors">TERMS</Link>
              <a
                href="https://discord.gg/wBNMMj2PE4"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                DISCORD ↗
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-gray-600 text-xs">
            &copy; 2026 Redline SMP. Not affiliated with Mojang AB or Microsoft.
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
