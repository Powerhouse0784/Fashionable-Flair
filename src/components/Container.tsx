import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import { useContentMetrics } from '@/hooks/useResponsive';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

/**
 * The ONLY place horizontal page gutter/centering is applied. Screens and
 * their children should not add their own marginHorizontal/paddingHorizontal
 * for page edges — wrap content in this once and everything inside gets
 * consistent spacing automatically, on phone and on any browser width.
 */
export default function Container({ children, style }: Props) {
  const { sidePadding } = useContentMetrics();
  return <View style={[{ paddingHorizontal: sidePadding }, style]}>{children}</View>;
}
