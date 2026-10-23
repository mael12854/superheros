import { useEffect, useState } from 'react';

export function naviguer(chemin) {
  if (chemin === window.location.pathname + window.location.search) return;
  window.history.pushState({}, '', chemin);
  window.dispatchEvent(new Event('m2-nav'));
  window.scrollTo(0, 0);
}

export function useChemin() {
  const [chemin, setChemin] = useState(window.location.pathname);
  useEffect(() => {
    const maj = () => setChemin(window.location.pathname);
    window.addEventListener('popstate', maj);
    window.addEventListener('m2-nav', maj);
    return () => {
      window.removeEventListener('popstate', maj);
      window.removeEventListener('m2-nav', maj);
    };
  }, []);
  return chemin;
}

export function surLien(e) {
  const a = e.target.closest('a');
  if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin || url.pathname.startsWith('/api') || url.pathname.endsWith('.html')) return;
  e.preventDefault();
  naviguer(url.pathname + url.search);
}
