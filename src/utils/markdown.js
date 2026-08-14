// src/utils/markdown.js
import path from 'path';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Writeup dates are authored as `DD-MM_YYYY` (e.g. `05-08_2024` = 5 Aug 2024),
 * which `new Date()` cannot parse — it returns Invalid Date, silently breaking
 * every sort that touches it. Parse it explicitly, and fall back to the native
 * parser for any entry that uses a saner format.
 */
export function parseWriteupDate(raw) {
  if (!raw) return null;

  const custom = raw.trim().match(/^(\d{1,2})-(\d{1,2})[_-](\d{4})$/);
  if (custom) {
    const [, day, month, year] = custom;
    const parsed = new Date(Date.UTC(+year, +month - 1, +day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const native = new Date(raw);
  return Number.isNaN(native.getTime()) ? null : native;
}

/** `5 Aug 2024` — stable across locales, unlike toLocaleDateString. */
export function formatDate(date) {
  if (!date) return '';
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

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

  // 4. Detect Active Directory chains from the body so the "AD chains" count on
  //    the site is derived from the writeups themselves rather than hand-kept.
  const isActiveDirectory = /active directory|kerberoast|bloodhound|secretsdump|dcsync|asreproast|ntlmrelay|impacket|domain controller/i
    .test(rawText);

  // 5. Generate a completely bulletproof slug parameter
  // If fm.slug doesn't exist, compute it from the clean filename
  const dynamicSlug = filename
    .toLowerCase()
    .replace(/\s+/g, '-')       // Spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')  // Wipe special characters
    .trim();

  const rawDateValue = fm.date || rawDate;
  const dateObj = parseWriteupDate(rawDateValue);

  return {
    title: fm.title || filename,
    status: fm.status || status,
    date: rawDateValue,
    dateObj,
    dateDisplay: formatDate(dateObj) || rawDateValue,
    dateISO: dateObj ? dateObj.toISOString().slice(0, 10) : '',
    platform: fm.platform || platform,
    alias: fm.alias || alias,
    os: fm.os || os,
    difficulty: fm.difficulty || difficulty,
    ip: fm.ip || ip,
    isActiveDirectory,
    slug: fm.slug || dynamicSlug || 'fallback-slug'
  };
}
