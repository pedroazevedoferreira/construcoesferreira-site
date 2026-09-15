const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");

// Test tools are installed outside the site. They are not needed to serve it.
const moduleRoot = process.argv[2];
const load = (name) =>
  require(moduleRoot ? path.join(path.resolve(moduleRoot), name) : name);
const { chromium } = load("playwright");
const axeModule = load("@axe-core/playwright");
const AxeBuilder = axeModule.default || axeModule.AxeBuilder;
const root = path.resolve(__dirname, "..");
const files = [
  ...fs.readdirSync(root).filter((f) => f.endsWith(".html")),
  ...fs
    .readdirSync(path.join(root, "projetos"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => `projetos/${f}`),
];
const headers = Object.fromEntries(
  fs
    .readFileSync(path.join(root, "_headers"), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^  [A-Za-z]/.test(line))
    .map((line) => {
      const separator = line.indexOf(":");
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim(),
      ];
    }),
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const redirects = new Map(
  fs
    .readFileSync(path.join(root, "_redirects"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return [from, { to, status: Number(status) }];
    }),
);
const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
  } catch {
    response.writeHead(400).end();
    return;
  }
  const redirect = redirects.get(pathname);
  if (redirect) {
    response.writeHead(redirect.status, { Location: redirect.to }).end();
    return;
  }
  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep) && file !== root) {
    response.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory())
    file = path.join(file, "index.html");
  let status = 200;
  if (
    !fs.existsSync(file) ||
    !fs.statSync(file).isFile() ||
    !mime[path.extname(file)]
  ) {
    status = 404;
    file = path.join(root, "404.html");
  }
  response.writeHead(status, {
    ...headers,
    "Content-Type": mime[path.extname(file)],
  });
  response.end(fs.readFileSync(file));
});

const mapUrl = /^https:\/\/(?:maps|www)\.google\.com\/maps(?:\?|\/|$)/;
const mockMap = (route) =>
  route.fulfill({
    contentType: "text/html",
    body: '<!doctype html><html lang="pt-BR"><head><title>Mapa de teste</title></head><body><main>Localizacao da Ferreira</main></body></html>',
  });

