const { URL } = require("url");

module.exports = function rewriteHtml(html, baseUrl) {
  return html.replace(
    /(href|src|action)=["']([^"']+)["']/gi,
    (m, attr, link) => {
      if (
        link.startsWith("data:") ||
        link.startsWith("mailto:") ||
        link.startsWith("javascript:")
      ) return m;

      try {
        const abs = new URL(link, baseUrl).href;
        return `${attr}="/asset?url=${encodeURIComponent(abs)}"`;
      } catch {
        return m;
      }
    }
  );
};
