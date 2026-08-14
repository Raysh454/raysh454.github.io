// src/utils/content.js
//
// Single source of truth for content loading. Every page pulled its own glob and
// re-implemented sorting/slugging, which is how the homepage ended up showing
// "latest" writeups that were not sorted at all. Load and derive it once here.
import { parseCustomWriteup } from './markdown.js';

const writeupModules = import.meta.glob('../../content/writeups/*.md', { eager: true });
const projectModules = import.meta.glob('../../content/projects/*.md', { eager: true });

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** All complete writeups, newest first. */
export function getWriteups() {
  return Object.entries(writeupModules)
    .map(([filePath, mod]) => parseCustomWriteup(filePath, mod))
    .filter(w => !w.status.toLowerCase().includes('incomplete'))
    .sort((a, b) => {
      const at = a.dateObj ? a.dateObj.getTime() : 0;
      const bt = b.dateObj ? b.dateObj.getTime() : 0;
      if (bt !== at) return bt - at;
      return a.title.localeCompare(b.title);
    });
}

/** All projects — featured first, then newest first. */
export function getProjects() {
  return Object.values(projectModules)
    .map(mod => mod.frontmatter)
    .filter(fm => fm && fm.title)
    .map(fm => ({
      ...fm,
      slug: fm.slug ?? slugify(fm.title),
      tech: Array.isArray(fm.tech) ? fm.tech : [],
      featured: fm.featured === true,
      badge: fm.badge ?? null
    }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
}

export function getFeaturedProjects() {
  return getProjects().filter(p => p.featured);
}

/**
 * Headline numbers, derived from the content rather than hardcoded — the site
 * previously advertised "100+ writeups" against 59 files, which is the kind of
 * inflation that costs credibility in this field.
 */
export function getStats() {
  const writeups = getWriteups();
  const projects = getProjects();

  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0, Insane: 0 };
  const byOs = { Windows: 0, Linux: 0 };

  for (const w of writeups) {
    const difficulty = (w.difficulty || '').trim();
    if (difficulty in byDifficulty) byDifficulty[difficulty] += 1;

    const os = (w.os || '').toLowerCase();
    if (os.includes('win')) byOs.Windows += 1;
    else if (os.includes('lin')) byOs.Linux += 1;
  }

  return {
    writeups: writeups.length,
    projects: projects.length,
    activeDirectory: writeups.filter(w => w.isActiveDirectory).length,
    hardOrAbove: byDifficulty.Hard + byDifficulty.Insane,
    byDifficulty,
    byOs
  };
}
