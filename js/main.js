document.querySelectorAll('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    const menu = link.closest('details');
    if (menu) menu.removeAttribute('open');
  });
});

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
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
    window.open(`https://wa.me/5521965906030?text=${text}`, '_blank', 'noopener,noreferrer');
  });
}

const filterBar = document.querySelector('.filter-bar');
const portfolioItems = document.querySelectorAll('.portfolio-item');
if (filterBar && portfolioItems.length) {
  filterBar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    filterBar.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('is-active', btn === button);
      btn.setAttribute('aria-pressed', String(btn === button));
    });
    const filter = button.dataset.filter;
    portfolioItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.hidden = !show;
    });
  });
}

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

if ('IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.intro-copy, .intro-facts, .service-row, .work-tile, .assurance-copy, .assurance-image, ' +
    '.about-portrait, .about-copy, .track-list, .contact-cta > div, .contact-cta > a, ' +
    '.profile-image, .profile-copy, .values-layout > div, .values-layout li, .numbers-section > div, ' +
    '.service-detail-row, .process-list li, .portfolio-item, .record-layout > div, ' +
    '.contact-form, .contact-options, .address-layout, .faq-item, .map-embed, .project-preview a'
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
    backToTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
  };
  updateBackToTop();
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}
