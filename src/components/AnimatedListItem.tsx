import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
  delay?: number;
}

export default function AnimatedListItem({ children, index = 0, style, delay = 0 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    const d = delay + index * 40;
    opacity.value = withDelay(d, withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(d, withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
}
