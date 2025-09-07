import { useEffect, useRef } from 'react';

interface Options {
  /** 触发进入下一个区块的滚动阈值（视口高度百分比 0~1） */
  threshold?: number;
  /** 是否只在首次浏览时启用（刷新后重置） */
  oncePerSession?: boolean;
  /** 动画时长超时时间，避免卡住 */
  timeoutMs?: number;
}

/**
 * useSectionSnap
 * 在用户首次向下滚动并且超过某个阈值时，自动对齐到下一个 section。
 * 支持 sessionStorage 标记，避免每次小滚动都触发；尊重 prefers-reduced-motion。
 */
export function useSectionSnap(sectionIds: string[], {
  threshold = 0.28,
  oncePerSession = true,
  timeoutMs = 1200,
}: Options = {}) {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // 尊重用户设置

    if (oncePerSession && sessionStorage.getItem('section-snap-done')) return;

    function onScroll() {
      if (triggeredRef.current) return;
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // 找到当前第一个在视口上部的 section
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const topFromDoc = rect.top + scrollY;

        // 如果当前滚动已经超过这个 section 的起点 + 阈值 * 视口高度，则对齐到它的下一个
        if (scrollY > topFromDoc + threshold * vh - vh) {
          const nextId = sectionIds[i + 1];
          if (!nextId) return;
          const nextEl = document.getElementById(nextId);
          if (!nextEl) return;
          triggeredRef.current = true;
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (oncePerSession) sessionStorage.setItem('section-snap-done', '1');
          // 安全超时复位（可继续其他跳转逻辑）
          setTimeout(() => { triggeredRef.current = true; }, timeoutMs);
          break;
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionIds, threshold, oncePerSession, timeoutMs]);
}
