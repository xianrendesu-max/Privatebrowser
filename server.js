const express = require("express");
const fetch = require("node-fetch");
const rewriteHtml = require("./rewrite");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* HTMLページ取得 */
app.get("/page", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await r.text();
    const rewritten = rewriteHtml(html, url);

    res.json({
      url,
      secure: url.startsWith("https://"),
      html: rewritten
    });
  } catch {
    res.status(500).json({ error: "Fetch failed" });
  }
});

/* CSS / JS / 画像 */
app.get("/asset", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.sendStatus(400);

  try {
    const r = await fetch(url);
    res.set("content-type", r.headers.get("content-type"));
    r.body.pipe(res);
  } catch {
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log("Mini Chrome running on port " + PORT);
});
