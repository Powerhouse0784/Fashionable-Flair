// Structured content for the Privacy Policy screen. Pulling this out of the
// screen file keeps PrivacyPolicyScreen.tsx focused on layout — editing the
// wording (or adding a section) never means touching the scrollspy/TOC code.

export interface PrivacySubsection {
  title: string;
  body: string;
}

export interface PrivacySection {
  /** Stable id — used as the scroll-to target and the React key, never shown. */
  id: string;
  /** Number shown in the timeline circle and the Contents list. */
  number: number;
  title: string;
  /** Ionicons glyph name shown in the small badge on each card. */
  icon: string;
  body: string;
  /** Optional sub-parts rendered as mini-cards inside the section (used for
   * the "Third-Party Services" section's four providers). */
  subsections?: PrivacySubsection[];
}

export const PRIVACY_LAST_UPDATED = `${new Date().toLocaleString('en-IN', { month: 'long' })} ${new Date().getFullYear()}`;

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: 'overview',
    number: 1,
    title: 'Overview',
    icon: 'shield-checkmark-outline',
    body: "This policy explains what information Fashionable Flair collects, what it doesn't, and how each part of the app and website handles it. We've written it to describe exactly what this specific app does — not a generic template — because most of what people assume an app collects (accounts, payment details, browsing trackers), this one simply doesn't.",
  },
  {
    id: 'collect',
    number: 2,
    title: "Information We Collect — and Don't",
    icon: 'person-outline',
    body: "Browsing this app doesn't require creating an account. Your Wishlist and Recently Viewed items are stored only on your own device (using standard on-device app storage), and are never transmitted to any server or shared with anyone — uninstalling the app removes them completely.\n\nWe don't collect your name, phone number, or payment details through this app, and we don't require an email address to browse or shop. The only place personal information is collected at all is if you choose to use the Contact form or the chat assistant (see Section 4 below), or if you're store staff signing in to manage the catalog (Section 5).",
  },
  {
    id: 'meesho',
    number: 3,
    title: 'Purchases Happen on Meesho, Not Here',
    icon: 'cart-outline',
    body: 'We don\'t process payments or collect payment details, and we don\'t see your order history. Tapping "Buy Now" takes you to our storefront on Meesho, where the purchase, your shipping details, and payment are handled entirely by Meesho under its own privacy policy. Anything you\'d consider a purchase record — what you bought, when, for how much, delivered where — lives with Meesho, not with us.',
  },
  {
    id: 'third-party',
    number: 4,
    title: 'Third-Party Services We Use',
    icon: 'link-outline',
    body: "A few features in this app work by sending your input to a specific third-party service to do their job. Here's exactly which ones, and what each one sees.",
    subsections: [
      {
        title: 'Contact Form — Brevo',
        body: 'If you submit the Contact Us form, your name, email address, and message are sent via Brevo (an email delivery service) to our support inbox, and Brevo sends you an automated confirmation. Brevo processes this only to deliver that email.',
      },
      {
        title: 'Chat Assistant — Google Gemini',
        body: 'If you use the "Flair Assistant" chat bubble, your message (and recent chat history in that conversation) is sent to Google\'s Gemini API to generate a response. We don\'t attach your name or any other identifying information to these messages beyond what you type. The assistant is scoped to only discuss this app and store, and doesn\'t have access to your Wishlist, location, or device information.',
      },
      {
        title: 'Store Catalog & Admin — Supabase',
        body: "Product data (what's shown in the app) and store-staff sign-ins are handled through Supabase, our backend provider. This has no connection to how shoppers browse — it only comes into play for the people managing the catalog.",
      },
      {
        title: 'Quick Contact — WhatsApp, Instagram & Phone',
        body: "The chat, WhatsApp, Instagram, and call icons available throughout the app are quick links to reach us on each of those channels — tapping one opens that service directly (e.g. a WhatsApp chat with our number, our Instagram profile, or your phone's dialer). We don't see or store anything from those conversations within this app; once you leave to WhatsApp or Instagram, your communication is governed by Meta's own privacy policy for that service, not this one.",
      },
    ],
  },
  {
    id: 'admin',
    number: 5,
    title: 'Store Admin Accounts',
    icon: 'key-outline',
    body: 'Sign-in exists only for store management (adding, editing, or removing products) and is limited to specifically approved store staff. Regular shoppers never create or need an account, and this sign-in system has no bearing on anyone just browsing or buying.',
  },
  {
    id: 'cookies',
    number: 6,
    title: 'Cookies & Local Storage',
    icon: 'save-outline',
    body: "On the web version, this app doesn't use tracking cookies. It does use your browser's local storage (the web equivalent of on-device app storage) to remember your Wishlist, Recently Viewed items, and appearance preference (light/dark mode) between visits — the same on-device-only approach as the mobile app, just using the browser's version of it.",
  },
  {
    id: 'retention',
    number: 7,
    title: 'Data Retention',
    icon: 'time-outline',
    body: "Your Wishlist and Recently Viewed items stay on your device for as long as you keep the app installed (or the site data in your browser). Contact form messages are kept only as long as needed to respond to your query. We don't retain chat assistant conversations after your session ends — each conversation exists only in the app's memory while you're using it.",
  },
  {
    id: 'children',
    number: 8,
    title: "Children's Privacy",
    icon: 'happy-outline',
    body: "This app is not directed at children, and we don't knowingly collect personal information from anyone under 18. Since browsing doesn't require any personal information in the first place, this is naturally the case for the vast majority of how the app is used.",
  },
  {
    id: 'choices',
    number: 9,
    title: 'Your Choices',
    icon: 'options-outline',
    body: "You can clear your Wishlist at any time from within the app. Uninstalling the app (or clearing your browser's site data, on web) removes all locally-stored information immediately and completely. Since we don't hold an account or profile for you, there's nothing further to request deletion of on our end beyond any contact-form message you may have sent us.",
  },
  {
    id: 'security',
    number: 10,
    title: 'Security',
    icon: 'lock-closed-outline',
    body: "Store-admin access is protected by authentication and is restricted to approved staff only. Because shopper browsing doesn't involve sending personal data to us, there's very little shopper-side data to secure in the first place — which is itself a deliberate privacy choice, not an oversight.",
  },
  {
    id: 'international',
    number: 11,
    title: 'International Data Transfers',
    icon: 'globe-outline',
    body: "The third-party services this app relies on (Supabase, Google Gemini, Brevo) may process data on servers located outside India. Each operates under its own privacy and security practices; we've chosen providers with established, standard safeguards for handling data of this kind.",
  },
  {
    id: 'changes',
    number: 12,
    title: 'Changes to This Policy',
    icon: 'refresh-outline',
    body: 'If how we handle information ever changes — for example, if we add a new feature that uses a new third-party service — this page will be updated to reflect it, and the "Last updated" date above will change accordingly.',
  },
  {
    id: 'contact',
    number: 13,
    title: 'Contact Us',
    icon: 'mail-outline',
    body: 'Questions about this policy, or about how any of the above works, are welcome any time through the Contact Us page — see there for phone, email, and address details.',
  },
];
