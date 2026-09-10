document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

if (document.documentElement.classList.contains('home-intro')) {
  window.setTimeout(() => {
    document.documentElement.classList.remove('home-intro');
  }, 2000);
}

const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const getEffectiveTheme = () => {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return prefersDark.matches ? 'dark' : 'light';
  };

  const syncThemeUi = (theme) => {
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    themeToggle.setAttribute('title', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#171717' : '#f7f7f5');
    }
  };

  const applyTheme = (theme, persist = true) => {
    document.documentElement.setAttribute('data-theme', theme);
    syncThemeUi(theme);
    if (persist) {
      try {
        localStorage.setItem('theme', theme);
      } catch (error) {
        // localStorage indisponivel: a escolha vale so para esta visita.
      }
    }
  };

  syncThemeUi(getEffectiveTheme());

  themeToggle.addEventListener('click', () => {
    applyTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
  });

  prefersDark.addEventListener('change', () => {
    if (!document.documentElement.getAttribute('data-theme')) {
      syncThemeUi(getEffectiveTheme());
    }
  });
}

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    const menu = link.closest('details');
    if (menu) menu.removeAttribute('open');
  });
});

const mobileMenu = document.querySelector('.mobile-menu');
if (mobileMenu) {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !mobileMenu.open) return;
    mobileMenu.open = false;
    mobileMenu.querySelector('summary').focus();
  });
  document.addEventListener('click', (event) => {
    if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
  });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const validators = {
    nome: (value) => (value.trim().length < 2 ? 'Digite seu nome.' : ''),
    telefone: (value) => (value.replace(/\D/g, '').length < 10 ? 'Digite um telefone válido com DDD.' : ''),
    mensagem: (value) => (value.trim().length < 10 ? 'Conte um pouco mais sobre o projeto.' : ''),
  };
  const formStatus = document.getElementById('form-status');

  const validateField = (field) => {
    const validate = validators[field.name];
    if (!validate) return true;
    const wrapper = field.closest('.form-field');
    const errorEl = wrapper.querySelector('.field-error');
    const message = validate(field.value);
    wrapper.classList.toggle('is-invalid', Boolean(message));
    wrapper.classList.toggle('is-valid', !message && field.value.trim().length > 0);
    if (errorEl) errorEl.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  Object.keys(validators).forEach((name) => {
    const field = contactForm.elements.namedItem(name);
    if (!field) return;
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.form-field').classList.contains('is-invalid')) validateField(field);
    });
  });

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    let firstInvalid = null;
    Object.keys(validators).forEach((name) => {
      const field = contactForm.elements.namedItem(name);
      if (!field) return;
      const valid = validateField(field);
      if (!valid && !firstInvalid) firstInvalid = field;
      if (!valid) {
        const wrapper = field.closest('.form-field');
        wrapper.classList.remove('shake');
        // eslint-disable-next-line no-unused-expressions
        wrapper.offsetWidth;
        wrapper.classList.add('shake');
      }
    });

    if (firstInvalid) {
      formStatus.textContent = 'Verifique os campos destacados antes de enviar.';
      formStatus.className = 'form-status is-visible is-error';
      firstInvalid.focus();
      return;
    }

    const nome = String(data.get('nome') || '').trim();
    const telefone = String(data.get('telefone') || '').trim();
    const tipo = String(data.get('tipo') || '').trim();
    const mensagem = String(data.get('mensagem') || '').trim();
    const lines = [
      `Olá, meu nome é ${nome}.`,
      `Tipo de projeto: ${tipo}.`,
      `Telefone para contato: ${telefone}.`,
      '',
      mensagem,
    ];
    const text = encodeURIComponent(lines.join('\n'));
    formStatus.textContent = 'Tudo certo! Abrindo o WhatsApp com sua mensagem...';
    formStatus.className = 'form-status is-visible is-success';
    window.open(`https://wa.me/5521965906030?text=${text}`, '_blank', 'noopener,noreferrer');
  });
}

