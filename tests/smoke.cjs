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
      for (const width of [320, 390, 640, 768, 1024, 1440, 1920]) {
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

    for (const file of ["contato.html", "avaliacoes.html"]) {
      await page.goto(base + file);
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
      if (file === "contato.html") await page.locator("#local").fill("Tijuca");
      else {
        await page.locator("form button[type=submit]").click();
        assert.equal(
          await page
            .locator("[name=nota]")
            .first()
            .getAttribute("aria-invalid"),
          "true",
        );
        await page.locator('[name=nota][value="4"]').check();
      }
      await page.locator("form button[type=submit]").click();
      const prepared = new URL(
        await page.locator(".message-fallback").getAttribute("href"),
      );
      assert.equal(prepared.hostname, "wa.me");
      assert.equal(prepared.pathname, "/5521965906030");
      assert.ok(
        prepared.searchParams.get("text").includes("Teste & Validação"),
      );
      if (file === "avaliacoes.html")
        assert.ok(
          prepared.searchParams.get("text").includes("Avaliação: 4 de 5"),
        );
      await page.locator("#mensagem").fill("Atualizacao da mensagem de teste.");
      assert.equal(
        await page.locator(".message-fallback").getAttribute("href"),
        null,
      );
    }
    report.interactions.push(
      "contact and feedback validation, safe encoding, popup fallback",
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
