import site from '../data/site.json';
import { getWriteups, getProjects } from '../utils/content.js';

export async function GET() {
  const base = site.siteUrl.replace(/\/$/, '');

  // Writeups keep their metadata in a fenced block rather than frontmatter, so the
  // previous `if (!fm.title) continue` guard silently dropped every single one of
  // them from the feed. Go through the shared loader instead.
  const items = [
    ...getWriteups().map(w => ({
      title: w.title,
      link: `${base}/writeups/${w.slug}`,
      date: w.dateObj,
      description: `${w.difficulty || ''} ${w.os || ''} ${w.platform || 'HackTheBox'} machine — full attack chain writeup.`.trim()
    })),
    ...getProjects().map(p => ({
      title: p.title,
      link: `${base}/projects/${p.slug}`,
      date: p.date ? new Date(p.date) : null,
      description: p.summary ?? ''
    }))
  ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  const itemsXml = items.map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>${item.date ? `
      <pubDate>${item.date.toUTCString()}</pubDate>` : ''}
      <description>${escapeXml(item.description)}</description>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${escapeXml(base)}</link>
    <atom:link href="${escapeXml(base)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(site.description)}</description>
    <language>en</language>${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

function escapeXml(unsafe: unknown): string {
  return String(unsafe ?? '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
