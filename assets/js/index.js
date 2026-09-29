const snippets = {
      queue: `// useAsyncQueue: Manages concurrency-bounded asynchronous job executions
import { useState, useEffect, useRef } from 'react';

export function useAsyncQueue<T>(concurrency = 2) {
  const [pending, setPending] = useState<number>(0);
  const queueRef = useRef<(() => Promise<T>)[]>([]);
  const activeCount = useRef(0);

  const next = () => {
    if (activeCount.current >= concurrency || queueRef.current.length === 0) return;
    const task = queueRef.current.shift();
    if (!task) return;
    
    activeCount.current += 1;
    task().finally(() => {
      activeCount.current -= 1;
      setPending(queueRef.current.length);
      next();
    });
  };

  const enqueue = (task: () => Promise<T>) => {
    queueRef.current.push(task);
    setPending(queueRef.current.length);
    next();
  };

  return { enqueue, pending };
}`,
      rate: `// RateLimiter.js: Token Bucket implementation for Edge Functions
class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  consume(tokens = 1) {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { allowed: true, remaining: Math.floor(this.tokens) };
    }
    return { allowed: false, remaining: 0 };
  }
}

export const limiter = new TokenBucket(60, 10);`,
      hook: `// ThemeHook.tsx: System-aware dark/light context synchronizer
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};`
    };

    let currentKey = 'queue';

    function switchSnippet(key) {
      currentKey = key;
      const display = document.getElementById('code-display');
      const tabs = ['queue', 'rate', 'hook'];
      
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (t === key) {
          btn.className = "px-4 py-1.5 rounded-lg text-xs font-mono font-medium text-[#00F2FE] bg-white/[0.08] border border-white/[0.08] transition-all";
        } else {
          btn.className = "px-4 py-1.5 rounded-lg text-xs font-mono font-medium text-gray-400 hover:text-white transition-all";
        }
      });

      display.textContent = snippets[key];
    }

    function copySnippetCode() {
      const textToCopy = snippets[currentKey];
      navigator.clipboard.writeText(textToCopy).then(() => {
        const copyText = document.getElementById('copy-text');
        copyText.textContent = 'Copied!';
        setTimeout(() => {
          copyText.textContent = 'Copy';
        }, 2000);
      });
    }

    function handleContactSubmit(e) {
      e.preventDefault();
      const feedback = document.getElementById('form-feedback');
      const btn = document.getElementById('submit-btn');
      
      btn.disabled = true;
      btn.classList.add('opacity-70');
      
      setTimeout(() => {
        feedback.classList.remove('hidden');
        btn.innerHTML = `<span>Sent</span><span class="material-symbols-outlined text-[18px]">done</span>`;
        e.target.reset();
      }, 500);
    }

    const themeToggle = document.getElementById('theme-toggle');
    const THEME_KEY = 'portfolio-theme';

    function applyTheme(theme) {
      const isDark = theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      localStorage.setItem(THEME_KEY, theme);

      if (themeToggle) {
        const icon = themeToggle.querySelector('.material-symbols-outlined');
        if (icon) {
          icon.textContent = isDark ? 'dark_mode' : 'light_mode';
        }
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      }
    }

    const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

    themeToggle?.addEventListener('click', () => {
      const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(nextTheme);
    });

    document.querySelectorAll('[data-snippet]').forEach((button) => {
      button.addEventListener('click', () => switchSnippet(button.dataset.snippet));
    });

    document.getElementById('copy-code-btn')?.addEventListener('click', copySnippetCode);
    document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);

    const primaryNavigation = document.getElementById('primary-navigation');
    const navigationIndicator = primaryNavigation?.querySelector('.nav-indicator');
    const sectionLinks = [...(primaryNavigation?.querySelectorAll('[data-scroll-target]') ?? [])];
    const observedSections = sectionLinks
      .map((link) => document.getElementById(link.dataset.scrollTarget))
      .filter((section) => section && section.id !== 'top');
    let activeNavigationTarget = null;
    let navigationFramePending = false;
    let pendingNavigationTarget = null;
    let scrollSettleTimer = null;

    function setActiveNavigation(target) {
      const activeLink = sectionLinks.find((link) => link.dataset.scrollTarget === target);
      if (!activeLink || target === activeNavigationTarget) return;
      activeNavigationTarget = target;

      sectionLinks.forEach((link) => {
        if (link === activeLink) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });

      if (!navigationIndicator || primaryNavigation.offsetParent === null) return;
      navigationIndicator.style.width = `${activeLink.offsetWidth}px`;
      navigationIndicator.style.transform = `translate3d(${activeLink.offsetLeft}px, 0, 0)`;

      if (primaryNavigation.scrollWidth > primaryNavigation.clientWidth) {
        const navigationBounds = primaryNavigation.getBoundingClientRect();
        const linkBounds = activeLink.getBoundingClientRect();
        if (linkBounds.left < navigationBounds.left + 8) {
          primaryNavigation.scrollLeft -= navigationBounds.left + 8 - linkBounds.left;
        } else if (linkBounds.right > navigationBounds.right - 8) {
          primaryNavigation.scrollLeft += linkBounds.right - navigationBounds.right + 8;
        }
      }
    }

    function updateNavigationFromScroll() {
      if (pendingNavigationTarget) return;

      const scrollMarker = window.scrollY + window.innerHeight * 0.3;
      let currentTarget = 'top';

      observedSections.forEach((section) => {
        if (section.offsetTop <= scrollMarker) currentTarget = section.id;
      });
      setActiveNavigation(currentTarget);
    }

    function scheduleNavigationUpdate() {
      if (pendingNavigationTarget) {
        window.clearTimeout(scrollSettleTimer);
        scrollSettleTimer = window.setTimeout(finishNavigationScroll, 180);
        return;
      }
      if (navigationFramePending) return;
      navigationFramePending = true;
      window.requestAnimationFrame(() => {
        navigationFramePending = false;
        updateNavigationFromScroll();
      });
    }

    function finishNavigationScroll() {
      window.clearTimeout(scrollSettleTimer);
      pendingNavigationTarget = null;
      updateNavigationFromScroll();
    }

    sectionLinks.forEach((link) => {
      link.addEventListener('click', () => {
        pendingNavigationTarget = link.dataset.scrollTarget;
        setActiveNavigation(pendingNavigationTarget);
        window.clearTimeout(scrollSettleTimer);
        scrollSettleTimer = window.setTimeout(finishNavigationScroll, 180);
      });
    });
    window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
    window.addEventListener('scrollend', finishNavigationScroll);
    window.addEventListener('resize', () => {
      updateNavigationFromScroll();
      if (activeNavigationTarget) {
        const activeLink = sectionLinks.find((link) => link.dataset.scrollTarget === activeNavigationTarget);
        if (activeLink && navigationIndicator && primaryNavigation.offsetParent !== null) {
          navigationIndicator.style.width = `${activeLink.offsetWidth}px`;
          navigationIndicator.style.transform = `translate3d(${activeLink.offsetLeft}px, 0, 0)`;
        }
      }
    });
    window.addEventListener('load', updateNavigationFromScroll, { once: true });
    setActiveNavigation('top');
    updateNavigationFromScroll();
