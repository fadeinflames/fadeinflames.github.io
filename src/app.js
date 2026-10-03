import { mountSphere } from './sphere.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = null;
try {
  const saved = localStorage.getItem('portfolio-motion');
  userPaused = saved === 'paused' ? true : saved === 'playing' ? false : null;
} catch { /* Storage may be unavailable in private browsers. */ }
let paused = false;
const canvas = document.querySelector('#sphere');
const sphere = canvas ? mountSphere(canvas) : null;
const toggle = document.querySelector('#motion-toggle');
function applyMotion() {
  paused = userPaused === true || reduceMotion.matches;
  const label = reduceMotion.matches ? 'Анимация отключена настройками системы' : paused ? 'Включить анимацию' : 'Остановить анимацию';
  document.documentElement.classList.toggle('motion-paused', paused);
  sphere?.setPaused(paused);
  toggle?.setAttribute('aria-pressed', String(paused));
  toggle?.setAttribute('aria-label', label);
  if (toggle) {
    toggle.querySelector('.pause-icon').hidden = paused;
    toggle.querySelector('.play-icon').hidden = !paused;
    document.querySelector('#motion-tip').textContent = label;
  }
}
applyMotion();
toggle?.addEventListener('click', () => {
  userPaused = !paused;
  applyMotion();
  try { localStorage.setItem('portfolio-motion', userPaused ? 'paused' : 'playing'); } catch { /* Keep this choice for the current page. */ }
});
reduceMotion.addEventListener('change', applyMotion);

if ('IntersectionObserver' in window && !paused) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('waiting');
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add('waiting');
    observer.observe(element);
  });
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(control => {
      const active = control === button;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) { count++; card.classList.remove('waiting'); }
    });
    document.querySelector('#filter-status').textContent = `Показано проектов: ${count}`;
  });
});

document.querySelector('#copy-profile')?.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(window.location.href);
    status.textContent = 'Ссылка скопирована';
  } catch {
    status.textContent = `Скопируй адрес: ${window.location.href}`;
    console.warn(JSON.stringify({ event: 'portfolio_copy_failed', feature: 'share-link' }));
  }
});
window.addEventListener('pagehide', event => {
  if (event.persisted) sphere?.setPaused(true);
  else sphere?.destroy();
});
window.addEventListener('pageshow', event => { if (event.persisted) applyMotion(); });
