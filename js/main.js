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
          ? `${visible.length} ${visible.length === 1 ? "projeto" : "projetos"}`
          : `${visible.length} de ${matching.length} projetos`;
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
        mensagem: value("mensagem"),
      };
      const errors = {};
      if (values.nome.length < 2 || values.nome.length > 100)
        errors.nome = "Informe seu nome, entre 2 e 100 caracteres.";
      if (values.local.length < 2 || values.local.length > 100)
        errors.local = "Informe o bairro ou a cidade.";
      if (values.mensagem.length < 10 || values.mensagem.length > 2000)
        errors.mensagem = "Escreva entre 10 e 2.000 caracteres.";
      const names = ["nome", "local", "mensagem"];
      names.forEach((name) => messageError(name, errors[name] || ""));
      status.classList.toggle("is-error", Object.keys(errors).length > 0);
      if (Object.keys(errors).length) {
        status.textContent = "Confira os campos indicados antes de continuar.";
        form.querySelector(`[name="${Object.keys(errors)[0]}"]`).focus();
        return;
      }
      const lines = [
        "Olá, gostaria de solicitar um orçamento.",
        "",
        `Nome: ${values.nome}`,
      ];
      lines.push(`Local: ${values.local}`);
      if (values.tipo) lines.push(`Projeto: ${values.tipo}`);
      lines.push("", values.mensagem);
      const url = `https://wa.me/5521965906030?text=${encodeURIComponent(lines.join("\n"))}`;
      fallback.href = url;
      fallback.hidden = false;
      status.textContent =
        "Mensagem preparada. Revise e confirme o envio no WhatsApp. Se a janela não abriu, use o link abaixo.";
      window.open(url, "_blank", "noopener,noreferrer");
    });
    form.hidden = false;
  });

  const process = document.querySelector(".process-section");
  if (process) {
    const items = [...process.querySelectorAll(".process-list li")];
    const toggle = process.querySelector(".process-toggle");
    let current = 0,
      timer = null,
      inView = false,
      paused = false;
    const paint = () =>
      items.forEach((item, index) => {
        item.classList.toggle(
          "is-active",
          !motion.matches && index === current,
        );
        item.classList.toggle(
          "is-complete",
          !motion.matches && index < current,
        );
      });
    function syncProcess() {
      clearInterval(timer);
      timer = null;
      toggle.hidden = motion.matches;
      paint();
      if (inView && !paused && !document.hidden && !motion.matches)
        timer = setInterval(() => {
          current = (current + 1) % items.length;
          paint();
        }, 2000);
    }
    toggle.addEventListener("click", () => {
      paused = !paused;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.querySelector("span").textContent = paused
        ? "Retomar animação"
        : "Pausar animação";
      syncProcess();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          inView = entries[0].isIntersecting;
          syncProcess();
        },
        { threshold: 0.15 },
      ).observe(process);
    } else {
      inView = true;
    }
    document.addEventListener("visibilitychange", syncProcess);
    motion.addEventListener("change", syncProcess);
    window.addEventListener("pagehide", () => clearInterval(timer));
    window.addEventListener("pageshow", syncProcess);
    syncProcess();
  }

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
      trigger = null,
      touchX = null,
      touchY = null;
    function display(nextIndex) {
      index = (nextIndex + photos.length) % photos.length;
      const photo = photos[index];
      image.alt = photo.dataset.caption || photo.querySelector("img").alt;
      image.src = photo.href;
      caption.textContent = image.alt;
      count.textContent = `${index + 1} / ${photos.length}`;
    }
    previous.hidden = next.hidden = photos.length < 2;
    photos.forEach((photo, photoIndex) =>
      photo.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        trigger = photo;
        display(photoIndex);
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
})();
