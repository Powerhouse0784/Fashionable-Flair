import { fonts } from '@/hooks/useAppFonts';

// Fraunces (serif) for anything a shopper reads as "branding" — page
// titles, product names, prices. Plus Jakarta Sans for everything
// functional — labels, buttons, captions. This pairing is what actually
// makes the app feel like a considered jewellery brand instead of a
// generic system-font utility screen.
export const typography = {
  h1: { fontSize: 30, fontFamily: fonts.headingBold, letterSpacing: 0.2 },
  h2: { fontSize: 24, fontFamily: fonts.headingBold, letterSpacing: 0.2 },
  h3: { fontSize: 19, fontFamily: fonts.heading },
  body: { fontSize: 15, fontFamily: fonts.body, lineHeight: 21 },
  bodySmall: { fontSize: 13, fontFamily: fonts.body, lineHeight: 18 },
  caption: { fontSize: 12, fontFamily: fonts.bodyMedium, letterSpacing: 0.3 },
  price: { fontSize: 18, fontFamily: fonts.headingMedium },
  button: { fontSize: 15, fontFamily: fonts.bodySemiBold, letterSpacing: 0.3 },
};
