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