document.querySelectorAll('[data-project-filter-scope]').forEach((scope) => {
  const buttons = scope.querySelectorAll('[data-project-filter]');
  const cards = Array.from(scope.querySelectorAll('[data-project-card]'));
  const select = scope.querySelector('[data-project-select]');
  const more = scope.querySelector('[data-project-more]');
  const status = scope.querySelector('[data-project-filter-status]');
  const grid = scope.querySelector('.home-project-grid');
  const limit = Number(scope.dataset.projectLimit) || cards.length;
  let filter = 'all';
  let expanded = false;

  if (!cards.length || !grid) return;
  scope.querySelectorAll('.home-project-filters, .project-filter-mobile').forEach((el) => {
    el.hidden = false;
  });

  const render = () => {
    const matching = cards.filter((card) => filter === 'all' || card.dataset.category === filter);
    const visible = expanded ? matching : matching.slice(0, limit);
    const orphan = visible.length % 3 === 1 ? visible[visible.length - 1] : null;
    cards.forEach((card) => {
      card.hidden = !visible.includes(card);
      card.classList.toggle('is-row-orphan', card === orphan);
    });
    buttons.forEach((button) => {
      const active = button.dataset.projectFilter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (select) select.value = filter;
    grid.dataset.visibleCount = String(visible.length);
    if (status) status.textContent = visible.length < matching.length
      ? `${visible.length} de ${matching.length}`
      : `${matching.length} ${matching.length === 1 ? 'resultado' : 'resultados'}`;
    if (more) {
      more.hidden = matching.length <= limit;
      more.setAttribute('aria-expanded', String(expanded));
      more.textContent = expanded ? 'Mostrar menos' : 'Ver mais projetos';
    }
  };

  const setFilter = (value) => {
    filter = value;
    expanded = false;
    render();
  };
  buttons.forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.projectFilter));
  });
  if (select) select.addEventListener('change', () => setFilter(select.value));
  if (more) more.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });
  render();
});

const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > siteHeader.offsetHeight - 1);
  };
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  window.addEventListener('resize', updateHeaderState);
}

document.querySelectorAll('img:not([fetchpriority="high"])').forEach((img) => {
  if (img.complete) {
    img.classList.add('is-loaded');
    return;
  }
  const markLoaded = () => img.classList.add('is-loaded');
  img.addEventListener('load', markLoaded, { once: true });
  img.addEventListener('error', markLoaded, { once: true });
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroImage = document.querySelector('.hero-image');
if (heroImage && !prefersReducedMotion) {
  let ticking = false;
  const updateParallax = () => {
    const offset = Math.min(window.scrollY * 0.12, 50);
    heroImage.style.transform = `translateY(${offset}px) scale(1.08)`;
    ticking = false;
  };
  updateParallax();
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

if ('IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.intro-copy, .intro-facts, .service-row, .work-tile, .assurance-copy, .assurance-image, ' +
    '.about-portrait, .about-copy, .track-list, .contact-cta > div, .contact-cta > a, ' +
    '.profile-image, .profile-copy, .values-layout > div, .values-layout li, .numbers-section > div, ' +
    '.service-detail-row, .process-list li, .portfolio-item, .record-layout > div, ' +
    '.contact-form, .contact-options, .address-layout, .faq-item, .map-embed, ' +
    '.reinforcement-card, .partner-card, .home-projects-heading, .home-project-card'
  );

  if (prefersReducedMotion) {
    revealTargets.forEach((el) => el.classList.add('reveal-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach((el, index) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(el);
    });
  }
}

const processSection = document.querySelector('.process-section');
if (processSection && !prefersReducedMotion) {
  if ('IntersectionObserver' in window) {
    const processObserver = new IntersectionObserver(
      ([entry]) => {
        processSection.classList.toggle('is-animated', entry.isIntersecting);
      },
      { threshold: 0.24 }
    );
    processObserver.observe(processSection);
  } else {
    processSection.classList.add('is-animated');
  }
}

if ('IntersectionObserver' in window) {
  const counters = document.querySelectorAll('[data-count-to]');
  const animateCounter = (el) => {
    const target = Number(el.dataset.countTo);
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';
    if (prefersReducedMotion || Number.isNaN(target)) {
      el.textContent = `${prefix}${target}${suffix}`;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (counters.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }
}

const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  const updateBackToTop = () => {
    const visible = window.scrollY > window.innerHeight * 0.8;
    backToTop.classList.toggle('is-visible', visible);
    backToTop.tabIndex = visible ? 0 : -1;
    backToTop.setAttribute('aria-hidden', String(!visible));
  };
  updateBackToTop();
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}
