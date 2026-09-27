import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Width available for layout.
 *
 * On native this is identical to useWindowDimensions().width. On web it
 * isn't: `window.innerWidth` (what RN Web's useWindowDimensions reports)
 * measures the *whole* browser viewport, scrollbar included, while the
 * actual space content has to lay out in is narrower by the scrollbar's
 * width whenever a vertical scrollbar is showing (~15-17px on desktop
 * Chrome/Edge/Firefox). Sizing a full-bleed grid off the wrong number
 * means the last column is computed slightly too wide and gets clipped
 * behind the scrollbar — `document.documentElement.clientWidth` is the
 * one that already excludes it, so we use that on web instead.
 */
export function useViewportWidth(): number {
  const { width: rnWidth } = useWindowDimensions();
  const [webWidth, setWebWidth] = useState<number>(() =>
    Platform.OS === 'web' && typeof document !== 'undefined' ? document.documentElement.clientWidth : rnWidth
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const update = () => setWebWidth(document.documentElement.clientWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
    // Re-measure whenever RN's own resize tick fires too, in case content
    // height changes (and so scrollbar presence) without a window resize.
  }, [rnWidth]);

  return Platform.OS === 'web' ? webWidth : rnWidth;
}
