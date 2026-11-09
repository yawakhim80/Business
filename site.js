(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');
  const closeMenu = () => {
    if (!toggle || !navigation) return;
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  if (toggle && navigation) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      navigation.classList.toggle('is-open', !expanded);
    });
    navigation.addEventListener('click', event => {
      if (event.target instanceof HTMLAnchorElement) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
        toggle.focus();
      }
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  const adminEntry = document.querySelector('.admin-entry');
  let logoClicks = 0;
  let logoClickTimer;
  document.querySelectorAll('.brand-mark').forEach(mark => {
    mark.addEventListener('click', event => {
      event.preventDefault();
      logoClicks += 1;
      window.clearTimeout(logoClickTimer);
      if (logoClicks >= 3) {
        logoClicks = 0;
        if (adminEntry) {
          adminEntry.hidden = false;
          adminEntry.focus();
        }
        return;
      }
      logoClickTimer = window.setTimeout(() => {
        logoClicks = 0;
      }, 5000);
    });
  });

  const animated = document.querySelectorAll('.business-card, .value-item, .intro-body');
  if ('IntersectionObserver' in window) {
    animated.forEach(item => item.classList.add('reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animated.forEach(item => observer.observe(item));
  }
})();
