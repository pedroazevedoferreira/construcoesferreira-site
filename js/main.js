(() => {
  "use strict";

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const effectiveTheme = () =>
    root.dataset.theme || (systemTheme.matches ? "dark" : "light");

  function syncTheme() {
    const dark = effectiveTheme() === "dark";
    const label = dark ? "Ativar tema claro" : "Ativar tema escuro";
    if (themeButton) {
      themeButton.setAttribute("aria-label", label);
      themeButton.title = label;
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#181a18" : "#f8f9f7");
  }

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      root.dataset.theme = effectiveTheme() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", root.dataset.theme);
      } catch {
        /* Storage is optional. */
      }
      syncTheme();
    });
    themeButton.hidden = false;
  }
  systemTheme.addEventListener("change", syncTheme);
  window.addEventListener("storage", (event) => {
    if (event.key !== "theme" && event.key !== null) return;
    if (event.newValue === "light" || event.newValue === "dark")
      root.dataset.theme = event.newValue;
    else delete root.dataset.theme;
    syncTheme();
  });
  syncTheme();

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  // Conversion events become available as soon as GTM or Analytics provides dataLayer.
  // The site keeps working normally when no analytics container has been configured.
  // One delegated listener also covers links created later (floating button, form fallback).
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href*="wa.me/"]');
    if (!link) return;
    window.dataLayer?.push({
      event: link.dataset.analyticsEvent || "whatsapp_click",
      source: window.location.pathname,
    });
  });

  const menu = document.querySelector(".mobile-nav");
  if (menu) {
    const summary = menu.querySelector("summary");
    menu.addEventListener("toggle", () =>
      summary.setAttribute(
        "aria-label",
        menu.open ? "Fechar menu" : "Abrir menu",
      ),
    );
    menu.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        menu.open = false;
      }),
    );
    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        summary.focus();
      }
    });
    window
      .matchMedia("(min-width: 901px)")
      .addEventListener("change", (event) => {
        if (event.matches) menu.open = false;
      });
  }

  document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
    const cards = [...scope.querySelectorAll(".project-card")];
    const grid = scope.querySelector(".project-grid");
    const buttons = [...scope.querySelectorAll("[data-filter]")];
    const select = scope.querySelector("[data-filter-select]");
    const more = scope.querySelector("[data-show-more]");
    const status = scope.querySelector("[data-filter-status]");
    const limit = Number(scope.dataset.limit) || cards.length;
    let category = "all";
    let expanded = false;

    function render() {
      const matching = cards.filter(
        (card) => category === "all" || card.dataset.category === category,
      );
      const visible = expanded ? matching : matching.slice(0, limit);
      cards.forEach((card) => {
        card.hidden = !visible.includes(card);
        card.classList.toggle("project-featured", card === visible[0]);
      });
      grid.dataset.count = visible.length;
      buttons.forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === category),
        ),
      );
      select.value = category;
      status.textContent =
        visible.length === matching.length
          ? `${visible.length} ${visible.length === 1 ? "obra" : "obras"}`
          : `${visible.length} de ${matching.length} obras`;
      if (more) {
        more.hidden = matching.length <= limit;
        more.setAttribute("aria-expanded", String(expanded));
        more.querySelector("span").textContent = expanded
          ? "Mostrar menos"
          : "Mais projetos";
      }
    }

    function change(value) {
      category = value;
      expanded = false;
      render();
    }
    buttons.forEach((button) =>
      button.addEventListener("click", () => change(button.dataset.filter)),
    );
    select.addEventListener("change", () => change(select.value));
    more?.addEventListener("click", () => {
      expanded = !expanded;
      render();
      if (!expanded)
        more.scrollIntoView({
          block: "center",
          behavior: motion.matches ? "instant" : "smooth",
        });
    });
    function revealHash() {
      const card = cards.find((item) => `#${item.id}` === window.location.hash);
      if (!card) return;
      category = "all";
      expanded = true;
      render();
      requestAnimationFrame(() =>
        card.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    }
    scope.querySelector(".project-filters").hidden = false;
    scope.querySelector(".project-select").hidden = false;
    render();
    revealHash();
    window.addEventListener("hashchange", revealHash);
  });

  document.querySelectorAll("[data-wa-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const fallback = form.querySelector(".message-fallback");
    const messageError = (name, message) => {
      form.querySelector(`#${name}-error`).textContent = message;
      form.querySelectorAll(`[name="${name}"]`).forEach((field) => {
        if (message) field.setAttribute("aria-invalid", "true");
        else field.removeAttribute("aria-invalid");
      });
    };
    const clearDraftLink = () => {
      fallback.hidden = true;
      fallback.removeAttribute("href");
      status.textContent = "";
    };
    form.addEventListener("input", (event) => {
      clearDraftLink();
      const name = event.target.name;
      if (name && form.querySelector(`#${name}-error`)) messageError(name, "");
    });
    form.addEventListener("change", clearDraftLink);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearDraftLink();
      const data = new FormData(form);
      const value = (name) => String(data.get(name) || "").trim();
      const values = {
        nome: value("nome"),
        local: value("local"),
        tipo: value("tipo"),
        prazo: value("prazo"),
        mensagem: value("mensagem"),
      };
      const errors = {};
      if (values.nome.length < 2 || values.nome.length > 100)
        errors.nome = "Informe seu nome, entre 2 e 100 caracteres.";
      if (values.local.length < 2 || values.local.length > 100)
        errors.local = "Informe a cidade ou o bairro.";
      if (values.mensagem.length > 2000)
        errors.mensagem = "Use no máximo 2.000 caracteres.";
      const names = ["nome", "local", "mensagem"];
      names.forEach((name) => messageError(name, errors[name] || ""));
      status.classList.toggle("is-error", Object.keys(errors).length > 0);
      if (Object.keys(errors).length) {
        status.textContent = "Confira os campos indicados antes de continuar.";
        form.querySelector(`[name="${Object.keys(errors)[0]}"]`).focus();
        return;
      }
      // Only what the visitor typed goes into the WhatsApp draft.
      const service =
        values.tipo && values.tipo !== "Outro" ? values.tipo.toLowerCase() : "";
      const lines = [
        `Olá, Ferreira! Meu nome é ${values.nome}.`,
        service
          ? `Tenho interesse em ${service} em ${values.local}.`
          : `Tenho um projeto em ${values.local}.`,
      ];
      if (values.prazo) lines.push(`Quando pretendo começar: ${values.prazo}.`);
      lines.push("Gostaria de conversar sobre o meu projeto.");
      if (values.mensagem) lines.push("", values.mensagem);
      const url = `https://wa.me/5521965906030?text=${encodeURIComponent(lines.join("\n"))}`;
      window.dataLayer?.push({
        event: "quote_form_submit",
        source: window.location.pathname,
      });
      fallback.href = url;
      fallback.hidden = false;
      status.textContent =
        "Mensagem preparada. Revise e confirme o envio no WhatsApp. Se a janela não abriu, use o link abaixo.";
      window.open(url, "_blank", "noopener,noreferrer");
    });
    form.hidden = false;
  });

  const testimonial = document.querySelector("[data-testimonial-carousel]");
  if (testimonial) {
    const slides = [
      ...testimonial.querySelectorAll("[data-testimonial-slide]"),
    ];
    const dots = [...testimonial.querySelectorAll("[data-testimonial-dot]")];
    const stage = testimonial.querySelector(".testimonial-stage");
    const status = testimonial.querySelector("[data-testimonial-status]");
    let current = 0;
    let touch = null;

    function showSlide(index, announce = true) {
      current = (index + slides.length) % slides.length;
      // Move focus before making an outgoing slide inert.
      if (slides.some((slide) => slide.contains(document.activeElement)))
        dots[current].focus({ preventScroll: true });
      slides.forEach((slide, position) => {
        const offset = (position - current + slides.length) % slides.length;
        const active = offset === 0;
        slide.dataset.position = active
          ? "active"
          : offset === 1
            ? "next"
            : "previous";
        slide.inert = !active;
        slide.setAttribute("aria-hidden", String(!active));
        slide.hidden = false;
      });
      dots.forEach((dot, index) => {
        if (index === current) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (announce)
        status.textContent = `${current + 1} de ${slides.length}: ${slides[current].dataset.slideLabel}.`;
    }

    testimonial
      .querySelector("[data-testimonial-prev]")
      .addEventListener("click", () => showSlide(current - 1));
    testimonial
      .querySelector("[data-testimonial-next]")
      .addEventListener("click", () => showSlide(current + 1));
    dots.forEach((dot, index) =>
      dot.addEventListener("click", () => showSlide(index)),
    );
    testimonial.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = {
        ArrowLeft: current - 1,
        ArrowRight: current + 1,
        Home: 0,
        End: slides.length - 1,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      showSlide(target);
    });
    stage.addEventListener(
      "touchstart",
      (event) => {
        touch =
          event.touches.length === 1
            ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
            : null;
      },
      { passive: true },
    );
    stage.addEventListener(
      "touchend",
      (event) => {
        if (!touch || !event.changedTouches.length) return;
        const dx = event.changedTouches[0].clientX - touch.x;
        const dy = event.changedTouches[0].clientY - touch.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5)
          showSlide(current + (dx < 0 ? 1 : -1));
        touch = null;
      },
      { passive: true },
    );
    stage.addEventListener("touchcancel", () => {
      touch = null;
    });
    showSlide(0, false);
    testimonial.querySelector("[data-testimonial-controls]").hidden = false;
  }

  // Work gallery: pick a category, open a work, browse all of its photos.
  // Without JavaScript every album stays a plain list of photos.
  document.querySelectorAll("[data-albums]").forEach((gallery) => {
    const grid = gallery.querySelector("[data-album-grid]");
    const bar = gallery.querySelector("[data-album-filters]");
    const empty = gallery.querySelector("[data-album-empty]");
    const status = gallery.querySelector("[data-album-status]");
    const albums = [...grid.querySelectorAll(".album")].map((element) => ({
      element,
      id: element.id,
      category: element.dataset.categoria,
      title: element.querySelector(".album-title").textContent.trim(),
      meta: element.querySelector(".album-meta")?.textContent.trim() || "",
      photos: [...element.querySelectorAll(".album-photos img")].map(
        (image) => ({ src: image.currentSrc || image.src, alt: image.alt }),
      ),
    }));
    let category = "";
    let open = null;
    let index = 0;
    const count = (n) => `${n} ${n === 1 ? "foto" : "fotos"}`;

    // Cards: cover photo, title, place and photo count.
    albums.forEach((album) => {
      album.element.classList.add("is-card");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "album-open";
      button.setAttribute(
        "aria-label",
        `Abrir ${album.title}, ${count(album.photos.length)}`,
      );
      const badge = document.createElement("span");
      badge.className = "album-count";
      badge.textContent = count(album.photos.length);
      button.append(badge);
      button.addEventListener("click", () => show(album));
      album.element.append(button);
      album.button = button;
    });

    // Viewer: main photo, arrows, counter and thumbnails of the same work.
    const viewer = document.createElement("div");
    viewer.className = "album-viewer";
    viewer.hidden = true;
    viewer.innerHTML = `
      <div class="album-viewer-head">
        <button type="button" class="text-link album-back">Voltar às obras</button>
        <div>
          <h3 class="album-viewer-title" tabindex="-1"></h3>
          <p class="album-viewer-meta"></p>
        </div>
      </div>
      <figure class="album-stage">
        <img alt="" />
        <button type="button" class="icon-button album-prev" aria-label="Foto anterior">‹</button>
        <button type="button" class="icon-button album-next" aria-label="Próxima foto">›</button>
        <figcaption><span class="album-caption"></span><span class="album-counter"></span></figcaption>
      </figure>
      <div class="album-thumbs" role="group" aria-label="Fotos desta obra"></div>`;
    grid.after(viewer);
    const stage = viewer.querySelector(".album-stage img");
    const caption = viewer.querySelector(".album-caption");
    const counter = viewer.querySelector(".album-counter");
    const thumbs = viewer.querySelector(".album-thumbs");
    const prev = viewer.querySelector(".album-prev");
    const next = viewer.querySelector(".album-next");
    const heading = viewer.querySelector(".album-viewer-title");

    function select(nextIndex) {
      const photos = open.photos;
      index = (nextIndex + photos.length) % photos.length;
      stage.src = photos[index].src;
      stage.alt = photos[index].alt;
      caption.textContent = photos[index].alt;
      counter.textContent = `${index + 1} / ${photos.length}`;
      [...thumbs.children].forEach((thumb, position) =>
        thumb.setAttribute("aria-current", String(position === index)),
      );
    }

    function show(album, focus = true) {
      open = album;
      heading.textContent = album.title;
      viewer.querySelector(".album-viewer-meta").textContent = album.meta;
      thumbs.replaceChildren(
        ...album.photos.map((photo, position) => {
          const thumb = document.createElement("button");
          thumb.type = "button";
          thumb.className = "album-thumb";
          thumb.setAttribute("aria-label", `Foto ${position + 1}: ${photo.alt}`);
          const image = document.createElement("img");
          image.src = photo.src;
          image.alt = "";
          image.loading = "lazy";
          thumb.append(image);
          thumb.addEventListener("click", () => select(position));
          return thumb;
        }),
      );
      const several = album.photos.length > 1;
      prev.hidden = next.hidden = thumbs.hidden = !several;
      select(0);
      grid.hidden = bar.hidden = true;
      empty.hidden = true;
      viewer.hidden = false;
      status.textContent = `${album.title}: ${count(album.photos.length)}.`;
      if (focus) {
        heading.focus({ preventScroll: true });
        gallery.scrollIntoView({
          block: "start",
          behavior: motion.matches ? "instant" : "smooth",
        });
      }
      history.replaceState(null, "", `#${album.id}`);
    }

    function close() {
      const last = open;
      open = null;
      viewer.hidden = true;
      grid.hidden = false;
      bar.hidden = categories.length < 1;
      render();
      history.replaceState(null, "", "#galeria");
      last?.button.focus({ preventScroll: true });
      last?.element.scrollIntoView({
        block: "center",
        behavior: motion.matches ? "instant" : "smooth",
      });
    }

    viewer.querySelector(".album-back").addEventListener("click", close);
    prev.addEventListener("click", () => select(index - 1));
    next.addEventListener("click", () => select(index + 1));
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
      if (!open || open.photos.length < 2) return;
      if (event.key === "ArrowLeft") select(index - 1);
      if (event.key === "ArrowRight") select(index + 1);
    });

    // Category chips come from data-categoria.
    const categories = [...new Set(albums.map((album) => album.category))];
    const chips = [["", "Todas"], ...categories.map((name) => [name, name])].map(
      ([value, label]) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.value = value;
        chip.textContent = label;
        chip.addEventListener("click", () => {
          category = value;
          render();
        });
        return chip;
      },
    );
    bar.append(...chips);
    bar.hidden = albums.length === 0;

    function render() {
      let shown = 0;
      albums.forEach((album) => {
        album.element.hidden = Boolean(category) && album.category !== category;
        if (!album.element.hidden) shown++;
      });
      chips.forEach((chip) =>
        chip.setAttribute("aria-pressed", String(chip.value === category)),
      );
      empty.hidden = shown > 0;
      status.textContent = `${shown} ${shown === 1 ? "obra" : "obras"}.`;
    }
    render();
    gallery.classList.add("is-enhanced");

    const linked = albums.find((album) => `#${album.id}` === location.hash);
    if (linked) show(linked, false);
  });

  const dialog = document.querySelector(".lightbox");
  const photos = [...document.querySelectorAll("[data-lightbox]")];
  if (dialog && typeof dialog.showModal === "function" && photos.length) {
    const image = dialog.querySelector("img");
    const caption = dialog.querySelector(".lightbox-caption");
    const count = dialog.querySelector(".lightbox-count");
    const close = dialog.querySelector(".lightbox-close");
    const previous = dialog.querySelector("[data-gallery-prev]");
    const next = dialog.querySelector("[data-gallery-next]");
    let index = 0,
      sequence = photos,
      trigger = null,
      touchX = null,
      touchY = null;
    function display(nextIndex) {
      index = (nextIndex + sequence.length) % sequence.length;
      const photo = sequence[index];
      image.alt = photo.dataset.caption || photo.querySelector("img").alt;
      image.src = photo.href;
      caption.textContent = image.alt;
      count.textContent = `${index + 1} / ${sequence.length}`;
    }
    photos.forEach((photo) =>
      photo.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        // Filtered-out photos stay out of the sequence.
        sequence = photos.filter((item) => !item.closest("[hidden]"));
        previous.hidden = next.hidden = sequence.length < 2;
        trigger = photo;
        display(sequence.indexOf(photo));
        dialog.showModal();
        document.body.classList.add("lightbox-open");
        close.focus();
      }),
    );
    close.addEventListener("click", () => dialog.close());
    previous.addEventListener("click", () => display(index - 1));
    next.addEventListener("click", () => display(index + 1));
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        display(index + (event.key === "ArrowLeft" ? -1 : 1));
      }
    });
    dialog.addEventListener("click", (event) => {
      const box = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom)
      )
        dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("lightbox-open");
      trigger?.focus({ preventScroll: true });
    });
    image.addEventListener("error", () => {
      caption.textContent =
        "Não foi possível carregar esta imagem. Tente novamente mais tarde.";
    });
    image.addEventListener(
      "touchstart",
      (event) => {
        touchX = event.changedTouches[0].clientX;
        touchY = event.changedTouches[0].clientY;
      },
      { passive: true },
    );
    image.addEventListener(
      "touchend",
      (event) => {
        if (touchX === null) return;
        const dx = event.changedTouches[0].clientX - touchX;
        const dy = event.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
          display(index + (dx < 0 ? 1 : -1));
        touchX = touchY = null;
      },
      { passive: true },
    );
  }

  // Content rises into place once; theme-init.js only hides it when this can run.
  if (root.classList.contains("reveal-ready")) {
    const targets = [
      ...document.querySelectorAll(
        [
          "main .section-heading",
          ".project-card",
          ".service-summary",
          ".logo-strip",
          ".testimonial-heading",
          ".testimonial-carousel",
          ".people-photo",
          ".people-copy",
          ".cta-layout",
          ".service-panorama",
          ".service-detail",
          ".company-profile > *",
          ".value-list article",
          ".partner-grid > div",
          ".contact-methods > a",
          ".faq-list details",
          ".project-story > *",
          ".gallery-grid > *",
          ".album",
          ".why-grid li",
        ].join(","),
      ),
    ];
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((target) => {
      const siblings = [...target.parentElement.children].filter((node) =>
        targets.includes(node),
      );
      const order = Math.min(siblings.indexOf(target), 4);
      if (order > 0)
        target.style.setProperty("--reveal-delay", `${order * 90}ms`);
      observer.observe(target);
    });
    root.classList.add("reveal-live");
    // Construction drawings beside headings trace themselves once.
    document.querySelectorAll(".site-art").forEach((art) =>
      new IntersectionObserver(
        (entries, watcher) => {
          if (!entries[0].isIntersecting) return;
          art.classList.add("is-drawn");
          watcher.disconnect();
        },
        { threshold: 0.5 },
      ).observe(art),
    );
    // "Como funciona" (home and Serviços) draws itself once, step by step.
    document.querySelectorAll(".process-list").forEach((steps) =>
      new IntersectionObserver(
        (entries, watcher) => {
          if (!entries[0].isIntersecting) return;
          steps.classList.add("is-drawn");
          watcher.disconnect();
        },
        { threshold: 0.45 },
      ).observe(steps),
    );
    motion.addEventListener("change", () => {
      if (motion.matches)
        targets.forEach((target) => target.classList.add("is-revealed"));
    });
  }

  const header = document.querySelector(".site-header");
  const whatsapp = document.querySelector(
    '.header-actions a[href^="https://wa.me/"]',
  );
  let float = null;
  const svgIcon = (attributes, d) => {
    const ns = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(ns, "svg");
    const path = document.createElementNS(ns, "path");
    Object.entries({
      "aria-hidden": "true",
      focusable: "false",
      class: "icon",
      viewBox: "0 0 24 24",
      ...attributes,
    }).forEach(([name, value]) => icon.setAttribute(name, value));
    path.setAttribute("d", d);
    icon.append(path);
    return icon;
  };
  const shortcut = (className, label) => {
    const link = document.createElement("a");
    link.className = className;
    link.href = whatsapp.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", label);
    document.body.append(link);
    return link;
  };
  if (whatsapp) {
    // One WhatsApp shortcut, lower-right corner, on every screen size.
    float = shortcut("whatsapp-float", "Falar com a Ferreira pelo WhatsApp");
    float.dataset.analyticsEvent = "whatsapp_floating";
    // WhatsApp glyph (Simple Icons, CC0).
    float.append(
      svgIcon(
        { fill: "currentColor" },
        "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
      ),
    );
  }
  const footer = document.querySelector(".site-footer");
  let footerInView = false;
  if (footer && float && "IntersectionObserver" in window)
    new IntersectionObserver((entries) => {
      footerInView = entries[0].isIntersecting;
      syncScroll();
    }).observe(footer);
  function syncScroll() {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
    // Compact only once the header's own spot has scrolled away (no jump).
    header?.classList.toggle("is-compact", window.scrollY > 160);
    float?.classList.toggle("is-visible", !footerInView);
  }
  window.addEventListener("scroll", syncScroll, { passive: true });
  syncScroll();

  // Back to top, next to the privacy link.
  const privacy = document.querySelector(".footer-bottom > a:last-child");
  if (privacy) {
    const links = document.createElement("div");
    links.className = "footer-links";
    const top = document.createElement("button");
    top.type = "button";
    top.className = "footer-top";
    top.append(
      "Voltar ao topo",
      svgIcon(
        {
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "2",
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        },
        "m5 12 7-7 7 7M12 19V5",
      ),
    );
    top.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: motion.matches ? "instant" : "smooth",
      });
      document.querySelector(".brand")?.focus({ preventScroll: true });
    });
    privacy.replaceWith(links);
    links.append(privacy, top);
  }

  // Lazy images fade in instead of popping.
  document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
    if (image.complete) return;
    image.classList.add("is-loading");
    const done = () => {
      image.classList.add("is-loaded");
      image.classList.remove("is-loading");
    };
    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });
  });
})();
