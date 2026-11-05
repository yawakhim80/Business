(() => {
  document.documentElement.classList.add('js');
  const toggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.hotel-nav');
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
})();
