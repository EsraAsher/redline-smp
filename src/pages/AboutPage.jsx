import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <main className="relative z-10 pt-28 pb-20 px-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <h1 className="text-4xl md:text-5xl font-pixel text-center text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] mb-4">
          ABOUT US
        </h1>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Learn more about the Redline SMP community.
        </p>

        {/* Hero Statement */}
        <div className="bg-dark-surface border border-red-500/20 rounded-xl p-10 mb-12 text-center">
          <img
            src="https://i.postimg.cc/ZRSXwVzv/logo-nobg-png.png"
            alt="Redline SMP Logo"
            className="w-auto h-20 mx-auto mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]"
          />
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            <span className="text-red-400 font-bold">Redline SMP</span> is a premium Minecraft survival multiplayer
            server built for players who crave adventure, community, and competition. We provide a unique experience
            with custom plugins, events, and a passionate team.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: 'PLAYERS', value: '1,000+', icon: '👥' },
            { label: 'UPTIME', value: '99.9%', icon: '⚡' },
            { label: 'EVENTS', value: '50+', icon: '🏆' },
            { label: 'SINCE', value: '2025', icon: '📅' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-dark-surface border border-red-500/20 rounded-xl p-6 text-center hover:border-red-500/50 transition-all hover:shadow-[0_0_15px_rgba(255,0,0,0.1)]"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="font-pixel text-xs text-red-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-2xl font-pixel text-red-400 text-center mb-10 drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
            WHAT WE OFFER
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'SURVIVAL',
                icon: '⚔️',
                desc: 'Classic survival gameplay with custom enchants, economy, and a friendly community to build with.',
              },
              {
                title: 'EVENTS',
                icon: '🎉',
                desc: 'Weekly events including PvP tournaments, build contests, and seasonal challenges with exclusive rewards.',
              },
              {
                title: 'COMMUNITY',
                icon: '💬',
                desc: 'An active Discord server, dedicated staff team, and a welcoming environment for all players.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-dark-surface border border-red-500/20 rounded-xl p-8 hover:border-red-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,0,0.1)] group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 inline-block transition-transform">{feature.icon}</div>
                <h3 className="font-pixel text-sm text-red-400 mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Team */}
        <div className="mb-16">
          <h2 className="text-2xl font-pixel text-red-400 text-center mb-10 drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
            OUR TEAM
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { name: 'Owner', role: 'FOUNDER', skin: '🎮' },
              { name: 'Admin', role: 'ADMINISTRATOR', skin: '🛡️' },
              { name: 'Developer', role: 'DEVELOPER', skin: '💻' },
            ].map((member) => (
              <div
                key={member.role}
                className="bg-dark-surface border border-red-500/20 rounded-xl p-6 text-center hover:border-red-500/40 transition-all"
              >
                <div className="text-5xl mb-4">{member.skin}</div>
                <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                <span className="font-pixel text-xs text-red-400">{member.role}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs text-center mt-4">
            Replace names and roles with your actual team members.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center bg-dark-surface border border-red-500/20 rounded-xl p-10">
          <h2 className="text-xl font-pixel text-red-400 mb-4">READY TO JOIN?</h2>
          <p className="text-gray-400 mb-6">Connect to <span className="text-white font-mono font-bold">play.redline.gg</span> and start your adventure today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="px-8 py-3 bg-red-500/20 border border-red-500 text-red-400 font-pixel text-sm rounded hover:bg-red-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)]"
            >
              VISIT STORE
            </Link>
            <a
              href="https://discord.gg/wBNMMj2PE4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-[#5865F2]/20 border border-[#5865F2] text-[#5865F2] font-pixel text-sm rounded hover:bg-[#5865F2] hover:text-white transition-all duration-300"
            >
              JOIN DISCORD
            </a>
          </div>
        </div>
      </main>
  );
};

export default AboutPage;