async function checkArtwork(page) {
  const problems = await page.evaluate(() => {
    const failures = [];
    const intersects = (a, b) =>
      a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top;
    const hosts = [
      ...document.querySelectorAll(
        "[data-architecture], [data-technical-margin], .testimonial-blueprint",
      ),
    ];
    for (const host of hosts) {
      const element = host.matches(".testimonial-blueprint");
      const styles = element ? [null] : ["::before", "::after"];
      const content = element
        ? host.closest("section").querySelector(".testimonial-heading")
        : host;
      for (const pseudo of styles) {
        const style = getComputedStyle(host, pseudo);
        const requiredDrawing =
          element || (pseudo === "::before" && host.matches(".page-heading"));
        if (
          requiredDrawing &&
          (style.display === "none" ||
            style.maskImage === "none" ||
            parseFloat(style.width) < 200 ||
            parseFloat(style.height) < 140 ||
            Number(style.opacity) < 0.18)
        )
          failures.push("architectural drawing missing or imperceptible");
        if (style.display === "none" || (pseudo && style.content === "none"))
          continue;
        const parent = host.getBoundingClientRect();
        const left = element
          ? parent.left
          : parent.left + parseFloat(style.left);
        const top = element ? parent.top : parent.top + parseFloat(style.top);
        const box = {
          left,
          top,
          right: left + parseFloat(style.width),
          bottom: top + parseFloat(style.height),
        };
        if (style.pointerEvents !== "none")
          failures.push("interactive artwork");
        if (element && host.getAttribute("aria-hidden") !== "true")
          failures.push("unlabelled decoration");
        if (style.maskImage !== "none" && Number(style.opacity) > 0.24)
          failures.push("artwork contrast too high");
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
        let text;
        while ((text = walker.nextNode())) {
          if (!text.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(text);
          if (
            [...range.getClientRects()].some(
              (rect) => rect.width && rect.height && intersects(box, rect),
            )
          ) {
            failures.push(
              `${host.dataset.architecture || host.className}: drawing overlaps ${text.textContent.trim().slice(0, 45)}`,
            );
          }
        }
      }
    }
    return failures;
  });
  assert.deepEqual(
    problems,
    [],
    "architectural artwork must stay outside content",
  );
}

async function main() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const edge = path.join(
    process.env["ProgramFiles(x86)"] || "C:/Program Files (x86)",
    "Microsoft/Edge/Application/msedge.exe",
  );
  const executablePath =
    process.env.BROWSER_PATH || (fs.existsSync(edge) ? edge : undefined);
  let browser;
  const report = {
    pages: files.length,
    layouts: 0,
    accessibilityAudits: 0,
    localReferences: 0,
    interactions: [],
    errors: [],
  };
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await context.route(mapUrl, mockMap);
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push(message.text());
    });
    const records = [];
    for (const theme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: theme });
      for (const width of [319, 320, 390, 640, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
        for (const file of files) {
          await page.goto(base + file);
          await page.evaluate(() => document.fonts.ready);
          if (file === "contato.html") {
            const map = page.locator(".contact-map iframe");
            assert.equal(await map.count(), 1);
            assert.ok((await map.getAttribute("title")).includes("Tijuca"));
            assert.equal(await map.getAttribute("loading"), "lazy");
            assert.equal(
              new URL(await map.getAttribute("src")).searchParams.get("output"),
              "embed",
            );
          }
          const dimensions = await page.evaluate(() => ({
            overflow: document.documentElement.scrollWidth > innerWidth,
            brandRight: document.querySelector(".brand").getBoundingClientRect()
              .right,
            actionsLeft: document
              .querySelector(".header-actions")
              .getBoundingClientRect().left,
            h1: document.querySelectorAll("h1").length,
            brandImage: getComputedStyle(document.querySelector(".brand-mark"))
              .backgroundImage,
          }));
          assert.equal(
            dimensions.overflow,
            false,
            `${file}, ${width}, ${theme}: overflow`,
          );
          assert.ok(
            dimensions.brandRight <= dimensions.actionsLeft,
            `${file}: header collision`,
          );
          assert.equal(dimensions.h1, 1, `${file}: heading`);
          assert.ok(
            dimensions.brandImage.includes("assets/images/brand-cube.png"),
            `${file}: header logo must not share the tightly cropped favicon`,
          );
          const icons = await page
            .locator('link[rel="icon"]')
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                href: node.href,
                type: node.type,
                sizes: node.sizes.value,
              })),
            );
          assert.equal(icons.length, 2, `${file}: favicon alternatives`);
          assert.ok(
            icons.some(
              (icon) => icon.type === "image/svg+xml" && icon.sizes === "any",
            ),
          );
          assert.ok(
            icons.some(
              (icon) => icon.type === "image/png" && icon.sizes === "64x64",
            ),
          );
          assert.ok(
            icons.every(
              (icon) => new URL(icon.href).searchParams.get("v") === "cubo-2",
            ),
          );
          await checkArtwork(page);
          report.layouts++;
          if (width === 390 || width === 1440) {
            await page.evaluate(async () => {
              document.querySelectorAll("img").forEach((image) => {
                image.loading = "eager";
              });
              await Promise.all(
                [...document.images]
                  .filter((image) => image.src)
                  .map((image) => image.decode().catch(() => {})),
              );
            });
            assert.deepEqual(
              await page.evaluate(() =>
                [...document.images]
                  .filter((image) => image.src && !image.naturalWidth)
                  .map((image) => image.src),
              ),
              [],
              `${file}: image missing`,
            );
            const audit = await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
              .analyze();
            assert.deepEqual(
              audit.violations.map((item) => ({
                id: item.id,
                targets: item.nodes.map((node) => node.target),
              })),
              [],
              `${file}, ${width}, ${theme}: accessibility`,
            );
            report.accessibilityAudits++;
          }
          if (width === 1440 && theme === "light") {
            records.push({
              file,
              ...(await page.evaluate(() => ({
                ids: [...document.querySelectorAll("[id]")].map(
                  (node) => node.id,
                ),
                references: [
                  ...document.querySelectorAll(
                    "a[href],link[href],script[src],img[src]",
                  ),
                ].map((node) => node.href || node.src),
              }))),
            });
          }
        }
      }
    }
    for (const record of records) {
      assert.equal(
        new Set(record.ids).size,
        record.ids.length,
        `${record.file}: duplicate id`,
      );
      for (const reference of record.references.filter((reference) =>
        reference.startsWith(base),
      )) {
        const parsed = new URL(reference);
        const target =
          decodeURIComponent(parsed.pathname).slice(1) || "index.html";
        assert.ok(
          fs.existsSync(path.join(root, target)),
          `${record.file} -> ${target}`,
        );
        const targetPage = records.find((record) => record.file === target);
        if (parsed.hash && targetPage)
          assert.ok(
            targetPage.ids.includes(decodeURIComponent(parsed.hash.slice(1))),
            `${record.file} -> ${target}${parsed.hash}`,
          );
        report.localReferences++;
      }
    }
    console.log(
      "Layout, assets, links and accessibility passed. Checking interactions...",
    );
    const drawings = fs
      .readdirSync(path.join(root, "assets/drawings"))
      .filter((file) => file.endsWith(".svg"));
    assert.equal(drawings.length, 6);
    assert.equal(
      new Set(
        drawings.map((file) =>
          fs.readFileSync(path.join(root, "assets/drawings", file), "utf8"),
        ),
      ).size,
      6,
    );
    for (const drawing of drawings) {
      const response = await context.request.get(
        `${base}assets/drawings/${drawing}`,
      );
      assert.equal(response.status(), 200);
      const svg = await response.text();
      assert.equal(
        await page.evaluate((source) => {
          const doc = new DOMParser().parseFromString(source, "image/svg+xml");
          return !!doc.querySelector(
            "parsererror, script, foreignObject, image, linearGradient, radialGradient, [href]",
          );
        }, svg),
        false,
        `invalid or external content in ${drawing}`,
      );
    }
    for (const width of [901, 1199, 1200]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const file of [
        "index.html",
        "sobre.html",
        "servicos.html",
        "obras.html",
        "contato.html",
      ]) {
        await page.goto(base + file);
        await page.evaluate(() => document.fonts.ready);
        await checkArtwork(page);
      }
    }
    report.interactions.push(
      "six distinct local architectural drawings, visible on compact screens, no content overlap",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base);
    assert.equal(await page.locator(".project-card:visible").count(), 3);
    await page.locator("[data-show-more]").click();
    assert.equal(await page.locator(".project-card:visible").count(), 9);
    await page.locator("[data-show-more]").click();
    assert.equal(await page.locator(".project-card:visible").count(), 3);
    const collapsedButton = await page
      .locator("[data-show-more]")
      .boundingBox();
    assert.ok(
      collapsedButton.y > 88 &&
        collapsedButton.y + collapsedButton.height < 1000,
    );
    await page.locator('[data-filter="estruturas"]').click();
    assert.equal(await page.locator(".project-card:visible").count(), 3);
    assert.equal(
      await page.locator(".project-featured:visible").getAttribute("id"),
      "projeto-otavio-kelly",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-filter-select]").selectOption("infraestrutura");
    assert.equal(await page.locator(".project-card:visible").count(), 2);
    await page.locator(".mobile-nav summary").click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".mobile-nav").getAttribute("open"), null);
    assert.equal(
      await page
        .locator(".mobile-nav summary")
        .evaluate((node) => node === document.activeElement),
      true,
    );
    await page.locator(".theme-toggle").click();
    const theme = await page.locator("html").getAttribute("data-theme");
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
    report.interactions.push(
      "filters, pagination, mobile menu, keyboard focus, theme persistence",
    );

    await page.goto(base + "projetos/corporativo.html");
    await page.locator("[data-lightbox]").first().click();
    assert.equal(await page.locator(".lightbox-count").innerText(), "1 / 3");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator(".lightbox-count").innerText(), "2 / 3");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("dialog").evaluate((dialog) => dialog.open),
      false,
    );
    assert.equal(
      await page
        .locator("[data-lightbox]")
        .first()
        .evaluate((node) => node === document.activeElement),
      true,
    );
    report.interactions.push("gallery navigation and focus restoration");

    await page.goto(base + "index.html#depoimento");
    assert.equal(await page.locator(".client-quote").count(), 1);
    assert.equal(
      await page.locator(".client-quote figcaption strong").innerText(),
      "Rafael Curvelo",
    );
    assert.equal(await page.locator(".review-stars svg").count(), 5);
    assert.equal(
      (await page.locator(".client-quote blockquote").innerText())
        .replace(/\s+/g, " ")
        .trim(),
      "A Ferreira Projetos e Construções foi impecável na minha obra. Prazo, limpeza, execução e inclusive a educação dos funcionários. O Sandro é um excelente profissional. Recomendo de olhos fechados.",
    );
    assert.equal(
      await page.locator(".client-quote a").getAttribute("href"),
      "https://www.google.com/maps/contrib/106638283638179285536/reviews?hl=pt-BR",
    );
    assert.equal(await page.locator("[data-testimonial-slide]").count(), 3);
    assert.equal(await page.locator("[data-placeholder]").count(), 2);
    assert.equal(
      await page
        .locator(
          "[data-placeholder] .review-stars, [data-placeholder] a, [data-placeholder] blockquote",
        )
        .count(),
      0,
    );
    for (const placeholder of await page.locator("[data-placeholder]").all())
      assert.ok(
        (await placeholder.textContent()).includes("Conteúdo demonstrativo"),
      );
    const activeSlide = () =>
      page.locator('[data-testimonial-slide][data-position="active"]');
    const activeDot = () =>
      page.locator('[data-testimonial-dot][aria-current="true"]');
    const initialHeight = (
      await page.locator(".testimonial-stage").boundingBox()
    ).height;
    await page.locator("[data-testimonial-next]").click();
    assert.equal(await activeSlide().getAttribute("data-placeholder"), "");
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("2 de 3"),
    );
    assert.equal(
      await page.locator(".client-quote").evaluate((node) => node.inert),
      true,
    );
    assert.equal(
      await page.locator(".client-quote").getAttribute("aria-hidden"),
      "true",
    );
    assert.equal(
      (await page.locator(".testimonial-stage").boundingBox()).height,
      initialHeight,
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"]) {
        await page.evaluate(
          (theme) => (document.documentElement.dataset.theme = theme),
          colorScheme,
        );
        const audit = await new AxeBuilder({ page })
          .include("#depoimento")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          audit.violations,
          [],
          `placeholder slide ${width} ${colorScheme}`,
        );
        report.accessibilityAudits++;
      }
    }
    await page.locator("[data-testimonial-next]").click();
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("3 de 3"),
    );
    await page.locator("[data-testimonial-next]").click();
    assert.ok(
      (await activeSlide().getAttribute("class")).includes("client-quote"),
    );
    await page.locator("[data-testimonial-prev]").click();
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("3 de 3"),
    );
    await page.locator("[data-testimonial-dot]").first().click();
    await page.locator(".client-quote a").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page
        .locator("[data-testimonial-dot]")
        .nth(1)
        .evaluate((node) => node === document.activeElement),
      true,
    );
    await page.keyboard.press("End");
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("3 de 3"),
    );
    await page.keyboard.press("Home");
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("1 de 3"),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".testimonial-stage").evaluate((node) => {
      const touch = (x, y) =>
        new Touch({ identifier: 1, target: node, clientX: x, clientY: y });
      node.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [touch(290, 200)],
          bubbles: true,
        }),
      );
      node.dispatchEvent(
        new TouchEvent("touchend", {
          changedTouches: [touch(100, 205)],
          bubbles: true,
        }),
      );
    });
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("2 de 3"),
    );
    await page.locator(".testimonial-stage").evaluate((node) => {
      const touch = (x, y) =>
        new Touch({ identifier: 1, target: node, clientX: x, clientY: y });
      node.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [touch(200, 100)],
          bubbles: true,
        }),
      );
      node.dispatchEvent(
        new TouchEvent("touchend", {
          changedTouches: [touch(195, 300)],
          bubbles: true,
        }),
      );
    });
    assert.ok(
      (await activeDot().getAttribute("aria-label")).startsWith("2 de 3"),
    );
    assert.equal(
      await activeSlide().evaluate(
        (node) => getComputedStyle(node).transitionDuration,
      ),
      "0s",
    );
    for (const oldPath of ["avaliacoes.html", "avaliacoes", "avaliacoes/"]) {
      const response = await context.request.get(base + oldPath, {
        maxRedirects: 0,
      });
      assert.equal(response.status(), 301);
      assert.equal(response.headers().location, "/#depoimento");
    }
    await page.goto(base + "avaliacoes.html");
    assert.equal(new URL(page.url()).hash, "#depoimento");
    assert.equal(await page.locator(".client-quote").count(), 1);
    report.interactions.push(
      "testimonial carousel: real quote, disclosed placeholders, arrows, dots, keyboard, touch, stable height, reduced motion and legacy redirects",
    );

    {
      await page.goto(base + "contato.html");
      await page.evaluate(() => {
        window.open = () => null;
      });
      await page.locator("form button[type=submit]").click();
      assert.equal(
        await page.locator("#nome").getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(await page.locator(".message-fallback").isVisible(), false);
      await page.locator("#nome").fill("Teste & Validação");
      await page
        .locator("#mensagem")
        .fill("Teste local. Esta mensagem nao sera enviada.");
      await page.locator("#local").fill("Tijuca");
      await page.locator("form button[type=submit]").click();
      const prepared = new URL(
        await page.locator(".message-fallback").getAttribute("href"),
      );
      assert.equal(prepared.hostname, "wa.me");
      assert.equal(prepared.pathname, "/5521965906030");
      assert.ok(
        prepared.searchParams.get("text").includes("Teste & Validação"),
      );
      await page.locator("#mensagem").fill("Atualizacao da mensagem de teste.");
      assert.equal(
        await page.locator(".message-fallback").getAttribute("href"),
        null,
      );
    }
    report.interactions.push(
      "contact validation, safe encoding, popup fallback",
    );
    await page.goto(base + "servicos.html");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator(".process-list").scrollIntoViewIfNeeded();
    const first = await page
      .locator(".process-list li.is-active .process-number")
      .innerText();
    await page.waitForFunction(
      (first) =>
        document.querySelector(".process-list li.is-active .process-number")
          .textContent !== first,
      first,
    );
    await page.locator(".process-toggle").click();
    const paused = await page
      .locator(".process-list li.is-active .process-number")
      .innerText();
    await new Promise((resolve) => setTimeout(resolve, 2200));
    assert.equal(
      await page
        .locator(".process-list li.is-active .process-number")
        .innerText(),
      paused,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".process-toggle").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".process-list li.is-active").count(), 0);
    report.interactions.push("process animation, pause and reduced motion");

    const nojs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    await nojs.route(mapUrl, mockMap);
    const staticPage = await nojs.newPage();
    await staticPage.goto(base);
    assert.equal(await staticPage.locator(".client-quote").count(), 1);
    assert.equal(
      await staticPage.locator("[data-testimonial-controls]").isVisible(),
      false,
    );
    assert.equal(
      await staticPage.locator("[data-placeholder]:visible").count(),
      0,
    );
    assert.equal(await staticPage.locator(".project-card:visible").count(), 9);
    await staticPage.locator(".mobile-nav summary").click();
    assert.equal(await staticPage.locator(".mobile-nav nav").isVisible(), true);
    await staticPage.goto(base + "contato.html");
    assert.equal(await staticPage.locator("form").isVisible(), false);
    await nojs.close();
    report.interactions.push("no-JavaScript catalog, menu and direct contact");
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
