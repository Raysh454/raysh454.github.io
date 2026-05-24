export async function GET(){
  const site = (await import('../data/site.json')).default || (await import('../data/site.json'));
  const writeups = import.meta.glob('../../content/writeups/*.md', { eager: true });
  const projects = import.meta.glob('../../content/projects/*.md', { eager: true });

  const items = [];
  for (const m of Object.values(writeups)){
    const fm = m.frontmatter ?? {};
    if (!fm.title) continue;
    const slug = fm.slug ?? fm.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    items.push({ title: fm.title, link: `${site.siteUrl.replace(/\/$/,'')}/writeups/${slug}`, date: fm.date, description: fm.summary ?? '' });
  }
  for (const m of Object.values(projects)){
    const fm = m.frontmatter ?? {};
    if (!fm.title) continue;
    const slug = fm.slug ?? fm.title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    items.push({ title: fm.title, link: `${site.siteUrl.replace(/\/$/,'')}/projects/${slug}`, date: fm.date, description: fm.summary ?? '' });
  }

  items.sort((a,b)=> new Date(b.date) - new Date(a.date));

  const itemsXml = items.map(it=> `\n    <item>\n      <title>${escapeXml(it.title)}</title>\n      <link>${escapeXml(it.link)}</link>\n      <guid isPermaLink="true">${escapeXml(it.link)}</guid>\n      <pubDate>${new Date(it.date).toUTCString()}</pubDate>\n      <description>${escapeXml(it.description)}</description>\n    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${escapeXml(site.title)}</title>\n    <link>${escapeXml(site.siteUrl)}</link>\n    <description>${escapeXml(site.description)}</description>${itemsXml}\n  </channel>\n</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

function escapeXml(unsafe){ return (unsafe||'').toString().replace(/[<>&'\"]/g, function(c){ switch(c){ case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case "'": return '&apos;'; case '"': return '&quot;'; } }); }
