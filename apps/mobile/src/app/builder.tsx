import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createHttpUiguruApi,
  createPresetProject,
  createProjectStorage,
  presetProjects,
  useEditor,
  useProjectPersistence,
  useProjectSync,
  type ProjectPersistence,
} from '@uiguru/core';
import BuilderViewport from '../../components/builder/BuilderViewport';
import ExportSheet from '../../components/builder/ExportSheet';
import InspectorSheet from '../../components/builder/InspectorSheet';
import LayersSheet from '../../components/builder/LayersSheet';
import PaletteSheet from '../../components/builder/PaletteSheet';
import { useTheme } from '../../lib/theme';

const presetIds = presetProjects.map((preset) => preset.id);
type Sheet = 'palette' | 'layers' | 'inspect' | 'export' | null;

export default function BuilderScreen() {
  const { preset, projectId, sheet: initialSheet } = useLocalSearchParams<{
    preset?: string;
    projectId?: string;
    sheet?: string;
  }>();
  const editor = useEditor({
    initialPreviewSize: 'mobile',
    initialProject: () =>
      preset && presetIds.includes(preset as (typeof presetIds)[number])
        ? createPresetProject(preset as (typeof presetIds)[number])
        : null,
  });

  // Local-first persistence: restores the project (requested id, else the
  // last-opened one) and autosaves engine changes through the commit seam.
  // A route preset wins over restore — the template IS the canvas.
  const storage = useMemo(() => createProjectStorage(AsyncStorage), []);
  const persistence = useProjectPersistence(editor, storage, { projectId, restore: !preset });

  // Remote sync replica — active only when a backend URL is configured.
  const api = useMemo(() => {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL;
    return baseUrl ? createHttpUiguruApi({ baseUrl }) : null;
  }, []);
  useProjectSync(editor, api);

  const [sheet, setSheet] = useState<Sheet>(initialSheet === 'export' ? 'export' : null);
  const [marqueeMode, setMarqueeMode] = useState(false);
  const theme = useTheme();

  // Deep-linkable sheet: arriving at this route with `?sheet=export` (even as
  // an in-place param update on an already-open builder) opens the sheet.
  const paramSheet = initialSheet;
  useEffect(() => {
    if (paramSheet !== 'export') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route params are an external source; mirroring them into view state is the sanctioned sync
    setSheet('export');
  }, [paramSheet]);

  const closeSheet = useCallback(() => setSheet(null), []);

  const rename = () => {
    if (typeof Alert.prompt !== 'function') return;
    Alert.prompt(
      'Rename project',
      undefined,
      (name?: string) => {
        const trimmed = name?.trim();
        if (trimmed) editor.updateProject({ name: trimmed });
      },
      undefined,
      editor.project.name,
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Pressable accessibilityLabel="Back" style={styles.barButton} onPress={() => router.back()}>
          <Text style={[styles.barButtonLabel, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Pressable accessibilityLabel="Rename project" style={styles.headingGroup} onPress={rename}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {editor.project.name}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {editor.project.elements.length === 0
              ? 'Empty playground'
              : `${editor.project.elements.length} blocks`}
            {' · '}
            {saveLabel(persistence)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Undo"
          disabled={!editor.canUndo}
          style={styles.barButton}
          onPress={editor.undo}
        >
          <Text
            style={[styles.barButtonLabel, { color: theme.text }, !editor.canUndo && { color: theme.textMuted, opacity: 0.5 }]}
          >
            ↶
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Redo"
          disabled={!editor.canRedo}
          style={styles.barButton}
          onPress={editor.redo}
        >
          <Text
            style={[styles.barButtonLabel, { color: theme.text }, !editor.canRedo && { color: theme.textMuted, opacity: 0.5 }]}
          >
            ↷
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Export code"
          style={styles.exportButton}
          onPress={() => setSheet('export')}
        >
          <Text style={styles.exportLabel}>Export</Text>
        </Pressable>
      </View>

      <View style={styles.viewport}>
        <BuilderViewport editor={editor} marqueeMode={marqueeMode} />
        <View
          style={[
            styles.zoomPill,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ZoomButton
            accessibilityLabel="Zoom out"
            color={theme.text}
            label="−"
            onPress={() => editor.changeZoom(-0.1)}
          />
          <Pressable
            accessibilityLabel="Reset zoom to 100%"
            onPress={() => editor.setZoom(1)}
            style={styles.zoomValueButton}
          >
            <Text style={[styles.zoomValue, { color: theme.textSecondary }]}>
              {Math.round(editor.zoom * 100)}%
            </Text>
          </Pressable>
          <ZoomButton
            accessibilityLabel="Zoom in"
            color={theme.text}
            label="＋"
            onPress={() => editor.changeZoom(0.1)}
          />
        </View>
      </View>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <BottomAction
          label={marqueeMode ? 'Selecting' : 'Marquee'}
          active={marqueeMode}
          onPress={() => setMarqueeMode((current) => !current)}
          theme={theme}
        />
        <BottomAction label="Insert" onPress={() => setSheet('palette')} theme={theme} />
        <BottomAction label="Layers" onPress={() => setSheet('layers')} theme={theme} />
        <BottomAction
          label="Inspect"
          disabled={!editor.selected}
          onPress={() => setSheet('inspect')}
          theme={theme}
        />
      </View>

      <PaletteSheet editor={editor} visible={sheet === 'palette'} onClose={closeSheet} />
      <LayersSheet editor={editor} visible={sheet === 'layers'} onClose={closeSheet} />
      <InspectorSheet editor={editor} visible={sheet === 'inspect'} onClose={closeSheet} />
      <ExportSheet editor={editor} visible={sheet === 'export'} onClose={closeSheet} />
    </SafeAreaView>
  );
}

function saveLabel(persistence: ProjectPersistence): string {
  switch (persistence.status) {
    case 'loading':
      return 'Loading…';
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Not saved';
    default:
      return 'Local only';
  }
}

function BottomAction({
  label,
  active,
  disabled,
  theme,
  onPress,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
}) {
  // NativeWind's interop doesn't resolve function `style` props, so pressed
  // feedback uses explicit state instead of `style={({pressed}) => …}`.
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.action,
        { backgroundColor: theme.surfaceAlt },
        active && { backgroundColor: theme.accent },
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.actionPressed,
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Text
        style={[
          styles.actionLabel,
          { color: theme.textSecondary },
          active && { color: theme.accentText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ZoomButton({
  label,
  color,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  color: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[styles.zoomButton, pressed && styles.actionPressed]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Text style={[styles.zoomButtonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// Layout-only statics; colors come from `useTheme()` inline overrides.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  barButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  barButtonLabel: { fontSize: 20, fontWeight: '600' },
  exportButton: {
    paddingHorizontal: 10,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  exportLabel: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  headingGroup: { flex: 1, paddingHorizontal: 4 },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 1 },
  viewport: { flex: 1 },
  zoomPill: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  zoomButton: {
    width: 34,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  zoomButtonLabel: { fontSize: 15, fontWeight: '700' },
  zoomValueButton: { paddingHorizontal: 4 },
  zoomValue: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionDisabled: { opacity: 0.4 },
  actionPressed: { opacity: 0.7 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
});
