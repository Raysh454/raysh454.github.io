import React from 'react';

export default function Nav() {
  return (
    <div className="flex justify-center w-full pt-6 pb-2 relative z-50">
      <nav className="nav-container flex items-center justify-between w-[92%] max-w-4xl px-4 py-3 rounded-full">
        
        {/* Left Side: Online Status Indicator */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 border-r border-white/10">
          <span className="online-dot"></span>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">System Online</span>
        </div>

        {/* Center: Interactive Links */}
        <div className="flex items-center gap-1 sm:gap-2 text-sm">
          <a href="/" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-full transition-colors duration-200">
            Home
          </a>
          <a href="/projects" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-full transition-colors duration-200">
            Projects
          </a>
          <a href="/writeups" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-full transition-colors duration-200">
            Logs
          </a>
          <a href="/about" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-full transition-colors duration-200">
            About
          </a>
        </div>

        {/* Right Side: Cyber Status Badge */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1 border-l border-white/10">
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Access Level</span>
            <span className="text-[11px] text-accent font-mono font-medium">Guest_User</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="animate-pulse"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

      </nav>
    </div>
  );
}
