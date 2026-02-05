const { JSDOM } = require("jsdom");
const urlModule = require("url");

/**
 * rewriteHtml
 * HTML内の全アセットURLを /asset?url=絶対URL に書き換える
 * @param {string} html 元HTML
 * @param {string} baseUrl ページの元URL
 * @returns {string} 書き換え後HTML
 */
function rewriteHtml(html, baseUrl) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // 属性を置換する対象
  const attrs = ["src", "href", "poster", "data", "srcset"];

  attrs.forEach(attr => {
    const elements = document.querySelectorAll(`[${attr}]`);
    elements.forEach(el => {
      let val = el.getAttribute(attr);
      if (!val) return;

      // 相対パスなら絶対URLに変換
      val = urlModule.resolve(baseUrl, val);

      // /asset?url=... に書き換え
      el.setAttribute(attr, `/asset?url=${encodeURIComponent(val)}`);
    });
  });

  // inline CSS 内の url(...) も書き換える
  const styles = document.querySelectorAll("style");
  styles.forEach(style => {
    style.textContent = style.textContent.replace(
      /url\((['"]?)(.*?)\1\)/g,
      (match, quote, path) => {
        const abs = urlModule.resolve(baseUrl, path);
        return `url(${quote}/asset?url=${encodeURIComponent(abs)}${quote})`;
      }
    );
  });

  // inline style 属性も書き換え
  const inlineStyles = document.querySelectorAll("[style]");
  inlineStyles.forEach(el => {
    let style = el.getAttribute("style");
    style = style.replace(/url\((['"]?)(.*?)\1\)/g, (match, quote, path) => {
      const abs = urlModule.resolve(baseUrl, path);
      return `url(${quote}/asset?url=${encodeURIComponent(abs)}${quote})`;
    });
    el.setAttribute("style", style);
  });

  return dom.serialize();
}

module.exports = rewriteHtml;
