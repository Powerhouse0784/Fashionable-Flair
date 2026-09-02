import React from 'react';
import InfoPageLayout from '@/components/InfoPageLayout';
import InfoSection from '@/components/InfoSection';

export default function PrivacyPolicyScreen() {
  return (
    <InfoPageLayout title="Privacy Policy" subtitle={`Last updated ${new Date().getFullYear()}`} icon="lock-closed">
      <InfoSection heading="1. Overview">
        This policy explains what information Fashionable Flair collects, what it doesn't, and how each
        part of the app and website handles it. We've written it to describe exactly what this specific
        app does — not a generic template — because most of what people assume an app collects (accounts,
        payment details, browsing trackers), this one simply doesn't.
      </InfoSection>

      <InfoSection heading="2. Information We Collect — and Don't">
        Browsing this app doesn't require creating an account. Your Wishlist and Recently Viewed items
        are stored only on your own device (using standard on-device app storage), and are never
        transmitted to any server or shared with anyone — uninstalling the app removes them completely.
        {'\n\n'}
        We don't collect your name, phone number, or payment details through this app, and we don't
        require an email address to browse or shop. The only place personal information is collected at
        all is if you choose to use the Contact form or the chat assistant (see Section 4 below), or if
        you're store staff signing in to manage the catalog (Section 5).
      </InfoSection>

      <InfoSection heading="3. Purchases Happen on Meesho, Not Here">
        We don't process payments or collect payment details, and we don't see your order history. Tapping
        "Buy Now" takes you to our storefront on Meesho, where the purchase, your shipping details, and
        payment are handled entirely by Meesho under its own privacy policy. Anything you'd consider a
        purchase record — what you bought, when, for how much, delivered where — lives with Meesho, not
        with us.
      </InfoSection>

      <InfoSection heading="4. Third-Party Services We Use">
        A few features in this app work by sending your input to a specific third-party service to do
        their job. Here's exactly which ones, and what each one sees.
      </InfoSection>

      <InfoSection heading="4a. Contact Form — Brevo">
        If you submit the Contact Us form, your name, email address, and message are sent via Brevo (an
        email delivery service) to our support inbox, and Brevo sends you an automated confirmation.
        Brevo processes this only to deliver that email.
      </InfoSection>

      <InfoSection heading="4b. Chat Assistant — Google Gemini">
        If you use the "Flair Assistant" chat bubble, your message (and recent chat history in that
        conversation) is sent to Google's Gemini API to generate a response. We don't attach your name or
        any other identifying information to these messages beyond what you type. The assistant is scoped
        to only discuss this app and store, and doesn't have access to your Wishlist, location, or device
        information.
      </InfoSection>

      <InfoSection heading="4c. Store Catalog & Admin — Supabase">
        Product data (what's shown in the app) and store-staff sign-ins are handled through Supabase, our
        backend provider. This has no connection to how shoppers browse — it only comes into play for the
        people managing the catalog.
      </InfoSection>

      <InfoSection heading="5. Store Admin Accounts">
        Sign-in exists only for store management (adding, editing, or removing products) and is limited
        to specifically approved store staff. Regular shoppers never create or need an account, and this
        sign-in system has no bearing on anyone just browsing or buying.
      </InfoSection>

      <InfoSection heading="6. Cookies & Local Storage">
        On the web version, this app doesn't use tracking cookies. It does use your browser's local
        storage (the web equivalent of on-device app storage) to remember your Wishlist, Recently Viewed
        items, and appearance preference (light/dark mode) between visits — the same on-device-only
        approach as the mobile app, just using the browser's version of it.
      </InfoSection>

      <InfoSection heading="7. Data Retention">
        Your Wishlist and Recently Viewed items stay on your device for as long as you keep the app
        installed (or the site data in your browser). Contact form messages are kept only as long as
        needed to respond to your query. We don't retain chat assistant conversations after your session
        ends — each conversation exists only in the app's memory while you're using it.
      </InfoSection>

      <InfoSection heading="8. Children's Privacy">
        This app is not directed at children, and we don't knowingly collect personal information from
        anyone under 18. Since browsing doesn't require any personal information in the first place, this
        is naturally the case for the vast majority of how the app is used.
      </InfoSection>

      <InfoSection heading="9. Your Choices">
        You can clear your Wishlist at any time from within the app. Uninstalling the app (or clearing
        your browser's site data, on web) removes all locally-stored information immediately and
        completely. Since we don't hold an account or profile for you, there's nothing further to request
        deletion of on our end beyond any contact-form message you may have sent us.
      </InfoSection>

      <InfoSection heading="10. Security">
        Store-admin access is protected by authentication and is restricted to approved staff only.
        Because shopper browsing doesn't involve sending personal data to us, there's very little
        shopper-side data to secure in the first place — which is itself a deliberate privacy choice, not
        an oversight.
      </InfoSection>

      <InfoSection heading="11. International Data Transfers">
        The third-party services this app relies on (Supabase, Google Gemini, Brevo) may process data on
        servers located outside India. Each operates under its own privacy and security practices; we've
        chosen providers with established, standard safeguards for handling data of this kind.
      </InfoSection>

      <InfoSection heading="12. Changes to This Policy">
        If how we handle information ever changes — for example, if we add a new feature that uses a new
        third-party service — this page will be updated to reflect it, and the "Last updated" date above
        will change accordingly.
      </InfoSection>

      <InfoSection heading="13. Contact Us">
        Questions about this policy, or about how any of the above works, are welcome any time through
        the Contact Us page — see there for phone, email, and address details.
      </InfoSection>
    </InfoPageLayout>
  );
}
