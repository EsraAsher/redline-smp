import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchVotingSites } from '../api';

const VotePage = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotingSites()
      .then(setSites)
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="relative z-10 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 max-w-5xl mx-auto min-h-screen">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-pixel text-xl sm:text-3xl text-red-400 drop-shadow-[0_0_12px_rgba(255,0,0,0.5)] mb-3">
          VOTE FOR REDLINE SMP
        </h1>
        <p className="text-gray-400 text-sm max-w-xl">
          Vote on the sites below to help us grow and earn in-game rewards automatically.
          You can vote once per day on each site.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-5 sm:p-6 mb-10">
        <h2 className="font-pixel text-xs text-red-400 mb-4">HOW IT WORKS</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Vote Daily', desc: 'Click a vote link and enter your username.' },
            { step: '2', title: 'Auto Rewards', desc: 'Rewards are delivered to you in-game automatically.' },
            { step: '3', title: 'Help Us Grow', desc: 'Each vote boosts our server ranking.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center font-pixel text-xs text-red-400 shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{s.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voting sites */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500 font-pixel text-sm animate-pulse">Loading voting sites...</div>
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">🗳️</span>
          <p className="text-gray-500 font-pixel text-xs mb-2">No voting sites available yet</p>
          <p className="text-gray-600 text-xs">Check back soon!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((site) => (
            <div
              key={site._id}
              className="bg-dark-surface border border-white/10 rounded-xl p-5 sm:p-6 hover:border-green-500/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-bold text-base">{site.name}</h3>
                <span className="text-green-400 text-xs font-pixel bg-green-500/10 px-2 py-0.5 rounded">ACTIVE</span>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                {site.description || 'Vote for Redline SMP and earn in-game rewards!'}
              </p>

              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-green-600/20 border border-green-500/40 text-green-400 font-pixel text-sm rounded-lg hover:bg-green-600/30 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all text-center block"
              >
                VOTE NOW ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default VotePage;
