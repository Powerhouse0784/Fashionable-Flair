import { useEffect } from 'react';
import { Platform } from 'react-native';

const STYLE_TAG_ID = 'ff-web-scrollbar-style';

/**
 * Hides the browser's scrollbar entirely on web — scrolling (wheel,
 * trackpad, touch, keyboard) still works exactly as before, there's just
 * nothing painted over the content. A visible scrollbar was covering the
 * edge of the rightmost product image on wide screens, which is the
 * problem this solves; useViewportWidth (a separate hook) is what keeps
 * the grid's own width math correct regardless of whether the scrollbar
 * takes up layout space or not.
 */
export function useWebScrollbarStyle() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_TAG_ID;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      *::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
    `;
  }, []);
}
