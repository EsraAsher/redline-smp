import { useState, useEffect } from 'react';

const UsernameModal = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if username is already stored (optional)
    const stored = localStorage.getItem('mc_username');
    if (!stored) {
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('mc_username', username);
      setIsOpen(false);
      onClose && onClose(username);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-surface border-2 border-neon-purple p-8 rounded-lg shadow-[0_0_20px_rgba(176,38,255,0.5)] max-w-md w-full relative animate-bounce-in">
        <h2 className="text-2xl font-pixel text-neon-cyan mb-6 text-center">Enter Username</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2 font-pixel text-xs">Minecraft Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-neon-purple/50 rounded p-3 text-white focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all font-mono"
              placeholder="Steve"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-neon-purple/20 hover:bg-neon-purple/40 border border-neon-purple text-neon-cyan font-pixel py-3 rounded transition-all hover:shadow-[0_0_15px_rgba(176,38,255,0.6)] transform hover:-translate-y-1"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;
