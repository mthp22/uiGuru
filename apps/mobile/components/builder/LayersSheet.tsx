import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildLayerTree, type EditorApi, type LayerNode } from '@uiguru/core';
import { useTheme } from '../../lib/theme';
import Sheet from './Sheet';

const kindIcons: Record<string, string> = {
  section: '▭',
  card: '🗂',
  heading: 'H',
  text: '¶',
  image: '🖼',
  button: '⏷',
  'badge-list': '🏷',
  input: '▭',
  textarea: '▤',
};

/**
 * Layers panel from the shared layer tree. Reordering uses the z-order
 * commands (bring forward / send backward) — the same engine commands the
 * web context menu uses.
 */
export default function LayersSheet({
  editor,
  visible,
  onClose,
}: {
  editor: EditorApi;
  visible: boolean;
  onClose: () => void;
}) {
  const rows = useMemo(() => flatten(buildLayerTree(editor.project.elements), 0), [editor.project.elements]);
  const selected = editor.selected;
  const theme = useTheme();

  return (
    <Sheet onClose={onClose} title="Layers" visible={visible}>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          No layers yet — insert a block to get started.
        </Text>
      ) : (
        <ScrollView style={styles.scroller}>
          {rows.map(({ node, depth }) => {
            const active = editor.selectedId === node.element.id;
            return (
              <Pressable
                key={node.element.id}
                style={[styles.row, active && { backgroundColor: theme.accentSoft }]}
                onPress={() => editor.setSelectedId(node.element.id)}
              >
                <View style={{ paddingLeft: depth * 18 }}>
                  <Text style={styles.icon}>{kindIcons[node.element.kind]}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.name,
                    { color: active ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {node.element.name}
                </Text>
                {node.element.locked ? <Text style={styles.locked}>🔒</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable
          disabled={!selected}
          style={[styles.action, { backgroundColor: theme.surfaceAlt }, !selected && styles.actionDisabled]}
          onPress={() => selected && editor.runCommand('send-backward', selected.id)}
        >
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Send backward</Text>
        </Pressable>
        <Pressable
          disabled={!selected}
          style={[styles.action, { backgroundColor: theme.surfaceAlt }, !selected && styles.actionDisabled]}
          onPress={() => selected && editor.runCommand('bring-forward', selected.id)}
        >
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Bring forward</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

function flatten(nodes: LayerNode[], depth: number): { node: LayerNode; depth: number }[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children, depth + 1)]);
}

// Layout-only statics; colors come from `useTheme()` inline overrides.
const styles = StyleSheet.create({
  scroller: { maxHeight: 380 },
  empty: { fontSize: 13, paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  icon: { fontSize: 14, width: 22 },
  name: { flex: 1, fontSize: 14, fontWeight: '600' },
  locked: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  actionLabel: { fontSize: 13, fontWeight: '600' },
});
