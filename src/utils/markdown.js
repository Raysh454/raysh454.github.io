// src/utils/markdown.js
import path from 'path';

export function parseCustomWriteup(filePath, fileInstance) {
  // 1. Safely extract filename fallback
  const filename = filePath ? path.basename(filePath, '.md') : 'unnamed_log';
  const fm = fileInstance?.frontmatter || {};
  
  // 2. Safe string check for raw file content
  let rawText = '';
  if (fileInstance && typeof fileInstance.rawContent === 'function') {
    rawText = fileInstance.rawContent();
  }

  // 3. Robust regex scrapers (with null guards)
  const statusMatch = rawText.match(/^Status:\s*([^\n\r]+)/m);
  const status = statusMatch ? statusMatch[1].trim() : 'Complete';

  const dateMatch = rawText.match(/^Date:\s*([^\n\r]+)/m);
  const rawDate = dateMatch ? dateMatch[1].trim() : '';

  const platformMatch = rawText.match(/^Platform:\s*([^\n\r]+)/m);
  const platform = platformMatch ? platformMatch[1].trim() : '';

  const aliasMatch = rawText.match(/^Alias:\s*([^\n\r]+)/m);
  const alias = aliasMatch ? aliasMatch[1].trim() : '';

  const osMatch = rawText.match(/^OS:\s*([^\n\r]+)/m);
  const os = osMatch ? osMatch[1].trim() : '';

  const difficultyMatch = rawText.match(/^Difficulty:\s*([^\n\r]+)/m);
  const difficulty = difficultyMatch ? difficultyMatch[1].trim() : '';

  const ipMatch = rawText.match(/^IP:\s*([^\n\r]+)/m);
  const ip = ipMatch ? ipMatch[1].trim() : '';

  // 4. Generate a completely bulletproof slug parameter
  // If fm.slug doesn't exist, compute it from the clean filename
  const dynamicSlug = filename
    .toLowerCase()
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')  // Wipe special characters
    .trim();

  return {
    title: fm.title || filename,
    status: fm.status || status,
    date: fm.date || rawDate,
    platform: fm.platform || platform,
    alias: fm.alias || alias,
    os: fm.os || os,
    difficulty: fm.difficulty || difficulty,
    ip: fm.ip || ip,
    slug: fm.slug || dynamicSlug || 'fallback-slug' 
  };
}
