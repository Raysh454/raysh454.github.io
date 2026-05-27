import React, { useState } from 'react';

export default function Nav() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex justify-center w-full pt-6 pb-2 relative z-50">
      <nav className="nav-container flex flex-col md:flex-row md:items-center md:justify-between w-[92%] max-w-4xl px-4 py-3 rounded-3xl">
        
        {/* Left Side: Online Status Indicator */}
        <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 border-r border-white/10">
          <span className="online-dot"></span>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">System Online</span>
        </div>

        {/* Center: Interactive Links */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2 text-sm">
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

        {/* Mobile: Status + Menu Toggle */}
        <div className="flex md:hidden items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2">
            <span className="online-dot"></span>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">System Online</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-white/10">
              <div className="flex flex-col text-right leading-tight">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Access Level</span>
                <span className="text-[10px] text-accent font-mono font-medium">Guest_User</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                <svg 
                  width="10" 
                  height="10" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-zinc-200 hover:text-accent transition-colors"
              aria-expanded={isMobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setIsMobileOpen((open) => !open)}
            >
              <span className="sr-only">Toggle navigation</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18"></path>
                <path d="M3 12h18"></path>
                <path d="M3 18h18"></path>
              </svg>
            </button>
          </div>
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

        {/* Mobile: Links Panel */}
        <div
          id="mobile-nav"
          className={`md:hidden w-full pt-3 ${isMobileOpen ? 'block' : 'hidden'}`}
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 px-2 py-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 bg-white/5 sm:hidden">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Access Level</span>
                <span className="text-[11px] text-accent font-mono font-medium">Guest_User</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>
            <a href="/" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-xl transition-colors duration-200">
              Home
            </a>
            <a href="/projects" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-xl transition-colors duration-200">
              Projects
            </a>
            <a href="/writeups" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-xl transition-colors duration-200">
              Logs
            </a>
            <a href="/about" className="nav-link px-4 py-2 text-zinc-300 hover:text-accent font-medium rounded-xl transition-colors duration-200">
              About
            </a>
          </div>
        </div>

      </nav>
    </div>
  );
}
