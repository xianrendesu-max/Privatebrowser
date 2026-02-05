const express = require("express");
const fetch = require("node-fetch");
const rewriteHtml = require("./rewrite");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* HTMLページ取得 */
app.get("/page", async (req, res) => {
  let url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL required" });

  const isUrl = /^https?:\/\//i.test(url);
  if (!isUrl) {
    const query = encodeURIComponent(url);
    url = `https://www.bing.com/search?q=${query}`;
  }

  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 });
    const html = await r.text();

    // rewriteHtmlでHTML内の全アセットURLを /asset?url=... に書き換える
    const rewritten = rewriteHtml ? rewriteHtml(html, url) : html;

    res.json({
      url,
      secure: url.startsWith("https://"),
      html: rewritten
    });
  } catch (err) {
    console.error("Fetch failed:", err);

    // fetch失敗時は簡易HTMLで返す
    const fallbackHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>ページ取得失敗</title>
        </head>
        <body>
          <h1>ページを取得できませんでした</h1>
          <p>URL: ${url}</p>
          <p>ネットワーク制限や規制の可能性があります。</p>
          <p>もう一度試すか、別のURLを入力してください。</p>
        </body>
      </html>
    `;

    res.json({
      url,
      secure: url.startsWith("https://"),
      html: rewriteHtml ? rewriteHtml(fallbackHtml, url) : fallbackHtml
    });
  }
});

/* CSS / JS / 画像 / WASM / ゲーム用アセット */
app.get("/asset", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.sendStatus(400);

  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 10000 });
    res.set("content-type", r.headers.get("content-type"));
    r.body.pipe(res);
  } catch (err) {
    console.error("Asset fetch failed:", err);
    res.status(502).send("アセットを取得できませんでした");
  }
});

app.listen(PORT, () => {
  console.log("Mini Chrome running on port " + PORT);
});
