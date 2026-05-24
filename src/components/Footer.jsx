import React from 'react';
export default function Footer(){
  return (
    <footer className="border-t mt-12 pt-6 text-sm muted text-center">© {new Date().getFullYear()} Your Name — Built with Astro + React</footer>
  );
}
