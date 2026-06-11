import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const SCREEN_W = Dimensions.get('window').width;
const DELETE_THRESHOLD = -SCREEN_W * 0.3;
const ACTION_WIDTH = 80;

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
}

export default function SwipeableCard({ children, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate(e => {
      if (e.translationX > 0) return;
      translateX.value = Math.max(e.translationX, -ACTION_WIDTH * 2 - 16);
      deleteOpacity.value = Math.min(Math.abs(e.translationX) / ACTION_WIDTH, 1);
    })
    .onEnd(e => {
      if (e.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_W, { duration: 220 }, () => {
          runOnJS(onDelete)();
        });
      } else if (e.translationX < -ACTION_WIDTH * 0.5) {
        translateX.value = withSpring(-ACTION_WIDTH * 2, { damping: 20 });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        deleteOpacity.value = withTiming(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.actions, actionsStyle]}>
        <View style={[styles.actionBtn, { backgroundColor: theme.border }]} >
          <Text style={styles.actionText} onPress={onEdit}>✏️</Text>
        </View>
        <View style={[styles.actionBtn, { backgroundColor: theme.danger + 'CC' }]}>
          <Text style={styles.actionText} onPress={onDelete}>🗑️</Text>
        </View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  actionBtn: {
    width: ACTION_WIDTH - 8,
    height: '80%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 20,
  },
});
