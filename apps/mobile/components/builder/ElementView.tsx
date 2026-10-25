import { memo, useCallback, useRef } from 'react';
import { Image, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { CanvasElement, CanvasElementStyle, EditorElementActions } from '@uiguru/core';

type Props = {
  element: CanvasElement;
  scale: number;
  actions: EditorElementActions;
};

/**
 * Native rendering of one canvas element plus its touch gestures.
 * Gestures map to shared engine intents: tap = select, pan = move,
 * long-press = context menu. Frame math lives in @uiguru/core.
 *
 * Receives the engine's stable `elementActions` bundle (not the full editor
 * object) so `memo` holds: only the element being dragged re-renders.
 */
function ElementView({ element, scale, actions }: Props) {
  const startFrameRef = useRef(element.frame);

  const handleSelect = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    actions.setSelectedId(element.id);
  }, [actions, element.id]);

  const handleMoveStart = useCallback(() => {
    const frame = element.frame;
    startFrameRef.current = frame;
    actions.startMove(element.id, { x: frame.x, y: frame.y });
  }, [actions, element.frame, element.id]);

  const handleMoveChange = useCallback(
    (translationX: number, translationY: number) => {
      const frame = startFrameRef.current;
      actions.updateInteraction({
        x: frame.x + translationX / scale,
        y: frame.y + translationY / scale,
      });
    },
    [actions, scale],
  );

  const handleGestureEnd = useCallback(() => {
    actions.endInteraction();
  }, [actions]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const frame = element.frame;
    actions.openContextMenu(element.id, {
      x: Math.max(0, Math.min(frame.x, 980)),
      y: Math.max(0, frame.y + frame.height + 6),
    });
  }, [actions, element.frame, element.id]);

  const move = Gesture.Pan()
    .enabled(!element.locked)
    .activeOffsetX([-6, 6])
    .activeOffsetY([-6, 6])
    .onStart(() => runOnJS(handleMoveStart)())
    .onChange((event) => runOnJS(handleMoveChange)(event.translationX, event.translationY))
    .onFinalize(() => runOnJS(handleGestureEnd)());

  const tap = Gesture.Tap().maxDuration(250).onEnd(() => runOnJS(handleSelect)());

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => runOnJS(handleLongPress)());

  const gesture = Gesture.Race(move, longPress, tap);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.frame, frameStyle(element.frame, element.style)]}
        pointerEvents={element.locked ? 'none' : 'auto'}
      >
        <ElementPreview element={element} />
        {element.locked ? (
          <View style={styles.lockBadge}>
            <Text style={styles.lockLabel}>🔒</Text>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

export default memo(ElementView);

const shadowFontMap: Record<string, string> = {
  Inter: 'System',
  Georgia: 'Georgia',
  Arial: 'Arial',
  'Courier New': 'Courier',
  'Trebuchet MS': 'TrebuchetMS',
};

function frameStyle(frame: CanvasElement['frame'], style: CanvasElementStyle) {
  const shadow = Math.max(0, style.shadow);
  return {
    position: 'absolute' as const,
    left: frame.x,
    top: frame.y,
    width: frame.width,
    minHeight: frame.height,
    backgroundColor: style.background,
    borderColor: style.borderColor === 'transparent' ? 'transparent' : style.borderColor,
    borderWidth: style.borderColor === 'transparent' ? 0 : 1,
    borderRadius: style.radius,
    padding: style.padding,
    opacity: style.opacity / 100,
    shadowColor: '#0f172a',
    shadowOpacity: shadow > 0 ? 0.12 : 0,
    shadowRadius: shadow,
    shadowOffset: { width: 0, height: shadow / 2 },
    elevation: shadow > 0 ? 3 : 0,
    fontFamily: shadowFontMap[style.fontFamily] ?? 'System',
    fontSize: style.fontSize,
    fontWeight: String(style.fontWeight) as TextStyle['fontWeight'],
    color: style.color,
    textAlign: style.textAlign,
  };
}

function ElementPreview({ element }: { element: CanvasElement }) {
  const { content: c, style } = element;
  const secondarySize = Math.max(12, Math.round(style.fontSize * 0.55));

  if (element.kind === 'heading') return <Text numberOfLines={2}>{c.title}</Text>;
  if (element.kind === 'text') return <Text>{c.body}</Text>;
  if (element.kind === 'image') {
    return (
      <Image
        accessibilityLabel={c.altText}
        resizeMode="cover"
        source={{ uri: c.imageUrl }}
        style={styles.image}
      />
    );
  }
  if (element.kind === 'button') {
    return (
      <View style={styles.buttonRow}>
        <Text style={styles.buttonLabel} numberOfLines={1}>
          {c.actionLabel}
        </Text>
      </View>
    );
  }
  if (element.kind === 'input' || element.kind === 'textarea') {
    return (
      <View style={styles.fieldBox}>
        <Text numberOfLines={2} style={styles.fieldPlaceholder}>
          {c.body}
        </Text>
      </View>
    );
  }
  if (element.kind === 'badge-list') {
    return (
      <View style={styles.chipRow}>
        {c.items.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipLabel}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (element.kind === 'section') {
    return (
      <View style={styles.stack}>
        <Text numberOfLines={2} style={styles.sectionTitle}>
          {c.title}
        </Text>
        <Text numberOfLines={3} style={{ fontSize: secondarySize, lineHeight: secondarySize * 1.45 }}>
          {c.body}
        </Text>
      </View>
    );
  }
  // card
  return (
    <View style={styles.stack}>
      <Image
        accessibilityLabel={c.altText}
        resizeMode="cover"
        source={{ uri: c.imageUrl }}
        style={styles.cardImage}
      />
      <Text style={{ fontSize: secondarySize * 0.85, color: '#94a3b8', fontWeight: '600' }}>
        {c.subtitle}
      </Text>
      <Text numberOfLines={2}>{c.title}</Text>
      <Text numberOfLines={3} style={{ fontSize: secondarySize, lineHeight: secondarySize * 1.45 }}>
        {c.body}
      </Text>
      <View style={styles.chipRow}>
        {c.items.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipLabel}>{item}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.buttonRow, styles.alignSelfStart]}>
        <Text style={styles.buttonLabel} numberOfLines={1}>
          {c.actionLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  lockLabel: { fontSize: 10 },
  image: { flex: 1, minHeight: 40, borderRadius: 4 },
  cardImage: { height: 90, borderRadius: 6, marginBottom: 4 },
  buttonRow: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  alignSelfStart: { alignSelf: 'flex-start' },
  buttonLabel: { fontWeight: '800' },
  fieldBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fieldPlaceholder: { color: '#94a3b8' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipLabel: { color: '#1d4ed8', fontSize: 11, fontWeight: '700' },
  stack: { gap: 6 },
  sectionTitle: { fontWeight: '800' },
});
