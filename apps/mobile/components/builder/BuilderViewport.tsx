import { useCallback, useEffect, useRef, useState, type ElementRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { previewWidths, type EditorApi, type ResizeHandle } from '@uiguru/core';
import { useTheme } from '../../lib/theme';
import ContextMenu from './ContextMenu';
import ElementView from './ElementView';

type Props = {
  editor: EditorApi;
  marqueeMode: boolean;
};

/**
 * The native canvas: a scrollable, zoomable viewport around the shared
 * engine's project. Elements live in canvas coordinates; a single scale
 * transform maps them to screen space. Gestures convert screen deltas to
 * canvas deltas before calling engine intents.
 */
export default function BuilderViewport({ editor, marqueeMode }: Props) {
  const { project, zoom, setZoom, previewSize, guides, marquee } = editor;
  const [viewportWidth, setViewportWidth] = useState(0);
  const theme = useTheme();

  const viewportRef = useRef<ElementRef<typeof View>>(null);
  const viewportOriginRef = useRef({ x: 0, y: 0 });
  const scrollOffsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const zoomRef = useRef(1);
  const startZoomRef = useRef(1);

  const fitScale = viewportWidth > 0 ? viewportWidth / previewWidths[previewSize] : 0;
  const scale = fitScale * zoom;
  useEffect(() => {
    scaleRef.current = scale;
    zoomRef.current = zoom;
  });

  const measureViewport = useCallback(() => {
    viewportRef.current?.measureInWindow((x, y) => {
      viewportOriginRef.current = { x, y };
    });
  }, []);

  const handleViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setViewportWidth(event.nativeEvent.layout.width);
      measureViewport();
    },
    [measureViewport],
  );

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number; y: number } } }) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset;
    },
    [],
  );

  const pointFromAbsolute = useCallback(
    (absoluteX: number, absoluteY: number) => ({
      x: (absoluteX - viewportOriginRef.current.x) / scaleRef.current + scrollOffsetRef.current.x,
      y: (absoluteY - viewportOriginRef.current.y) / scaleRef.current + scrollOffsetRef.current.y,
    }),
    [],
  );

  const handleBgTap = useCallback(() => {
    editor.setSelectedId(null);
    editor.closeContextMenu();
  }, [editor]);

  const handleMarqueeStart = useCallback(
    (absoluteX: number, absoluteY: number) => {
      editor.closeContextMenu();
      editor.startMarquee(pointFromAbsolute(absoluteX, absoluteY));
    },
    [editor, pointFromAbsolute],
  );

  const handleMarqueeMove = useCallback(
    (absoluteX: number, absoluteY: number) => {
      editor.updateInteraction(pointFromAbsolute(absoluteX, absoluteY));
    },
    [editor, pointFromAbsolute],
  );

  const handleMarqueeEnd = useCallback(() => {
    editor.endInteraction();
  }, [editor]);

  const bgPan = Gesture.Pan()
    .enabled(marqueeMode)
    .onStart((event) => runOnJS(handleMarqueeStart)(event.absoluteX, event.absoluteY))
    .onChange((event) => runOnJS(handleMarqueeMove)(event.absoluteX, event.absoluteY))
    .onFinalize(() => runOnJS(handleMarqueeEnd)());
  const bgTap = Gesture.Tap().maxDuration(250).onEnd(() => runOnJS(handleBgTap)());
  const bgGesture = Gesture.Race(bgPan, bgTap);

  // Pinch-to-zoom over the whole viewport. `setZoom` rounds to 0.1 steps and
  // clamps, so rapid gesture events collapse into a handful of state commits;
  // the start zoom is read from a ref mirror so the gesture config itself
  // stays stable across those re-renders.
  const handlePinchStart = useCallback(() => {
    startZoomRef.current = zoomRef.current;
  }, []);

  const handlePinchChange = useCallback(
    (pinchScale: number) => {
      setZoom(startZoomRef.current * pinchScale);
    },
    [setZoom],
  );

  const pinch = Gesture.Pinch()
    .onStart(() => runOnJS(handlePinchStart)())
    .onChange((event) => runOnJS(handlePinchChange)(event.scale));

  const canvasWidth = project.canvas.width;
  const canvasHeight = project.canvas.height;
  const selected = editor.selected;
  const sized = viewportWidth > 0;

  return (
    <View
      ref={viewportRef}
      collapsable={false}
      onLayout={handleViewportLayout}
      style={[styles.root, { backgroundColor: theme.canvasBg }]}
    >
      <GestureDetector gesture={pinch}>
      <ScrollView
        contentContainerStyle={sized ? { width: canvasWidth * scale, height: canvasHeight * scale } : styles.emptyContent}
        scrollEnabled={!marqueeMode}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      >
        {sized ? (
          <View style={{ width: canvasWidth * scale, height: canvasHeight * scale }}>
            <View
              style={[
                styles.canvas,
                {
                  width: canvasWidth,
                  height: canvasHeight,
                  backgroundColor: project.canvas.background,
                  transform: [
                    { translateX: (-canvasWidth * (1 - scale)) / 2 },
                    { translateY: (-canvasHeight * (1 - scale)) / 2 },
                    { scale },
                  ],
                },
              ]}
            >
              <GestureDetector gesture={bgGesture}>
                <View style={StyleSheet.absoluteFill} />
              </GestureDetector>

              {project.elements.length === 0 ? (
                <View pointerEvents="none" style={styles.empty}>
                  <View style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.emptyIconLabel, { color: theme.accent }]}>＋</Text>
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Start with a blank canvas</Text>
                  <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
                    Tap Insert to add blocks, or start a component from the palette.
                  </Text>
                </View>
              ) : null}

              {project.elements.map((element) => (
                <ElementView
                  actions={editor.elementActions}
                  element={element}
                  key={element.id}
                  scale={scale}
                />
              ))}

              {marquee ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.marquee,
                    { left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height },
                  ]}
                />
              ) : null}

              {selected && !selected.locked ? (
                <ResizeOverlay editor={editor} element={selected} scale={scale} />
              ) : null}

              {guides.x.map((x) => (
                <View key={`guide-x-${x}`} pointerEvents="none" style={[styles.guideV, { left: x }]} />
              ))}
              {guides.y.map((y) => (
                <View key={`guide-y-${y}`} pointerEvents="none" style={[styles.guideH, { top: y }]} />
              ))}

              <ContextMenu canvasSize={{ width: canvasWidth, height: canvasHeight }} editor={editor} />
            </View>
          </View>
        ) : null}
      </ScrollView>
      </GestureDetector>
    </View>
  );
}

