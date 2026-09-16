import { expect, type Page } from "@playwright/test";

/** The 13 canonical routes every navigation/breadcrumb test must cover. */
export const ROUTES = [
  "/",
  "/start",
  "/playground",
  "/quiz-hub",
  "/code",
  "/glossary",
  "/reference/api",
  "/reference/models",
  "/reference/migrations",
  "/chapters/01-overview",
  "/chapters/08-booking-lifecycle",
  "/chapters/11-docker-basics",
  "/chapters/16-request-lifecycles",
];

/** route whose nav should be highlighted (desktop + mobile). */
export function expectedNavFor(path: string): string {
  if (path === "/reference/api" || path === "/reference/models" || path === "/reference/migrations") {
    return "Reference";
  }
  if (path.startsWith("/chapters/")) return null;
  if (path === "/") return "Home";
  if (path === "/start") return "Start";
  if (path === "/playground") return "Playground";
  if (path === "/quiz-hub") return "Quiz hub";
  if (path === "/code") return "Code browser";
  if (path === "/glossary") return "Glossary";
  return null;
}

/** Mobile nav flattens the Reference dropdown into child links, so the active
 * entry is the specific reference page, not the "Reference" trigger. */
export function expectedNavMobileFor(path: string): string {
  if (path === "/reference/api") return "API reference";
  if (path === "/reference/models") return "Data models";
  if (path === "/reference/migrations") return "Migrations";
  return expectedNavFor(path);
}

/** Expected current breadcrumb crumb (aria-current=page) per route. */
export function expectedCrumbFor(path: string): string {
  if (!path || path === "/") return "Home";
  if (path.startsWith("/chapters/")) {
    const n = path.split("/")[2];
    return `Chapter ${n.split("-")[0]}`;
  }
  switch (path) {
    case "/start":
      return "Start here";
    case "/playground":
      return "Playground";
    case "/quiz-hub":
      return "Quiz hub";
    case "/code":
      return "Code browser";
    case "/glossary":
      return "Glossary";
    case "/reference/api":
      return "API reference";
    case "/reference/models":
      return "Data models";
    case "/reference/migrations":
      return "Migrations";
    default:
      return path;
  }
}

/** Collect every console error + pageerror + failed request for one navigation. */
export async function startErrorCollector(page: Page) {
  const errors: string[] = [];
  const pageErrors: Error[] = [];
  const failedRequests: { url: string; error: string }[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err));
  page.on("requestfailed", (req) => {
    // font/localStorage probes can fail harmlessly; still record for diagnosis
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText ?? "failed" });
  });

  return {
    errors,
    pageErrors,
    failedRequests,
    async assertClean() {
      expect(pageErrors, `pageerror: ${pageErrors.map((e) => e.message).join(" | ")}`).toHaveLength(0);
    },
  };
}

export function viewportName(page: Page): string {
  const { width } = page.viewportSize() ?? { width: 1440 };
  if (width <= 500) return "mobile";
  if (width <= 900) return "tablet";
  return "desktop";
}

/** Tailwind v4 resolves colors like oklch(...), so resolve to sRGB via canvas
 * readback before computing luminance (reading "rgb" via \d+ would misparse). */
export async function colorLuminance(
  page: Page,
  locator: ReturnType<Page["locator"]>,
  selector: string | null,
  prop: "backgroundColor" | "color",
): Promise<number> {
  return locator.evaluate(
    (el, { selector, prop }: { selector: string | null; prop: "backgroundColor" | "color" }) => {
      const target = selector ? el.querySelector(selector) : el;
      const color = getComputedStyle(target as HTMLElement)[prop];
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },
    { selector, prop }
  );
}