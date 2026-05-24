import React from 'react';
export default function Header({ children }){
  return (
    <header className="py-12">
      <div className="container mx-auto">{children}</div>
    </header>
  );
}
