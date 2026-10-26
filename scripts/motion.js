const motionTargets = '[data-motion="hero-copy"], [data-motion="hero-visual"], [data-motion="section"], [data-motion="section-item"]';

export function initMotion(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return () => {};

  const elements = [...root.querySelectorAll(motionTargets)];
  if (!elements.length) return () => {};

  const preference = typeof globalThis.matchMedia === 'function'
    ? globalThis.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const observer = typeof globalThis.IntersectionObserver === 'function'
    ? new globalThis.IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.target.hasAttribute('data-motion-state')) continue;
        entry.target.setAttribute('data-motion-state', 'entering');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    : null;
  const groupedItems = root.querySelectorAll('[data-motion-stagger]');
  for (const group of groupedItems) {
    const items = group.querySelectorAll('[data-motion="section-item"]');
    items.forEach((item, index) => item.style.setProperty('--motion-delay', `${Math.min(index * 30, 120)}ms`));
  }

  const observePending = () => {
    if (!observer) return;
    for (const element of elements) {
      if (!element.hasAttribute('data-motion-state')) observer.observe(element);
    }
  };

  const showImmediately = () => {
    observer?.disconnect();
    for (const element of elements) element.setAttribute('data-motion-state', 'complete');
  };

  const onPreferenceChange = (event) => {
    if (event.matches) showImmediately();
    else observePending();
  };

  const onAnimationEnd = (event) => {
    if (event.target.getAttribute('data-motion-state') === 'entering') {
      event.target.setAttribute('data-motion-state', 'complete');
    }
  };

  root.addEventListener('animationend', onAnimationEnd);
  preference?.addEventListener('change', onPreferenceChange);
  if (preference?.matches) showImmediately();
  else observePending();

  return () => {
    observer?.disconnect();
    preference?.removeEventListener('change', onPreferenceChange);
    root.removeEventListener('animationend', onAnimationEnd);
  };
}