const handlePositions = (
  width: number,
  height: number,
): { id: ResizeHandle; left: number; top: number }[] => [
  { id: 'nw', left: -11, top: -11 },
  { id: 'n', left: width / 2 - 11, top: -11 },
  { id: 'ne', left: width - 11, top: -11 },
  { id: 'e', left: width - 11, top: height / 2 - 11 },
  { id: 'se', left: width - 11, top: height - 11 },
  { id: 's', left: width / 2 - 11, top: height - 11 },
  { id: 'sw', left: -11, top: height - 11 },
  { id: 'w', left: -11, top: height / 2 - 11 },
];

function ResizeOverlay({
  editor,
  element,
  scale,
}: {
  editor: EditorApi;
  element: NonNullable<EditorApi['selected']>;
  scale: number;
}) {
  const startFrameRef = useRef(element.frame);

  const handleStart = useCallback(
    (handle: ResizeHandle) => () => {
      const frame = element.frame;
      startFrameRef.current = frame;
      editor.startResize(element.id, handle, { x: frame.x, y: frame.y });
    },
    [editor, element.frame, element.id],
  );

  const handleChange = useCallback(
    (translationX: number, translationY: number) => {
      const frame = startFrameRef.current;
      editor.updateInteraction({
        x: frame.x + translationX / scale,
        y: frame.y + translationY / scale,
      });
    },
    [editor, scale],
  );

  const handleEnd = useCallback(() => {
    editor.endInteraction();
  }, [editor]);

  const frame = element.frame;

  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.selection,
          { left: frame.x, top: frame.y, width: frame.width, height: frame.height },
        ]}
      />
      {handlePositions(frame.width, frame.height).map(({ id, left, top }) => (
        <ResizeHandleDot
          handle={id}
          key={id}
          left={frame.x + left}
          onChange={handleChange}
          onEnd={handleEnd}
          onStart={() => handleStart(id)}
          top={frame.y + top}
        />
      ))}
    </>
  );
}

function ResizeHandleDot({
  handle,
  left,
  top,
  onStart,
  onChange,
  onEnd,
}: {
  handle: string;
  left: number;
  top: number;
  onStart: () => void;
  onChange: (translationX: number, translationY: number) => void;
  onEnd: () => void;
}) {
  const gesture = Gesture.Pan()
    .onStart(() => runOnJS(onStart)())
    .onChange((event) => runOnJS(onChange)(event.translationX, event.translationY))
    .onFinalize(() => runOnJS(onEnd)());

  return (
    <GestureDetector gesture={gesture}>
      <View accessibilityLabel={`Resize ${handle}`} hitSlop={8} style={[styles.handle, { left, top }]}>
        <View style={styles.handleDot} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e8edf3' },
  emptyContent: { flexGrow: 1 },
  canvas: { overflow: 'hidden' },
  empty: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconLabel: { fontSize: 24, color: '#2563eb', fontWeight: '600' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  emptyBody: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  marquee: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  selection: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2563eb',
    zIndex: 20,
  },
  handle: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 21,
  },
  handleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563eb' },
  guideV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(244, 63, 94, 0.7)' },
  guideH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(244, 63, 94, 0.7)' },
});
