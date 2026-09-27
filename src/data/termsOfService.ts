// Structured content for the Terms of Service screen — mirrors the shape of
// src/data/privacyPolicy.ts on purpose, so TermsScreen.tsx and
// PrivacyPolicyScreen.tsx can share the same layout logic. Editing the
// wording here never means touching the scrollspy/TOC code in the screen.

export interface TermsSubsection {
  title: string;
  body: string;
}

export interface TermsSection {
  /** Stable id — used as the scroll-to target and the React key, never shown. */
  id: string;
  /** Number shown in the timeline circle and the Contents list. */
  number: number;
  title: string;
  /** Ionicons glyph name shown in the small badge on each card. */
  icon: string;
  body: string;
  /** Optional sub-parts rendered as mini-cards inside the section. */
  subsections?: TermsSubsection[];
}

export const TERMS_LAST_UPDATED = `${new Date().toLocaleString('en-IN', { month: 'long' })} ${new Date().getFullYear()}`;

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'introduction',
    number: 1,
    title: 'Introduction',
    icon: 'document-text-outline',
    body: "These Terms of Service govern your use of the Fashionable Flair app and website — here's what you're agreeing to, what this app actually is, and who it's for.",
    subsections: [
      {
        title: 'Acceptance of These Terms',
        body: "By using this app or website, you agree to these Terms of Service. If you don't agree with any part of them, please don't continue using the app — the good news is browsing and buying here don't require agreeing to anything beyond this, since there's no account or sign-up involved for shoppers.",
      },
      {
        title: 'What This App Is',
        body: "Fashionable Flair is a product catalog and showcase. We are not the seller of record for any product shown here — every purchase is placed, fulfilled, and shipped by our storefront on Meesho, under Meesho's own terms of service. This app's role begins and ends at helping you browse and decide what to buy.",
      },
      {
        title: 'Eligibility',
        body: "This app doesn't collect age information and doesn't require an account, so there's no formal age-gate here — but purchasing anything happens on Meesho, and you'll need to meet Meesho's own eligibility requirements to complete a purchase there.",
      },
    ],
  },
  {
    id: 'using-services',
    number: 2,
    title: 'Using Our Services',
    icon: 'options-outline',
    body: "What you're expected to use this app for, and what you can expect from the listings you see in it.",
    subsections: [
      {
        title: 'Acceptable Use',
        body: "You agree to use this app only for its intended purpose — browsing products and reaching Meesho to buy them. Attempting to interfere with the app's operation, scrape or republish its content at scale, or misuse the chat assistant or contact form (for example, to send spam or abusive content) isn't permitted.",
      },
      {
        title: 'Product Listings, Pricing & Availability',
        body: "Prices, stock status, and product details shown in this app are kept as up to date as we reasonably can, but the final price and availability at checkout are whatever's current on Meesho at the time of purchase. An item shown as available here could sell out on Meesho before you complete checkout, and vice versa.",
      },
    ],
  },
  {
    id: 'meesho-orders',
    number: 3,
    title: 'Orders Happen on Meesho, Not Here',
    icon: 'cart-outline',
    body: "Because every order is completed on Meesho, all matters related to payment, delivery, order tracking, and returns are governed by Meesho's terms and policies — not ours. We have no ability to process, modify, or refund an order from within this app.",
  },
  {
    id: 'chat-assistant',
    number: 4,
    title: 'The AI Chat Assistant',
    icon: 'chatbubble-ellipses-outline',
    body: 'The "Flair Assistant" chat feature is powered by Google\'s Gemini API and generates its responses automatically — it is not reviewed by a person before you see it. It\'s designed to only answer questions about this app and store, using facts we\'ve provided it, but like any AI system it can occasionally be wrong or incomplete. It should not be treated as a substitute for our Privacy Policy, these Terms, or an official answer from Meesho about a specific order — when in doubt, use the Contact page or check directly with Meesho.',
  },
  {
    id: 'ip',
    number: 5,
    title: 'Intellectual Property',
    icon: 'ribbon-outline',
    body: "Product photos, descriptions, branding, and the app/website's design belong to Fashionable Flair or its respective owners (including product images and descriptions sourced from our Meesho listings) and shouldn't be reused, copied, or redistributed without permission.",
  },
  {
    id: 'third-party',
    number: 6,
    title: 'Third-Party Links & Services',
    icon: 'link-outline',
    body: "This app links out to and relies on third-party services — most centrally Meesho for every purchase, plus Google Gemini (chat), Brevo (contact form email), Supabase (catalog data), and WhatsApp/Instagram (via the quick-contact icons available throughout the app). Each operates under its own terms, and we aren't responsible for their availability, content, or conduct once you're using them directly.",
  },
  {
    id: 'liability',
    number: 7,
    title: 'Disclaimers & Limitation of Liability',
    icon: 'alert-circle-outline',
    body: "The honest, plain-language version of the legal boilerplate: we do our best, but we can't promise perfection, and our responsibility has real limits.",
    subsections: [
      {
        title: 'Disclaimers',
        body: 'This app is provided "as is." We do our best to keep listings accurate and the app running smoothly, but we don\'t guarantee that product information is always current, that the app will be uninterrupted or error-free, or that the chat assistant\'s answers are always complete or correct.',
      },
      {
        title: 'Limitation of Liability',
        body: "We're not responsible for issues arising from order fulfillment, shipping, payment processing, or returns — those happen entirely on Meesho's platform, under Meesho's terms. To the fullest extent permitted by law, Fashionable Flair isn't liable for any indirect, incidental, or consequential damages arising from your use of this app.",
      },
    ],
  },
  {
    id: 'termination',
    number: 8,
    title: 'Termination',
    icon: 'close-circle-outline',
    body: 'We reserve the right to restrict or discontinue access to this app for anyone who violates these terms — for example, misusing the contact form or chat assistant as described in Section 2.',
  },
  {
    id: 'law',
    number: 9,
    title: 'Governing Law & Severability',
    icon: 'hammer-outline',
    body: 'Which laws apply, and what happens if one part of these Terms ever turns out not to hold up.',
    subsections: [
      {
        title: 'Governing Law',
        body: 'These terms are governed by the laws of India. Any disputes relating to this app (as distinct from a Meesho order, which falls under Meesho\'s own terms) will be subject to the jurisdiction of the courts in New Delhi.',
      },
      {
        title: 'Severability',
        body: "If any part of these terms is found unenforceable, the rest continues to apply in full — one invalid clause doesn't void the whole agreement.",
      },
    ],
  },
  {
    id: 'changes',
    number: 10,
    title: 'Changes to These Terms',
    icon: 'refresh-outline',
    body: 'These terms may be updated from time to time — for instance, if we add a new feature that changes how the app works. Continuing to use the app after a change means you accept the current version; the "Last updated" date above always reflects the latest revision.',
  },
  {
    id: 'contact',
    number: 11,
    title: 'Contact Us',
    icon: 'mail-outline',
    body: 'Questions about these terms are welcome any time through the Contact Us page — see there for phone, email, and address details.',
  },
];
