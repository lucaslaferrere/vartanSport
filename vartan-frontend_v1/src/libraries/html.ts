// Escapes a value for interpolation into an HTML string.
//
// Shipping labels are built as raw HTML and written with document.write into a
// window opened from this app, which shares its origin. An unescaped value that
// came from client-supplied data would therefore run as script with access to
// the session token in localStorage.
export const escapeHtml = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
