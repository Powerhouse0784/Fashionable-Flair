import React from 'react';
import InfoPageLayout from '@/components/InfoPageLayout';
import InfoSection from '@/components/InfoSection';

export default function TermsScreen() {
  return (
    <InfoPageLayout title="Terms of Service" subtitle={`Last updated ${new Date().getFullYear()}`} icon="document-text">
      <InfoSection heading="1. Acceptance of These Terms">
        By using this app or website, you agree to these Terms of Service. If you don't agree with any
        part of them, please don't continue using the app — the good news is browsing and buying here
        don't require agreeing to anything beyond this, since there's no account or sign-up involved for
        shoppers.
      </InfoSection>

      <InfoSection heading="2. What This App Is">
        Fashionable Flair is a product catalog and showcase. We are not the seller of record for any
        product shown here — every purchase is placed, fulfilled, and shipped by our storefront on
        Meesho, under Meesho's own terms of service. This app's role begins and ends at helping you browse
        and decide what to buy.
      </InfoSection>

      <InfoSection heading="3. Eligibility">
        This app doesn't collect age information and doesn't require an account, so there's no formal
        age-gate here — but purchasing anything happens on Meesho, and you'll need to meet Meesho's own
        eligibility requirements to complete a purchase there.
      </InfoSection>

      <InfoSection heading="4. Acceptable Use">
        You agree to use this app only for its intended purpose — browsing products and reaching Meesho to
        buy them. Attempting to interfere with the app's operation, scrape or republish its content at
        scale, or misuse the chat assistant or contact form (for example, to send spam or abusive content)
        isn't permitted.
      </InfoSection>

      <InfoSection heading="5. Product Listings, Pricing & Availability">
        Prices, stock status, and product details shown in this app are kept as up to date as we
        reasonably can, but the final price and availability at checkout are whatever's current on Meesho
        at the time of purchase. An item shown as available here could sell out on Meesho before you
        complete checkout, and vice versa.
      </InfoSection>

      <InfoSection heading="6. Orders, Payments & Returns">
        Because every order is completed on Meesho, all matters related to payment, delivery, order
        tracking, and returns are governed by Meesho's terms and policies — not ours. We have no ability
        to process, modify, or refund an order from within this app.
      </InfoSection>

      <InfoSection heading="7. The AI Chat Assistant">
        The "Flair Assistant" chat feature is powered by Google's Gemini API and generates its responses
        automatically — it is not reviewed by a person before you see it. It's designed to only answer
        questions about this app and store, using facts we've provided it, but like any AI system it can
        occasionally be wrong or incomplete. It should not be treated as a substitute for this Privacy
        Policy, these Terms, or an official answer from Meesho about a specific order — when in doubt,
        use the Contact page or check directly with Meesho.
      </InfoSection>

      <InfoSection heading="8. Intellectual Property">
        Product photos, descriptions, branding, and the app/website's design belong to Fashionable Flair
        or its respective owners (including product images and descriptions sourced from our Meesho
        listings) and shouldn't be reused, copied, or redistributed without permission.
      </InfoSection>

      <InfoSection heading="9. Third-Party Links & Services">
        This app links out to and relies on third-party services — most centrally Meesho for every
        purchase, plus Google Gemini (chat), Brevo (contact form email), and Supabase (catalog data). Each
        operates under its own terms, and we aren't responsible for their availability, content, or
        conduct once you're using them directly.
      </InfoSection>

      <InfoSection heading="10. Disclaimers">
        This app is provided "as is." We do our best to keep listings accurate and the app running
        smoothly, but we don't guarantee that product information is always current, that the app will be
        uninterrupted or error-free, or that the chat assistant's answers are always complete or correct.
      </InfoSection>

      <InfoSection heading="11. Limitation of Liability">
        We're not responsible for issues arising from order fulfillment, shipping, payment processing, or
        returns — those happen entirely on Meesho's platform, under Meesho's terms. To the fullest extent
        permitted by law, Fashionable Flair isn't liable for any indirect, incidental, or consequential
        damages arising from your use of this app.
      </InfoSection>

      <InfoSection heading="12. Termination">
        We reserve the right to restrict or discontinue access to this app for anyone who violates these
        terms — for example, misusing the contact form or chat assistant as described in Section 4.
      </InfoSection>

      <InfoSection heading="13. Governing Law">
        These terms are governed by the laws of India. Any disputes relating to this app (as distinct
        from a Meesho order, which falls under Meesho's own terms) will be subject to the jurisdiction of
        the courts in New Delhi.
      </InfoSection>

      <InfoSection heading="14. Severability">
        If any part of these terms is found unenforceable, the rest continues to apply in full — one
        invalid clause doesn't void the whole agreement.
      </InfoSection>

      <InfoSection heading="15. Changes to These Terms">
        These terms may be updated from time to time — for instance, if we add a new feature that changes
        how the app works. Continuing to use the app after a change means you accept the current version;
        the "Last updated" date above always reflects the latest revision.
      </InfoSection>

      <InfoSection heading="16. Contact Us">
        Questions about these terms are welcome any time through the Contact Us page — see there for
        phone, email, and address details.
      </InfoSection>
    </InfoPageLayout>
  );
}
