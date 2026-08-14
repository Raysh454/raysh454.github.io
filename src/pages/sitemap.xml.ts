import site from '../data/site.json';
import { getWriteups, getProjects } from '../utils/content.js';

export async function GET() {
  const base = site.siteUrl.replace(/\/$/, '');

  // Same defect as the feed: writeups were being filtered out entirely because they
  // carry no markdown frontmatter, so none of them were ever in the sitemap.
  const pages: Array<{ path: string; lastmod?: string; priority: string }> = [
    { path: '/', priority: '1.0' },
    { path: '/about', priority: '0.8' },
    { path: '/projects', priority: '0.9' },
    { path: '/writeups', priority: '0.9' }
  ];

  for (const project of getProjects()) {
    pages.push({
      path: `/projects/${project.slug}`,
      lastmod: project.date ? String(project.date).slice(0, 10) : undefined,
      priority: project.featured ? '0.8' : '0.6'
    });
  }

  for (const writeup of getWriteups()) {
    pages.push({
      path: `/writeups/${writeup.slug}`,
      lastmod: writeup.dateISO || undefined,
      priority: '0.6'
    });
  }

  const urlsXml = pages.map(page => `
  <url>
    <loc>${escapeXml(base + page.path)}</loc>${page.lastmod ? `
    <lastmod>${page.lastmod}</lastmod>` : ''}
    <priority>${page.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
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
