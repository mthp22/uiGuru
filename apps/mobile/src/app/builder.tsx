import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createPresetProject,
  presetProjects,
  useEditor,
} from '@uiguru/core';
import BuilderViewport from '../../components/builder/BuilderViewport';
import InspectorSheet from '../../components/builder/InspectorSheet';
import LayersSheet from '../../components/builder/LayersSheet';
import PaletteSheet from '../../components/builder/PaletteSheet';

const presetIds = presetProjects.map((preset) => preset.id);
type Sheet = 'palette' | 'layers' | 'inspect' | null;

export default function BuilderScreen() {
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const editor = useEditor({
    initialPreviewSize: 'mobile',
    initialProject: () =>
      preset && presetIds.includes(preset as (typeof presetIds)[number])
        ? createPresetProject(preset as (typeof presetIds)[number])
        : null,
  });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [marqueeMode, setMarqueeMode] = useState(false);

  const closeSheet = useCallback(() => setSheet(null), []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Back" style={styles.barButton} onPress={() => router.back()}>
          <Text style={styles.barButtonLabel}>‹</Text>
        </Pressable>
        <View style={styles.headingGroup}>
          <Text numberOfLines={1} style={styles.title}>
            {editor.project.name}
          </Text>
          <Text style={styles.subtitle}>
            {editor.project.elements.length === 0
              ? 'Empty playground'
              : `${editor.project.elements.length} blocks`}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Undo"
          disabled={!editor.canUndo}
          style={styles.barButton}
          onPress={editor.undo}
        >
          <Text style={[styles.barButtonLabel, !editor.canUndo && styles.disabled]}>↶</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Redo"
          disabled={!editor.canRedo}
          style={styles.barButton}
          onPress={editor.redo}
        >
          <Text style={[styles.barButtonLabel, !editor.canRedo && styles.disabled]}>↷</Text>
        </Pressable>
      </View>

      <View style={styles.viewport}>
        <BuilderViewport editor={editor} marqueeMode={marqueeMode} />
      </View>

      <View style={styles.bottomBar}>
        <BottomAction
          label={marqueeMode ? 'Selecting' : 'Marquee'}
          active={marqueeMode}
          onPress={() => setMarqueeMode((current) => !current)}
        />
        <BottomAction label="Insert" onPress={() => setSheet('palette')} />
        <BottomAction label="Layers" onPress={() => setSheet('layers')} />
        <BottomAction
          label="Inspect"
          disabled={!editor.selected}
          onPress={() => setSheet('inspect')}
        />
      </View>

      <PaletteSheet editor={editor} visible={sheet === 'palette'} onClose={closeSheet} />
      <LayersSheet editor={editor} visible={sheet === 'layers'} onClose={closeSheet} />
      <InspectorSheet editor={editor} visible={sheet === 'inspect'} onClose={closeSheet} />
    </SafeAreaView>
  );
}

function BottomAction({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
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
        active && styles.actionActive,
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.actionPressed,
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  barButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  barButtonLabel: { fontSize: 20, color: '#334155', fontWeight: '600' },
  disabled: { color: '#cbd5e1' },
  headingGroup: { flex: 1, paddingHorizontal: 4 },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  viewport: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  actionActive: { backgroundColor: '#2563eb' },
  actionDisabled: { opacity: 0.4 },
  actionPressed: { opacity: 0.7 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  actionLabelActive: { color: '#ffffff' },
});
