import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  colors?: [string, string, ...string[]];
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
}

export default function GradientCard({
  children,
  style,
  colors,
  borderColor,
  borderWidth = 1,
  radius = 20,
}: Props) {
  const { theme } = useTheme();

  const gradientColors: [string, string] = colors ?? [theme.surface, theme.card];

  return (
    <View style={[
      styles.wrapper,
      {
        borderRadius: radius,
        borderWidth,
        borderColor: borderColor ?? theme.border,
      },
      style,
    ]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius - 1 }]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
});
