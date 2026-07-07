import { useCallback, useEffect, useRef, useState } from "react";

type UseHeroSliderStateOptions = {
  slideCount: number;
  intervalMs: number;
};

export function useHeroSliderState({ slideCount, intervalMs }: UseHeroSliderStateOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (!slideCount) return;
      setActiveIndex(((index % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  useEffect(() => {
    if (isPaused || slideCount <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, isPaused, slideCount, activeIndex]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (touchStartX.current === null) return;

      const distance = touchStartX.current - event.changedTouches[0].clientX;
      if (Math.abs(distance) > 48) {
        if (distance > 0) goNext();
        else goPrev();
      }

      touchStartX.current = null;
    },
    [goNext, goPrev],
  );

  return {
    activeIndex,
    goTo,
    goNext,
    goPrev,
    isPaused,
    setIsPaused,
    touchHandlers: {
      onTouchStart,
      onTouchEnd,
    },
  };
}
