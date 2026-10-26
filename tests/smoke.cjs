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
  ...fs
    .readdirSync(path.join(root, "servicos"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => `servicos/${f}`),
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
      for (const width of [320, 360, 375, 390, 430, 640, 768, 1024, 1280, 1440, 1920]) {
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
    // The home shows three documented works; the full catalog lives on Obras.
    await page.goto(base);
    assert.equal(await page.locator("#portfolio .work-card").count(), 3);
    assert.equal(await page.locator(".project-card").count(), 0);
    assert.equal(await page.locator(".service-card").count(), 6);
    assert.equal(await page.locator(".steps .step").count(), 4);
    await page.goto(base + "obras.html");
    assert.equal(await page.locator(".project-card:visible").count(), 7);
    await page.locator('[data-filter="estruturas"]').click();
    assert.equal(await page.locator(".project-card:visible").count(), 3);
    // One catalogue: no provenance tags or photo-type filter on the cards.
    assert.equal(await page.locator(".image-label, [data-record-filter]").count(), 0);
    await page.locator('[data-filter="corporativo"]').click();
    assert.equal(await page.locator(".project-card:visible").count(), 2);
    await page.locator('[data-filter="all"]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-filter-select]").selectOption("infraestrutura");
    assert.equal(await page.locator(".project-card:visible").count(), 1);
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
    // A single real review is shown on its own: no carousel, no empty cards.
    assert.equal(await page.locator("[data-testimonial-slide]").count(), 0);
    assert.equal(await page.locator("[data-placeholder]").count(), 0);
    assert.equal(await page.locator("[data-testimonial-controls]").count(), 0);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const colorScheme of ["light", "dark"]) {
        await page.evaluate(
          (theme) => (document.documentElement.dataset.theme = theme),
          colorScheme,
        );
        // Colours ease between themes; measure once they have settled.
        await page.evaluate(() =>
          Promise.all(
            document
              .getAnimations({ subtree: true })
              .filter((item) => item.effect?.target?.closest?.("#depoimento"))
              .map((item) => item.finished.catch(() => {})),
          ),
        );
        const audit = await new AxeBuilder({ page })
          .include("#depoimento")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          audit.violations.map((item) => ({
            id: item.id,
            nodes: item.nodes.map((node) => [node.target, node.any.map((check) => check.message)]),
          })),
          [],
          `testimonial ${width} ${colorScheme}`,
        );
        report.accessibilityAudits++;
      }
    }
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
      "testimonial: single real quote with source, no placeholders, both themes and legacy redirects",
    );

    {
      await page.goto(base + "contato.html");
      await page.evaluate(() => {
        window.open = () => null;
      });
      await page.locator("form button[value=whatsapp]").click();
      for (const field of ["nome", "telefone", "servico", "local", "mensagem"])
        assert.equal(
          await page.locator(`#${field}`).getAttribute("aria-invalid"),
          "true",
          field,
        );
      assert.equal(await page.locator("#email").getAttribute("aria-invalid"), null);
      for (const group of ["projetos", "documentos"])
        assert.equal(
          await page
            .locator(`fieldset:has([name=${group}])`)
            .getAttribute("aria-invalid"),
          "true",
          group,
        );
      // "Ainda não tenho" and the other options exclude each other.
      await page.locator('label:has-text("Projeto estrutural")').click();
      await page.locator('label:has-text("Ainda não tenho projetos")').click();
      assert.equal(
        await page.locator('[name=projetos][value="Projeto estrutural"]').isChecked(),
        false,
      );
      await page.locator('label:has-text("Projeto arquitetônico")').click();
      assert.equal(await page.locator("[name=projetos][data-none]").isChecked(), false);
      await page.locator('label:has-text("Não tenho documentação técnica")').click();
      assert.equal(await page.locator(".message-fallback").isVisible(), false);
      await page.locator("#nome").fill("Teste & Validação");
      await page.locator("#telefone").fill("(21) 99999-0000");
      await page.locator("#servico").selectOption("engenharia-estrutural");
      await page.locator("#local").fill("Tijuca");
      await page
        .locator("#mensagem")
        .fill("Teste local. Esta mensagem nao sera enviada.");
      await page.locator("#email").fill("invalido");
      await page.locator("form button[value=whatsapp]").click();
      assert.equal(await page.locator("#email").getAttribute("aria-invalid"), "true");
      await page.locator("#email").fill("");
      await page.locator("form button[value=whatsapp]").click();
      const prepared = new URL(
        await page.locator(".message-fallback").getAttribute("href"),
      );
      assert.equal(prepared.hostname, "wa.me");
      assert.equal(prepared.pathname, "/5521965906030");
      const text = prepared.searchParams.get("text");
      assert.ok(text.startsWith("Olá, Ferreira! Meu nome é Teste & Validação."));
      assert.ok(text.includes("Serviço de interesse: Engenharia estrutural."));
      assert.ok(text.includes("Telefone para contato: (21) 99999-0000."));
      assert.ok(!text.includes("E-mail:"));
      assert.ok(text.includes("Cidade da obra: Tijuca."));
      assert.ok(text.includes("Projetos disponíveis: Projeto arquitetônico."));
      assert.ok(text.includes("Documentação técnica: Não tenho documentação técnica."));
      // No upload is offered: documents go through WhatsApp.
      assert.equal(await page.locator('input[type="file"]').count(), 0);
      assert.ok(
        (await page.locator(".form-notes").innerText()).includes("não recebe arquivos"),
      );
      assert.ok(
        (await page.locator(".form-status").innerText()).includes("só será enviada"),
      );
      await page.locator("#mensagem").fill("Atualizacao da mensagem de teste.");
      assert.equal(
        await page.locator(".message-fallback").getAttribute("href"),
        null,
      );
      // Service pages pre-select their service in the form.
      await page.goto(base + "contato.html?servico=gerenciamento-de-obras#orcamento");
      assert.equal(await page.locator("#servico").inputValue(), "gerenciamento-de-obras");
    }
    report.interactions.push(
      "contact validation, safe encoding, popup fallback",
    );
    // Content below the first screen rises in once; with reduced motion
    // nothing is hidden.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(base);
    assert.ok((await page.locator(".reveal").count()) > 0);
    assert.equal(await page.locator(".hero .reveal").count(), 0);
    // After arriving, a card drops the reveal styles so its hover works again.
    const card = page.locator(".service-card").nth(1);
    await card.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      (node) => !node.classList.contains("reveal"),
      await card.elementHandle(),
      { timeout: 4000 },
    );
    await card.hover();
    await page.waitForTimeout(400);
    assert.notEqual(await card.evaluate((node) => getComputedStyle(node).transform), "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(base);
    assert.equal(await page.locator(".reveal").count(), 0);
    report.interactions.push("reveal only below the fold; none with reduced motion");

    // Hero carousel: starts paused with reduced motion, arrows and indicators
    // move it, and with motion allowed it advances on its own until paused.
    const activeSlide = () =>
      page.evaluate(() =>
        [...document.querySelectorAll(".carousel-slide")].findIndex((slide) =>
          slide.classList.contains("is-active"),
        ),
      );
    assert.equal(await page.locator(".carousel-slide").count(), 5);
    assert.equal(await page.locator(".carousel-dot").count(), 5);
    assert.match(
      await page.locator("[data-carousel-toggle]").getAttribute("aria-label"),
      /Retomar/,
    );
    await page.locator("[data-carousel-next]").click();
    assert.equal(await activeSlide(), 1);
    await page.locator("[data-carousel-prev]").click();
    await page.locator("[data-carousel-prev]").click();
    assert.equal(await activeSlide(), 4);
    await page.locator(".carousel-dot").nth(2).click();
    assert.equal(await activeSlide(), 2);
    assert.equal(
      await page.locator(".carousel-dot").nth(2).getAttribute("aria-current"),
      "true",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(base);
    await page.mouse.move(700, 300);
    await page.waitForFunction(
      () => document.querySelector(".carousel-slide.is-active") !==
        document.querySelector(".carousel-slide"),
      null,
      { timeout: 8000 },
    );
    await page.locator("[data-carousel-toggle]").click();
    await page.mouse.move(700, 300);
    const paused = await activeSlide();
    await page.waitForTimeout(6500);
    assert.equal(await activeSlide(), paused);
    assert.equal(await page.locator(".carousel-track").getAttribute("aria-live"), "polite");
    report.interactions.push("hero carousel: arrows, indicators, autoplay and pause");

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
    assert.equal(await staticPage.locator("#portfolio .work-card").count(), 3);
    assert.equal(await staticPage.locator(".carousel-slide:visible").count(), 1);
    assert.equal(await staticPage.locator(".carousel-controls").isVisible(), false);
    await staticPage.locator(".mobile-nav summary").click();
    assert.equal(await staticPage.locator(".mobile-nav nav").isVisible(), true);
    await staticPage.goto(base + "obras.html");
    assert.equal(await staticPage.locator(".project-card:visible").count(), 7);
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
