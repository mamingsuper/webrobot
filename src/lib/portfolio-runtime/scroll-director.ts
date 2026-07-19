export type ScrollDirectorOptions = {
  onProgress: (progress: number) => void;
  reducedMotion: boolean;
};

export type ScrollDirector = {
  refresh: () => void;
  setDebugProgress: (progress: number | null) => void;
  destroy: () => void;
};

const sectionSelector = ".js-section[section-name]";
const anchorSelector = "[anchor-link]";
const revealSelector = "[data-reveal]";

export function mapScrollOffsetToProgress(
  scrollOffset: number,
  sectionOffsets: readonly number[],
) {
  if (sectionOffsets.length < 2) {
    return 0;
  }

  const lastIndex = sectionOffsets.length - 1;
  const clampedOffset = Math.max(sectionOffsets[0], scrollOffset);

  if (clampedOffset >= sectionOffsets[lastIndex]) {
    return lastIndex;
  }

  for (let index = 0; index < lastIndex; index += 1) {
    const start = sectionOffsets[index];
    const end = Math.max(start + 1, sectionOffsets[index + 1]);

    if (clampedOffset <= end) {
      const localProgress = Math.min(1, Math.max(0, (clampedOffset - start) / (end - start)));
      return index + localProgress;
    }
  }

  return lastIndex;
}

export function dampProgress(current: number, target: number, deltaSeconds: number) {
  const damping = 20;
  const alpha = 1 - Math.exp(-damping * Math.max(0, deltaSeconds));
  return current + (target - current) * alpha;
}

function sectionName(element: Element) {
  return element.getAttribute("section-name") ?? "";
}

export function createScrollDirector({
  onProgress,
  reducedMotion,
}: ScrollDirectorOptions): ScrollDirector {
  const sections = Array.from(document.querySelectorAll<HTMLElement>(sectionSelector)).filter(
    (section) => sectionName(section) !== "cv",
  );
  const anchors = Array.from(document.querySelectorAll<HTMLElement>("[anchor-target]"));
  const observedElements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));
  const offsets: number[] = [];
  let targetProgress = 0;
  let displayedProgress = 0;
  let debugProgress: number | null = null;
  let animationFrame = 0;
  let previousTime = performance.now();

  function refresh() {
    offsets.splice(
      0,
      offsets.length,
      ...sections.map((section) => section.offsetTop),
    );
    syncMenuAccessibility(
      document.querySelector<HTMLButtonElement>(".js-nav-toggle")?.getAttribute("aria-expanded") === "true",
    );
    updateTarget();
  }

  function updateActiveState(progress: number) {
    const activeIndex = Math.min(sections.length - 1, Math.max(0, Math.round(progress)));
    const activeName = sectionName(sections[activeIndex]);

    document.querySelectorAll<HTMLElement>(".js-nav-item[section-name]").forEach((item) => {
      const isActive = sectionName(item) === activeName;
      item.classList.toggle("isActive", isActive);
      item.querySelector("a, button")?.setAttribute("aria-current", isActive ? "page" : "false");
    });
    document.querySelector<HTMLElement>(".js-header")?.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  function animate(time: number) {
    const deltaSeconds = Math.min(0.1, (time - previousTime) / 1000);
    previousTime = time;
    displayedProgress = reducedMotion
      ? targetProgress
      : dampProgress(displayedProgress, targetProgress, deltaSeconds);
    onProgress(displayedProgress);
    updateActiveState(displayedProgress);

    if (Math.abs(displayedProgress - targetProgress) > 0.001) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      displayedProgress = targetProgress;
      onProgress(displayedProgress);
      animationFrame = 0;
    }
  }

  function updateTarget() {
    if (debugProgress !== null) {
      targetProgress = debugProgress;
      displayedProgress = debugProgress;
      onProgress(displayedProgress);
      updateActiveState(displayedProgress);
      return;
    }

    targetProgress = mapScrollOffsetToProgress(window.scrollY, offsets);
    if (reducedMotion) {
      displayedProgress = targetProgress;
      onProgress(displayedProgress);
      updateActiveState(displayedProgress);
      return;
    }
    if (!animationFrame) {
      previousTime = performance.now();
      animationFrame = requestAnimationFrame(animate);
    }
  }

  function closeMenu() {
    const toggle = document.querySelector<HTMLButtonElement>(".js-nav-toggle");
    const nav = document.querySelector<HTMLElement>(".js-nav");
    toggle?.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
    document.documentElement.classList.remove("is-nav-open");
    syncMenuAccessibility(false);
  }

  function syncMenuAccessibility(isOpen: boolean) {
    const nav = document.querySelector<HTMLElement>(".js-nav");
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    nav?.setAttribute("aria-hidden", String(isMobile && !isOpen));
    nav?.querySelectorAll<HTMLElement>("a, button").forEach((control) => {
      if (isMobile && !isOpen) {
        control.setAttribute("tabindex", "-1");
      } else {
        control.removeAttribute("tabindex");
      }
    });
  }

  function onDocumentClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const toggle = target.closest<HTMLButtonElement>(".js-nav-toggle");
    if (toggle) {
      const nav = document.querySelector<HTMLElement>(".js-nav");
      const isOpen = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(isOpen));
      nav?.classList.toggle("is-open", isOpen);
      document.documentElement.classList.toggle("is-nav-open", isOpen);
      syncMenuAccessibility(isOpen);
      return;
    }

    const anchor = target.closest<HTMLElement>(anchorSelector);
    const anchorName = anchor?.getAttribute("anchor-link");
    if (!anchor || !anchorName) {
      return;
    }
    const destination = anchors.find(
      (candidate) => candidate.getAttribute("anchor-target") === anchorName,
    );
    if (!destination) {
      return;
    }

    event.preventDefault();
    closeMenu();
    window.scrollTo({
      top: destination.offsetTop,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeMenu();
      document.querySelector<HTMLButtonElement>(".js-nav-toggle")?.focus();
    }
  }

  const resizeObserver = new ResizeObserver(refresh);
  sections.forEach((section) => resizeObserver.observe(section));

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.inView = "true";
          intersectionObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12%", threshold: 0.08 },
  );
  observedElements.forEach((element) => intersectionObserver.observe(element));

  window.addEventListener("scroll", updateTarget, { passive: true });
  window.addEventListener("resize", refresh, { passive: true });
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeyDown);
  refresh();

  return {
    refresh,
    setDebugProgress(progress) {
      debugProgress = progress === null
        ? null
        : Math.min(
            Math.max(Number.isFinite(progress) ? progress : 0, 0),
            Math.max(0, sections.length - 1),
          );
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      updateTarget();
    },
    destroy() {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", refresh);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
      closeMenu();
    },
  };
}
