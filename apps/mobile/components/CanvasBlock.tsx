import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { clamp } from '@uiguru/core';

export type Block = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  block: Block;
  selected: boolean;
  canvas: { width: number; height: number };
  onSelect: () => void;
  onCommit: (patch: Partial<Block>) => void;
  onContextMenu: (pos: { x: number; y: number }) => void;
};

const MIN_WIDTH = 96;
const MIN_HEIGHT = 72;


export default function CanvasBlock({ block, selected, canvas, onSelect, onCommit, onContextMenu }: Props) {
  const x = useSharedValue(block.x);
  const y = useSharedValue(block.y);
  const w = useSharedValue(block.width);
  const h = useSharedValue(block.height);

  useEffect(() => {
    x.value = block.x;
    y.value = block.y;
    w.value = block.width;
    h.value = block.height;
  }, [block.x, block.y, block.width, block.height, x, y, w, h]);

  const selectBlock = useCallback(() => onSelect(), [onSelect]);

  const commitPosition = useCallback(() => {
    onCommit({ x: x.value, y: y.value });
  }, [onCommit, x, y]);

  const commitSize = useCallback(() => {
    onCommit({ width: w.value, height: h.value });
  }, [onCommit, w, h]);

  const openMenu = useCallback(
    (pos: { x: number; y: number }) => onContextMenu(pos),
    [onContextMenu],
  );

  const move = Gesture.Pan()
    .onStart(() => {
      runOnJS(selectBlock)();
    })
    .onChange((event) => {
      x.value = clamp(x.value + event.changeX, 0, Math.max(0, canvas.width - w.value));
      y.value = clamp(y.value + event.changeY, 0, Math.max(0, canvas.height - h.value));
    })
    .onEnd(() => {
      runOnJS(commitPosition)();
    });

  const tap = Gesture.Tap().onStart(() => {
    runOnJS(selectBlock)();
  });

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      runOnJS(openMenu)({ x: x.value + 12, y: y.value + h.value + 8 });
    });

  const blockGesture = Gesture.Race(move, longPress, tap);

  const resize = Gesture.Pan()
    .onStart(() => {
      runOnJS(selectBlock)();
    })
    .onChange((event) => {
      w.value = clamp(w.value + event.changeX, MIN_WIDTH, Math.max(MIN_WIDTH, canvas.width - x.value));
      h.value = clamp(h.value + event.changeY, MIN_HEIGHT, Math.max(MIN_HEIGHT, canvas.height - y.value));
    })
    .onEnd(() => {
      runOnJS(commitSize)();
    });

  const blockStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    width: w.value,
    height: h.value,
  }));

  return (
    <GestureDetector gesture={blockGesture}>
      <Animated.View
        style={[styles.frame, blockStyle]}
        className={`rounded-2xl bg-white ${selected ? 'border-2 border-blue-600' : 'border border-slate-300'}`}
      >
        <View className="flex-1 items-center justify-center px-3">
          <Text className="text-base font-semibold text-slate-800" numberOfLines={1}>
            {block.label}
          </Text>
          <Text className="mt-1 text-xs text-slate-400">drag · long-press · resize</Text>
        </View>

        <GestureDetector gesture={resize}>
          <View className="absolute bottom-2 right-2 h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white shadow-md active:bg-slate-100">
            <View className="h-3 w-3 rounded-sm bg-blue-600" />
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
