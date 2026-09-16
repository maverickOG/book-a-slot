import { chromium } from "playwright";
const browser = await chromium.launch();
async function dump(path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:4789${path}`, { waitUntil: "networkidle" });
  const out = await page.evaluate(() => {
    const svgs = [...document.querySelectorAll("svg")].map((svg, i) => {
      const kids = [...svg.querySelectorAll("text, g[transform], path, line, polyline, rect, circle")].map((el) => {
        const r = el.getBBox ? el.getBBox() : null;
        let txt = "";
        if (el.tagName.toLowerCase() === "text") txt = (el.textContent || "").trim();
        return {
          tag: el.tagName.toLowerCase(),
          txt: txt.slice(0, 60),
          transform: el.getAttribute("transform") || "",
          cls: typeof el.getAttribute === "function" ? String(el.getAttribute("class") || "").slice(0, 40) : "",
          bbox: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
        };
      });
      return { svgIndex: i, viewBox: svg.getAttribute("viewBox"), width: svg.getAttribute("width"), height: svg.getAttribute("height"), class: svg.getAttribute("class"), count: kids.length, kids };
    });
    return svgs;
  });
  console.log(`\n=== ${path} ===`);
  for (const s of out) {
    console.log(`SVG#${s.svgIndex} viewBox=${s.viewBox} w=${s.width} h=${s.height} class="${s.class}" kids=${s.count}`);
    for (const k of s.kids) console.log(`  ${k.tag}${k.txt ? ` txt="${k.txt}"` : ""} tr="${k.transform}" cls="${k.cls}" bbox=${JSON.stringify(k.bbox)}`);
  }
  await page.close();
}
for (const p of ["/reference/models","/reference/migrations","/chapters/08-booking-lifecycle","/chapters/11-docker-basics"]) await dump(p);
await browser.close();
