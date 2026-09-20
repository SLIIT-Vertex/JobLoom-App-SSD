import DOMPurify from 'dompurify';

/**
 * Same allow-list as the backend job-description sanitizer.
 * html-react-parser does not sanitize; run this before parse().
 */
export const JOB_DESCRIPTION_PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'hr',
  ],
  ALLOWED_ATTR: ['style'],
  ALLOW_DATA_ATTR: false,
};

let styleHookRegistered = false;

const registerStyleHook = () => {
  if (styleHookRegistered || typeof window === 'undefined') return;
  styleHookRegistered = true;

  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return;

    const match = String(data.attrValue || '').match(
      /^\s*text-align\s*:\s*(left|right|center|justify)\s*;?\s*$/i
    );

    if (!match) {
      data.keepAttr = false;
      return;
    }

    data.attrValue = `text-align: ${match[1].toLowerCase()}`;
  });
};

/**
 * Strip dangerous markup from a job description before rendering.
 * @param {unknown} html
 * @returns {string}
 */
export const sanitizeJobDescription = html => {
  if (typeof html !== 'string' || !html) return '';
  registerStyleHook();
  return DOMPurify.sanitize(html, JOB_DESCRIPTION_PURIFY_CONFIG);
};
