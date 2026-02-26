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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:hidden mb-6">
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
                    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.32-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.21.17.32.25.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.67 1.19 1.07 1.74.02.03.05.04.08.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.43-4.53-.72-8.48-3.04-11.95-.01-.01-.02-.02-.04-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z"/>
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
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.32-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.21.17.32.25.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.67 1.19 1.07 1.74.02.03.05.04.08.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.43-4.53-.72-8.48-3.04-11.95-.01-.01-.02-.02-.04-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z"/>
              </svg>
            </div>
          </a>
        </div>
      </div>

      {/* ═══════════════════ CTA BUTTONS ═══════════════════ */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-8 sm:pb-10 px-4">
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

      {/* ═══════════════════ HOW TO BUY (tutorial) ═══════════════════ */}
      <section className="py-12 sm:py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">HOW TO BUY</h2>
            <p className="text-gray-500 text-sm">Watch the video for buying guide and tutorial.</p>
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
            <h2 className="font-pixel text-sm sm:text-base text-red-400 mb-3">WHAT WE OFFER</h2>
            <div className="w-16 h-0.5 bg-red-500/50 mx-auto" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: '⚔️',
                title: 'SURVIVAL',
                desc: 'Classic survival gameplay with custom enchants, economy, and a friendly community to build with.',
              },
              {
                icon: '🎉',
                title: 'EVENTS',
                desc: 'Weekly events including PvP tournaments, build contests, and seasonal challenges with exclusive rewards.',
              },
              {
                icon: '💬',
                title: 'COMMUNITY',
                desc: 'An active Discord server, dedicated staff team, and a welcoming environment for all players.',
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
