import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Keeps the actual <html>/<body> background color in sync with the app's
 * current theme, web only.
 *
 * The bug this fixes: our app content sits inside a root View that's
 * exactly as tall as the viewport, but the underlying HTML page behind it
 * is untouched — by default that's plain white. Scrolling fast enough to
 * trigger the browser's own rubber-band/overscroll bounce (common on
 * mobile browsers, and on any page short enough to bottom out) briefly
 * reveals a sliver of whatever's *behind* our app content, i.e. that
 * default white page background — which reads as a jarring white flash
 * or a blank white block at the bottom on a dark-themed screen. Setting
 * the page's own background to match the current theme means an
 * overscroll bounce reveals more of the same themed color instead of a
 * mismatched white gap.
 */
export function useWebThemeBackground(backgroundColor: string) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const html = document.documentElement;
    const { body } = document;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;

    html.style.backgroundColor = backgroundColor;
    body.style.backgroundColor = backgroundColor;

    return () => {
      html.style.backgroundColor = prevHtmlBg;
      body.style.backgroundColor = prevBodyBg;
    };
  }, [backgroundColor]);
}
