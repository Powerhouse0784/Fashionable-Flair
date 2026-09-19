import { useEffect } from 'react';
import { Platform } from 'react-native';

interface MetaOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

const SITE_NAME = 'Fashionable Flair';

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Sets the browser tab title and Open Graph / Twitter Card meta tags for
 * the current screen, web only. Worth being upfront about the real limit
 * here: this app is client-rendered (no server-side rendering), so a
 * crawler that doesn't execute JavaScript — some older link-preview bots —
 * won't see these tags, only whatever was in the initial static HTML.
 * Modern ones (Google's own crawler, and increasingly WhatsApp/Facebook's)
 * do run the page's JS first, so this still meaningfully improves search
 * snippets and link-preview cards in practice, just not with 100%
 * guaranteed coverage the way a server-rendered site would have.
 */
export function useDocumentMeta({ title, description, image, url }: MetaOptions) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    const previousTitle = document.title;
    document.title = fullTitle;

    if (description) {
      setMetaTag('name', 'description', description);
      setMetaTag('property', 'og:description', description);
      setMetaTag('name', 'twitter:description', description);
    }
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:type', image ? 'product' : 'website');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    if (image) {
      setMetaTag('property', 'og:image', image);
      setMetaTag('name', 'twitter:image', image);
    }
    if (url) {
      setMetaTag('property', 'og:url', url);
    }

    return () => {
      // Restore the previous title on unmount so navigating away (e.g.
      // back to Home) doesn't leave a stale product title in the tab.
      document.title = previousTitle;
    };
  }, [title, description, image, url]);
}
