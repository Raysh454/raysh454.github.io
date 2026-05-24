export async function GET(){
  const site = (await import('../data/site.json')).default || (await import('../data/site.json'));
  const writeups = import.meta.glob('../../content/writeups/*.md', { eager: true });
  const projects = import.meta.glob('../../content/projects/*.md', { eager: true });

  const pages = [ '/', '/about', '/projects', '/writeups' ];

  for (const m of Object.values(writeups)){
    const fm = m.frontmatter ?? {};
    if (!fm.title) continue;
    const slug = fm.slug ?? fm.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    pages.push(`/writeups/${slug}`);
  }
  for (const m of Object.values(projects)){
    const fm = m.frontmatter ?? {};
    if (!fm.title) continue;
    const slug = fm.slug ?? fm.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    pages.push(`/projects/${slug}`);
  }

  const urlsXml = pages.map(p => `\n  <url>\n    <loc>${escapeXml(site.siteUrl.replace(/\/$/,'') + p)}</loc>\n  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

function escapeXml(unsafe){ return (unsafe||'').toString().replace(/[<>&'\"]/g, function(c){ switch(c){ case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case "'": return '&apos;'; case '"': return '&quot;'; } }); }
