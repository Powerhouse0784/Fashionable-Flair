import { useEffect } from 'react';
import { Platform } from 'react-native';

const STYLE_TAG_ID = 'ff-web-viewport-lock-style';

/**
 * Locks the actual browser document (<html>/<body>) so it can never scroll
 * or rubber-band/overscroll-bounce on its own — web only. This doesn't
 * touch any screen's own scroll position (that's each screen's internal
 * ScrollView, untouched here, which is exactly why going "back" still
 * lands you right where you left a screen).
 *
 * The bug this fixes: "open a product, scroll it down, press back, and
 * the bottom tab bar ends up floating with a gap of blank space under
 * it" — reported on the website, and the same thing on Profile's own
 * sub-pages (Testimonials, Contact, FAQ, Privacy, Terms...). Every one of
 * those is a screen pushed on top of the tab bar, scrolled, then popped
 * back off it.
 *
 * Our layout never needs the *document* itself to scroll — every screen
 * already scrolls its own content in its own internal ScrollView, inside
 * an app root View that's exactly one viewport tall (see
 * useWebThemeBackground's comment on that same root View). The tab bar
 * sits at the bottom of that root View via ordinary flex layout, not
 * pinned to the actual browser viewport — so if the *document* (not any
 * of our own ScrollViews) ends up scrolled by even a few px, the whole
 * app shell, tab bar included, visibly shifts up by that amount, with the
 * real page background showing through as a gap underneath.
 *
 * Browsers don't know our document never needs to move, though: by
 * default <body> is still a normal, scrollable, bounceable element. Flinging
 * a touch-scroll hard enough — easy to do by accident right as a "back"
 * tap fires mid-gesture — can leave the document scrolled, or mid-bounce,
 * by a few stray pixels that never spring back, because the page that was
 * listening for that settle just got unmounted. That stuck offset is the
 * "gap": the fixed-height app shell just shifted up on the page by that
 * many pixels.
 *
 * `overscroll-behavior: none` stops that in every modern browser;
 * `body { position: fixed }` is the older, universally-supported version
 * of the same thing — between the two, the document has nowhere left to
 * move, so there's nothing for a stray gesture or a screen transition to
 * get stuck in.
 */
export function useWebViewportLock() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_TAG_ID;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      html, body {
        height: 100%;
        overflow: hidden;
        overscroll-behavior: none;
      }
      body {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
      }
      #root {
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
    `;
  }, []);
}
