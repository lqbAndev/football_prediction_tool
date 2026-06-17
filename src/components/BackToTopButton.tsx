import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-4 right-4 sm:bottom-7 sm:right-7 z-[70] inline-flex items-center justify-center rounded-full border border-host-canada/35 bg-host-canada/22 p-2.5 sm:px-4 sm:py-2 text-xs font-semibold uppercase tracking-[0.15em] text-host-ice shadow-brand transition hover:-translate-y-0.5 hover:bg-host-canada/30"
      aria-label="Back to top"
    >
      <ChevronUp className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Top</span>
    </button>
  );
};
