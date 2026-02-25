import { useState } from 'react';

const Hero = () => {
  const [copied, setCopied] = useState(false);
  const serverIP = "node-1.zenithcloud.fun:25514";

  const handleCopy = () => {
    navigator.clipboard.writeText('mc.redlinesmp.fun');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-[45vh] sm:min-h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">

      {/* Main hero layout: widgets + logo */}
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
            <span className="text-gray-400 text-xs">
              {copied ? 'Copied!' : 'Click to copy'}
            </span>
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
  );
};

export default Hero;
