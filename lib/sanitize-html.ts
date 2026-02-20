/**
 * Sanitasi HTML untuk konten artikel (mencegah XSS).
 * Strip tag berbahaya dan atribut event; izinkan tag konten umum.
 */
const DANGEROUS_TAGS = /<\/?(script|iframe|object|embed|form|input|button|meta|link|style)[^>]*>/gi;
const EVENT_ATTR = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
const EVENT_ATTR_JS = /\s+on\w+\s*=\s*[^\s>]+/gi;

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") return "";
  let out = html
    .replace(DANGEROUS_TAGS, "")
    .replace(EVENT_ATTR, "")
    .replace(EVENT_ATTR_JS, "");
  return out;
}
