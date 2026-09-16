import { chromium } from "playwright";

const browser = await chromium.launch();

async function probe(path, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://localhost:4789${path}`, { waitUntil: "networkidle" });
  const out = await page.evaluate(() => {
    const results = {};
    // 1. any vertical writing-mode text? (reference/models "purple vertical text")
    const vertical = [...document.querySelectorAll("*")].filter(
      (el) => getComputedStyle(el).writingMode !== "normal" || getComputedStyle(el).textOrientation !== "mixed"
    );
    results.verticalWritingElements = vertical.map((el) => ({
      tag: el.tagName,
      cls: String(el.className).slice(0, 80),
      text: (el.textContent || "").trim().slice(0, 60),
      wm: getComputedStyle(el).writingMode,
    }));

    // 2. purple/violet-ish colored text nodes computed color (any color whose L is mid and hue high)
    function rgbOf(el) {
      const c = el ? getComputedStyle(el).color : "";
      const m = c.match(/[\d.]+/g);
      return m ? { r: +m[0], g: +m[1], b: +m[2], color: c } : null;
    }
    const purpleSpots = [];
    for (const el of document.querySelectorAll("span, p, h1, h2, h3, h4, li, a, div")) {
      const col = rgbOf(el);
      if (!col || col.color.includes("oklch")) continue;
      // heuristic purple: b notably higher than r and g
      if (col.b > col.r + 30 && col.b > col.g + 10) {
        const txt = (el.textContent || "").trim();
        if (txt && txt.length > 0 && txt.length < 80) {
          purpleSpots.push({ cls: String(el.className).slice(0, 60), color: col.color, text: txt.slice(0, 50), tag: el.tagName });
        }
      }
    }
    results.purpleText = purpleSpots.slice(0, 15);

    // 3. Elements that LOOK like a long vertical marker (tall + narrow) typical of vertical text
    const tallNarrow = [];
    for (const el of document.querySelectorAll("div, span, svg")) {
      const r = el.getBoundingClientRect();
      if (r.width > 2 && r.width < 40 && r.height > 60 && r.height < 500) {
        tallNarrow.push({ tag: el.tagName, cls: String(el.className).slice(0, 70), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || "").trim().slice(0, 40) });
      }
    }
    results.tallNarrow = tallNarrow.slice(0, 12);
    return results;
  });
  console.log(`\n=== ${path} @ ${width} ===`);
  console.log(JSON.stringify(out, null, 1));
  await page.close();
}

for (const w of [1440, 390]) {
  await probe("/reference/models", w);
  await probe("/reference/migrations", w);
}
await browser.close();
console.log("done");