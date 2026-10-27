(() => {
  "use strict";

  const WHATSAPP = "5521965906030";
  const EMAIL = "ferreira@construcoesferreira.com.br";
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
      ?.setAttribute("content", dark ? "#0c1a22" : "#f5f2ec");
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

  // Conversion events become available as soon as GTM or Analytics provides
  // dataLayer. One delegated listener also covers links created later.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href*="wa.me/"], a[data-analytics-event]');
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
      .matchMedia("(min-width: 1081px)")
      .addEventListener("change", (event) => {
        if (event.matches) menu.open = false;
      });
  }

  // Obras: filter the catalogue by type. Without JavaScript every work shows.
  document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
    const cards = [...scope.querySelectorAll(".project-card")];
    const buttons = [...scope.querySelectorAll("[data-filter]")];
    const select = scope.querySelector("[data-filter-select]");
    const status = scope.querySelector("[data-filter-status]");
    let category = "all";

    function render() {
      let shown = 0;
      cards.forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
        if (!card.hidden) shown++;
      });
      buttons.forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === category),
        ),
      );
      select.value = category;
      status.textContent = `${shown} ${shown === 1 ? "obra" : "obras"}`;
    }
    const change = (value) => {
      category = value;
      render();
    };
    buttons.forEach((button) =>
      button.addEventListener("click", () => change(button.dataset.filter)),
    );
    select.addEventListener("change", () => change(select.value));
    function revealHash() {
      if (cards.some((card) => `#${card.id}` === window.location.hash))
        change("all");
    }
    scope.querySelector(".project-filters").hidden = false;
    scope.querySelector(".project-select").hidden = false;
    render();
    revealHash();
    window.addEventListener("hashchange", revealHash);
  });

  // Quote form: validates, then prepares the message in WhatsApp or e-mail.
  // Nothing is sent by the site; the visitor confirms the sending there.
  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const fallback = form.querySelector(".message-fallback");
    const count = form.querySelector("[data-char-count]");
    const message = form.querySelector("#mensagem");
    const service = form.querySelector("#servico");
    const setError = (name, text) => {
      const slot = form.querySelector(`#${name}-error`);
      if (slot) slot.textContent = text;
      // Checkbox groups carry the state on their fieldset.
      const input = form.querySelector(`[name="${name}"]`);
      const field = input.type === "checkbox" ? input.closest("fieldset") : input;
      if (text) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    };
    const checked = (name) =>
      [...form.querySelectorAll(`[name="${name}"]:checked`)].map((box) => box.value);
    // "Ainda não tenho" excludes the other options of its group and vice versa.
    form.querySelectorAll("fieldset[data-exclusive]").forEach((group) =>
      group.addEventListener("change", (event) => {
        if (!event.target.checked) return;
        group.querySelectorAll('input[type="checkbox"]').forEach((box) => {
          if (box !== event.target && box.hasAttribute("data-none") !== event.target.hasAttribute("data-none"))
            box.checked = false;
        });
      }),
    );
    const reset = () => {
      fallback.hidden = true;
      fallback.removeAttribute("href");
      status.textContent = "";
      status.classList.remove("is-success", "is-error");
    };
    const updateCount = () => {
      count.textContent = `${message.value.length.toLocaleString("pt-BR")} de 2.000`;
      count.classList.toggle("is-near", message.value.length > 1800);
    };
    // A service page can pre-select its service (?servico=slug).
    const wanted = new URLSearchParams(window.location.search).get("servico");
    if (wanted && [...service.options].some((option) => option.value === wanted))
      service.value = wanted;

    form.addEventListener("input", (event) => {
      reset();
      updateCount();
      if (event.target.name) setError(event.target.name, "");
    });
    form.addEventListener("change", reset);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      reset();
      const data = new FormData(form);
      const value = (name) => String(data.get(name) || "").trim();
      const values = {
        nome: value("nome"),
        empresa: value("empresa"),
        telefone: value("telefone"),
        email: value("email"),
        servico: value("servico"),
        local: value("local"),
        projetos: checked("projetos"),
        documentos: checked("documentos"),
        mensagem: value("mensagem"),
      };
      const digits = values.telefone.replace(/\D/g, "");
      const errors = {};
      if (values.nome.length < 2)
        errors.nome = "Informe seu nome, com pelo menos 2 caracteres.";
      if (digits.length < 10 || digits.length > 13)
        errors.telefone = "Informe um telefone com DDD, por exemplo (21) 99999-9999.";
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email))
        errors.email = "Confira o e-mail ou deixe o campo em branco.";
      if (!values.servico) errors.servico = "Escolha o serviço de interesse.";
      if (values.local.length < 2) errors.local = "Informe a cidade da obra.";
      if (!values.projetos.length)
        errors.projetos = "Marque os projetos disponíveis ou “Ainda não tenho projetos”.";
      if (!values.documentos.length)
        errors.documentos = "Marque a documentação disponível ou “Não tenho documentação técnica”.";
      if (values.mensagem.length < 20)
        errors.mensagem = "Descreva o serviço em pelo menos 20 caracteres.";
      ["nome", "telefone", "email", "servico", "local", "projetos", "documentos", "mensagem"].forEach(
        (name) => setError(name, errors[name] || ""),
      );
      const invalid = Object.keys(errors);
      if (invalid.length) {
        status.classList.add("is-error");
        status.textContent =
          invalid.length === 1
            ? "Confira o campo indicado antes de continuar."
            : `Confira os ${invalid.length} campos indicados antes de continuar.`;
        form.querySelector(`[name="${invalid[0]}"]`).focus();
        return;
      }
      const serviceLabel =
        service.options[service.selectedIndex]?.textContent.trim() || "";
      // Only what the visitor typed goes into the message.
      const lines = [
        `Olá, Ferreira! Meu nome é ${values.nome}${values.empresa ? `, da empresa ${values.empresa}` : ""}.`,
        `Serviço de interesse: ${serviceLabel}.`,
        `Cidade da obra: ${values.local}.`,
        `Telefone para contato: ${values.telefone}.`,
      ];
      if (values.email) lines.push(`E-mail: ${values.email}.`);
      lines.push(
        `Projetos disponíveis: ${values.projetos.join(", ")}.`,
        `Documentação técnica: ${values.documentos.join(", ")}.`,
        "",
        "Descrição do serviço:",
        values.mensagem,
      );
      const text = lines.join("\n");
      const channel = event.submitter?.value === "email" ? "email" : "whatsapp";
      const url =
        channel === "email"
          ? `mailto:${EMAIL}?subject=${encodeURIComponent(`Pedido de orçamento: ${serviceLabel}`)}&body=${encodeURIComponent(text)}`
          : `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
      window.dataLayer?.push({
        event: "quote_form_submit",
        channel,
        source: window.location.pathname,
      });
      fallback.href = url;
      fallback.hidden = false;
      fallback.firstChild.textContent =
        channel === "email" ? "Abrir a mensagem no e-mail" : "Abrir a mensagem no WhatsApp";
      if (channel === "email") fallback.removeAttribute("target");
      else fallback.target = "_blank";
      status.classList.add("is-success");
      status.textContent =
        channel === "email"
          ? "Mensagem preparada no seu aplicativo de e-mail. Ela só será enviada quando você confirmar o envio por lá. Se nada abriu, use o link abaixo."
          : "Mensagem preparada no WhatsApp. Ela só será enviada quando você confirmar no aplicativo. Se a janela não abriu, use o link abaixo.";
      if (channel === "email") window.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    });
    updateCount();
    form.hidden = false;
  });

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
      bar.hidden = categories.length < 2;
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
    bar.hidden = categories.length < 2;

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

  // Home carousel: arrows, indicators, swipe and automatic advance. It holds
  // still while its controls are hovered or focused from the keyboard, off
  // screen or in a background tab, and respects reduced-motion preferences.
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const slides = [...carousel.querySelectorAll(".carousel-slide")];
    const dots = [...carousel.querySelectorAll(".carousel-dot")];
    const track = carousel.querySelector(".carousel-track");
    if (slides.length < 2) return;
    const interval = 6000;
    const holds = new Set();
    let index = 0;
    let playing = !motion.matches;
    let timer = 0;
    let remaining = interval;
    let startedAt = 0;

    slides.forEach((slide) => {
      const image = slide.querySelector("img");
      if (image?.dataset.position) image.style.objectPosition = image.dataset.position;
    });

    function sync() {
      carousel.classList.toggle("is-playing", playing);
      carousel.classList.toggle("is-held", holds.size > 0);
      track.setAttribute("aria-live", playing ? "off" : "polite");
    }
    function run() {
      clearTimeout(timer);
      if (!playing || holds.size) return;
      startedAt = performance.now();
      timer = setTimeout(() => show(index + 1), remaining);
    }
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) =>
        i === index ? dot.setAttribute("aria-current", "true") : dot.removeAttribute("aria-current"),
      );
      // The following image starts loading before its turn.
      const upcoming = slides[(index + 1) % slides.length].querySelector("img");
      if (upcoming) upcoming.loading = "eager";
      remaining = interval;
      run();
    }
    function hold(reason, on) {
      if (on === holds.has(reason)) return;
      if (on) {
        if (!holds.size && playing) remaining -= performance.now() - startedAt;
        holds.add(reason);
        clearTimeout(timer);
      } else {
        holds.delete(reason);
      }
      sync();
      run();
    }

    carousel.querySelector("[data-carousel-prev]").addEventListener("click", () => show(index - 1));
    carousel.querySelector("[data-carousel-next]").addEventListener("click", () => show(index + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => i !== index && show(i)));
    carousel.addEventListener("keydown", (event) => {
      if (!event.target.closest(".carousel-controls")) return;
      if (event.key === "ArrowLeft") show(index - 1);
      else if (event.key === "ArrowRight") show(index + 1);
      else return;
      event.preventDefault();
    });

    // Swipe sideways on touch screens; vertical scrolling stays untouched.
    let start = null;
    track.addEventListener("pointerdown", (event) => {
      start = { x: event.clientX, y: event.clientY };
    });
    track.addEventListener("pointerup", (event) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? index + 1 : index - 1);
    });
    track.addEventListener("pointercancel", () => (start = null));

    // Reading a caption or reaching for a control pauses the countdown.
    carousel.querySelectorAll(".carousel-controls, figcaption").forEach((zone) => {
      zone.addEventListener("pointerenter", (event) => event.pointerType === "mouse" && hold("hover", true));
      zone.addEventListener("pointerleave", () => hold("hover", false));
    });
    carousel.addEventListener("focusin", (event) => {
      if (event.target.matches(":focus-visible")) hold("focus", true);
    });
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) hold("focus", false);
    });
    document.addEventListener("visibilitychange", () => hold("tab", document.hidden));
    if ("IntersectionObserver" in window)
      new IntersectionObserver(([entry]) => hold("view", !entry.isIntersecting), {
        threshold: 0.25,
      }).observe(carousel);
    motion.addEventListener("change", () => {
      playing = !motion.matches;
      remaining = interval;
      sync();
      run();
    });

    carousel.querySelector(".carousel-controls").hidden = false;
    sync();
    run();
  });

  // Content below the first screen rises into place once. Nothing visible on
  // load is hidden, and reduced motion skips the effect entirely.
  if ("IntersectionObserver" in window && !motion.matches) {
    const targets = [
      ...document.querySelectorAll(
        [
          "main .section-head",
          ".work-card",
          ".service-card",
          ".step",
          ".feature-list li",
          ".about-media",
          ".about-copy",
          ".client-quote",
          ".service-block",
          ".principles li",
          ".logo-grid",
          ".partner-grid",
          ".row-list li",
          ".callout",
          ".album",
          ".fit-list li",
        ].join(","),
      ),
    ].filter((node) => node.getBoundingClientRect().top > window.innerHeight);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          target.classList.add("is-in");
          observer.unobserve(target);
          // Once it has arrived, the element gets its own transitions and
          // hover effects back.
          const delay = parseFloat(target.style.getPropertyValue("--reveal-delay")) || 0;
          setTimeout(() => {
            target.classList.remove("reveal", "is-in");
            target.style.removeProperty("--reveal-delay");
          }, 760 + delay);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((target) => {
      const siblings = [...target.parentElement.children].filter((node) =>
        targets.includes(node),
      );
      const order = Math.min(siblings.indexOf(target), 3);
      if (order > 0)
        target.style.setProperty("--reveal-delay", `${order * 80}ms`);
      target.classList.add("reveal");
      observer.observe(target);
    });
    motion.addEventListener("change", () => {
      if (motion.matches) targets.forEach((target) => target.classList.add("is-in"));
    });
  }

  // WhatsApp shortcut, lower-right corner. It steps aside where the page
  // already offers contact or where it would cover controls, and on phones
  // it also hides while reading downwards.
  const header = document.querySelector(".site-header");
  const float = document.createElement("a");
  float.className = "whatsapp-float";
  float.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Ferreira! Vim pelo site e gostaria de solicitar um orçamento.")}`;
  float.target = "_blank";
  float.rel = "noopener noreferrer";
  float.dataset.analyticsEvent = "whatsapp_floating";
  float.setAttribute("aria-label", "Falar com a Ferreira pelo WhatsApp");
  {
    const ns = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(ns, "svg");
    const path = document.createElementNS(ns, "path");
    Object.entries({
      "aria-hidden": "true",
      focusable: "false",
      class: "icon",
      viewBox: "0 0 24 24",
      fill: "currentColor",
    }).forEach(([name, value]) => icon.setAttribute(name, value));
    // WhatsApp glyph (Simple Icons, CC0), reused from the page markup.
    const glyph = document.querySelector(".icon-wa path");
    if (glyph) path.setAttribute("d", glyph.getAttribute("d"));
    icon.append(path);
    float.append(icon);
  }
  document.body.append(float);
  const busy = new Set();
  const phone = window.matchMedia("(max-width: 640px)");
  let lastY = window.scrollY;
  let goingDown = false;
  function syncScroll() {
    const y = window.scrollY;
    if (Math.abs(y - lastY) > 6) {
      goingDown = y > lastY;
      lastY = y;
    }
    header?.classList.toggle("is-scrolled", y > 8);
    float.classList.toggle(
      "is-visible",
      y > 240 && busy.size === 0 && !(phone.matches && goingDown),
    );
  }
  if ("IntersectionObserver" in window)
    [
      ".hero",
      ".cta-band",
      ".contact-section",
      ".project-toolbar",
      ".project-pager",
      ".faq-list",
      ".site-footer",
    ]
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .forEach((zone) =>
        new IntersectionObserver((entries) => {
          entries.forEach((entry) =>
            entry.isIntersecting ? busy.add(zone) : busy.delete(zone),
          );
          syncScroll();
        }).observe(zone),
      );
  window.addEventListener("scroll", syncScroll, { passive: true });
  syncScroll();

  // Touch screens have no hover: the item crossing the middle of the
  // screen gets the same highlight a mouse would give it.
  const touch = window.matchMedia("(hover: none)");
  if (touch.matches && "IntersectionObserver" in window) {
    const focusable = document.querySelectorAll(
      ".work-link, .service-card, .album.is-card, .row-link, .channel-list a",
    );
    const near = new Set();
    let current = null;
    const pick = () => {
      const middle = window.innerHeight / 2;
      let best = null;
      let bestDistance = Infinity;
      near.forEach((item) => {
        const box = item.getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < bestDistance) {
          best = item;
          bestDistance = distance;
        }
      });
      if (best === current) return;
      current?.classList.remove("is-centered");
      best?.classList.add("is-centered");
      current = best;
    };
    const centre = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting ? near.add(entry.target) : near.delete(entry.target),
        );
        pick();
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    focusable.forEach((item) => centre.observe(item));
    window.addEventListener("scroll", () => near.size > 1 && pick(), {
      passive: true,
    });
  }

  // Lazy images fade in instead of popping.
  document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
    if (image.complete) return;
    image.classList.add("lazy-fade");
    const done = () => image.classList.add("is-loaded");
    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });
  });
})();
