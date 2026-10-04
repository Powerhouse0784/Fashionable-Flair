import React from 'react';
import { View, Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

interface Props {
  /** Diameter of the glow, in px. */
  size: number;
  color: string;
  /** Opacity of the glow at its most intense (its center). */
  baseOpacity: number;
}

/**
 * A soft, centered radial glow sitting behind a piece of art (see
 * PrivacyPolicyScreen/TermsScreen hero sections).
 *
 * On web this is a single oversized circle with a real CSS blur, which
 * reads correctly as a soft halo. React Native has no CSS `filter` on
 * native platforms though, so without this component the same style just
 * rendered as one flat, hard-edged colored disc — which is the "yellow
 * circular background" artifact reported behind the hero image on the app.
 * Native instead layers a few progressively smaller, progressively more
 * opaque circles on top of each other to fake the same falloff a blur
 * would produce, without needing any native blur dependency.
 */
export default function SoftGlow({ size, color, baseOpacity }: Props) {
  if (isWeb) {
    return (
      <View
        pointerEvents="none"
        style={
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: baseOpacity,
            filter: 'blur(50px)',
          } as any
        }
      />
    );
  }

  const rings = [
    { scale: 1, opacityFactor: 0.3 },
    { scale: 0.72, opacityFactor: 0.5 },
    { scale: 0.46, opacityFactor: 0.75 },
    { scale: 0.24, opacityFactor: 1 },
  ];

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {rings.map((ring, i) => {
        const ringSize = size * ring.scale;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: color,
              opacity: baseOpacity * ring.opacityFactor,
            }}
          />
        );
      })}
    </View>
  );
}
