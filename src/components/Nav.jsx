import { useState, useEffect } from 'react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/writeups', label: 'Writeups' },
  { href: '/about', label: 'About' }
];

function isActive(href, path) {
  if (href === '/') return path === '/' || path === '';
  return path.startsWith(href);
}

export default function Nav({ currentPath = '/', email = '' }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [path, setPath] = useState(currentPath);

  // Keep the active state correct across client-side view transitions.
  useEffect(() => {
    const sync = () => {
      setPath(window.location.pathname);
      setIsMobileOpen(false);
    };
    sync();
    document.addEventListener('astro:page-load', sync);
    return () => document.removeEventListener('astro:page-load', sync);
  }, []);

  return (
    <div className="flex justify-center w-full pt-6 pb-2 relative z-50">
      <nav className="nav-container flex flex-col md:flex-row md:items-center md:justify-between w-[92%] max-w-4xl px-3 py-2.5 rounded-3xl">

        {/* Left: status */}
        <div className="hidden md:flex items-center gap-2.5 pl-3 pr-4 border-r border-white/10">
          <span className="online-dot"></span>
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
            Available
          </span>
        </div>

        {/* Center: links */}
        <div className="hidden md:flex items-center gap-1 text-sm">
          {LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href, path) ? 'page' : undefined}
              className={`nav-link px-4 py-2 font-medium rounded-full transition-colors duration-200 ${
                isActive(link.href, path) ? 'is-active text-accent' : 'text-zinc-300 hover:text-accent'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: contact CTA */}
        <div className="hidden md:flex items-center pl-4 border-l border-white/10">
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold hover:bg-accent/20 hover:border-accent/50 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 6-10 7L2 6"></path>
            </svg>
            Get in touch
          </a>
        </div>

        {/* Mobile bar */}
        <div className="flex md:hidden items-center justify-between w-full gap-3 px-1">
          <a href="/" className="flex items-center gap-2">
            <span className="online-dot"></span>
            <span className="text-xs font-bold text-white tracking-tight">Shehryar Baloch</span>
          </a>
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 text-zinc-200 hover:text-accent hover:border-accent/40 transition-colors"
            aria-expanded={isMobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMobileOpen(open => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            {isMobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18"></path>
                <path d="M3 12h18"></path>
                <path d="M3 18h18"></path>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile panel */}
        <div id="mobile-nav" className={`md:hidden w-full ${isMobileOpen ? 'block pt-3' : 'hidden'}`}>
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 p-2">
            {LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href, path) ? 'page' : undefined}
                className={`px-4 py-2.5 font-medium rounded-xl transition-colors duration-200 ${
                  isActive(link.href, path)
                    ? 'text-accent bg-accent/10'
                    : 'text-zinc-300 hover:text-accent hover:bg-white/5'
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href={`mailto:${email}`}
              className="mt-1 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/25 text-accent font-semibold text-center text-sm"
            >
              Get in touch
            </a>
          </div>
        </div>

      </nav>
    </div>
  );
}
