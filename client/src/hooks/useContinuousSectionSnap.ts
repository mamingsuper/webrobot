import { useEffect, useRef } from 'react';

interface Options {
  /** 双向共用阈值（若未提供 directional 具体值时备用） */
  thresholdRatio?: number;         // 进入某 section 视口可见高度比例后吸附
  /** 向下滚动（用户往后翻页）时使用的可见比例阈值（更宽松） */
  forwardThresholdRatio?: number;
  /** 向上滚动（用户回看上一页）时使用的可见比例阈值（更严格，避免轻微上滑就回跳） */
  backwardThresholdRatio?: number;
  debounceMs?: number;             // 滚动结束判定的防抖时间
  minScrollDelta?: number;         // 防止轻微抖动触发
  maxSectionSnapHeightRatio?: number; // 超过此高度（相对视口倍数）的区块不做 snap（如长列表）
  respectReducedMotion?: boolean;
  /** snap 触发后的一段冷却期（毫秒），防止刚吸附又立刻被反向轻微滚动触发 */
  cooldownMs?: number;
  /** 吸附动画完成后锁定的最小停顿（与 cooldown 类似，可共用，预留扩展） */
  lockAfterSnapMs?: number;
  /** 进入同一个 section 的顶部允许的最大距离（像素）内不重复吸附 */
  repeatSnapTolerance?: number;
}

/**
 * 连续吸附：每次用户停止滚动时，将视图平滑对齐到最近的 Section 顶部。
 * - 支持大型长区块跳过（避免 Publications 被强制贴顶频繁跳动）
 * - 支持用户系统减少动画偏好
 */
export function useContinuousSectionSnap(sectionIds: string[], options: Options = {}) {
  const {
    thresholdRatio = 0.35,
    forwardThresholdRatio = options.thresholdRatio ?? 0.32,
    backwardThresholdRatio = 0.55,
    debounceMs = 140,
    minScrollDelta = 28,
    maxSectionSnapHeightRatio = 1.6,
    respectReducedMotion = true,
    cooldownMs = 650,
    lockAfterSnapMs = 0,
    repeatSnapTolerance = 4,
  } = options;

  const lastY = useRef<number>(0);
  const timer = useRef<number | null>(null);
  const animating = useRef(false);
  const lastSnapTime = useRef<number>(0);
  const lastSnappedId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function getSections() {
      return sectionIds
        .map(id => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el);
    }

    function scheduleSnap() {
      if (animating.current) return;
      const now = performance.now();
      if (now - lastSnapTime.current < cooldownMs) {
        return; // 冷却中
      }
      const vh = window.innerHeight;
      const sections = getSections();
      let target: HTMLElement | null = null;
      let minDist = Infinity;
      // 判断滚动方向
      const direction: 'forward' | 'backward' = window.scrollY >= lastY.current ? 'forward' : 'backward';
      const dirThreshold = direction === 'forward' ? forwardThresholdRatio : backwardThresholdRatio;

      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        const topDist = Math.abs(rect.top);
        const visibleHeight = Math.min(rect.height, Math.min(vh, Math.max(0, vh - Math.max(0, rect.top))));
        const visibleRatio = visibleHeight / vh;
        const tooTall = rect.height / vh > maxSectionSnapHeightRatio;
        if (tooTall && topDist > 140) continue;
        if (visibleRatio >= dirThreshold && topDist < minDist) {
          minDist = topDist;
          target = el;
        }
      }

      if (target) {
        // 如果已经在该 section 顶部附近且是重复目标则跳过
        if (lastSnappedId.current === target.id && Math.abs(target.getBoundingClientRect().top) <= repeatSnapTolerance) {
          return;
        }
        animating.current = true;
        lastSnappedId.current = target.id;
        lastSnapTime.current = now;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const releaseDelay = Math.max(650, cooldownMs + lockAfterSnapMs);
        window.setTimeout(() => { animating.current = false; }, releaseDelay);
      }
    }

    function onScroll() {
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastY.current) < minScrollDelta) return; // 微小滚动忽略
      lastY.current = currentY;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(scheduleSnap, debounceMs) as unknown as number;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [sectionIds, thresholdRatio, forwardThresholdRatio, backwardThresholdRatio, debounceMs, minScrollDelta, maxSectionSnapHeightRatio, respectReducedMotion, cooldownMs, lockAfterSnapMs, repeatSnapTolerance]);
}
