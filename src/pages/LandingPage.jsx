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
    navigator.clipboard.writeText('mc.redlinesmp.fun');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative z-10 w-full">
      {/* ═══════════════════ HERO (from store) ═══════════════════ */}
      <div className="relative min-h-[45vh] sm:min-h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="relative z-10 flex items-center justify-center w-full px-4 mt-12 sm:mt-16">
          {/* Left Widget - Server IP */}
          <div
            onClick={handleCopy}
            className="hidden lg:flex items-center gap-3 cursor-pointer transition-transform duration-300 hover:scale-105 absolute left-[8%] xl:left-[12%]"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-gray-900 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm tracking-wide">MC.REDLINESMP.FUN</span>
              <span className="text-gray-400 text-xs">{copied ? 'Copied!' : 'Click to copy'}</span>
            </div>
          </div>

          {/* Center Logo */}
          <div className="text-center">
            <img
              src="https://i.postimg.cc/3JjMvMM7/nobg-logo-hero-sec.png"
              alt="Redline SMP"
              className="w-auto h-32 sm:h-44 md:h-57 lg:h-62 mx-auto mb-4 sm:mb-8 animate-pulse drop-shadow-[0_0_10px_rgba(255,0,0,0.7)]"
            />
            <p className="text-sm sm:text-base md:text-xl text-gray-300 mb-4 sm:mb-8 max-w-2xl mx-auto px-2 font-light tracking-wide leading-relaxed text-center">
              The ultimate survival voyage begins here. In the New World, only the strongest survive—advance your gear and prepare for the revolution.
            </p>

            {/* Mobile-only server IP + Discord buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:hidden">
              <div
                onClick={handleCopy}
                className="flex items-center gap-3 cursor-pointer transition-transform duration-300 hover:scale-105"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-gray-900 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="8,5 19,12 8,19" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">MC.REDLINESMP.FUN</span>
                  <span className="text-gray-400 text-xs">{copied ? 'Copied!' : 'Click to copy'}</span>
                </div>
              </div>

              <a
                href="https://discord.gg/wBNMMj2PE4"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-transform duration-300 hover:scale-105"
              >
                <div className="flex flex-col text-right">
                  <span className="text-white font-bold text-sm">JOIN OUR DISCORD</span>
                  <span className="text-gray-400 text-xs">Click to join</span>
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                  </svg>
                </div>
              </a>
            </div>
          </div>

          {/* Right Widget - Discord */}
          <a
            href="https://discord.gg/wBNMMj2PE4"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-3 transition-transform duration-300 hover:scale-105 absolute right-[8%] xl:right-[12%]"
          >
            <div className="flex flex-col text-right">
              <span className="text-white font-bold text-sm tracking-wide">JOIN OUR DISCORD</span>
              <span className="text-gray-400 text-xs">Click to join</span>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
            </div>
          </a>
        </div>
      </div>

      {/* ═══════════════════ HOW TO BUY (tutorial) ═══════════════════ */}
      <section className="py-12 sm:py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">HOW TO BUY</h2>
            <p className="text-gray-500 text-sm">Watch the tutorial to get started on Redline SMP.</p>
          </div>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="How to buy on Redline SMP"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════ VOTING PREVIEW ═══════════════════ */}
      <section className="py-12 sm:py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
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
      <section className="py-12 sm:py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
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

      {/* ═══════════════════ ABOUT REDLINE SMP ═══════════════════ */}
      <section className="py-12 sm:py-16 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
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
