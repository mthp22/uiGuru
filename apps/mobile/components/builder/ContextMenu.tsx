import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EditorApi, EditorCommand } from '@uiguru/core';
import { useTheme } from '../../lib/theme';

const menuWidth = 180;
const canvasClamp = { max: { x: 1180, y: 760 } };

/**
 * Long-press context menu rendered in canvas coordinates, mirroring the
 * web Builder's right-click menu. Actions go through the shared engine.
 */
export default function ContextMenu({
  editor,
  canvasSize,
}: {
  editor: EditorApi;
  canvasSize: { width: number; height: number };
}) {
  const theme = useTheme();
  const menu = editor.contextMenu;
  if (!menu) return null;
  const element = editor.project.elements.find((item) => item.id === menu.elementId);
  if (!element) return null;

  const left = Math.max(0, Math.min(menu.x, Math.min(canvasSize.width, canvasClamp.max.x) - menuWidth));
  const top = Math.max(0, Math.min(menu.y, Math.min(canvasSize.height, canvasClamp.max.y) - 260));

  const run = (command: EditorCommand) => () => editor.runCommand(command, menu.elementId);

  return (
    <View
      style={[
        styles.menu,
        { backgroundColor: theme.surface, borderColor: theme.border },
        { left, top },
      ]}
    >
      <Item label="Duplicate" onPress={run('duplicate')} />
      <Item label="Reset size" onPress={run('reset-size')} />
      <Item label={element.locked ? 'Unlock' : 'Lock'} onPress={run('toggle-lock')} />
      <Item label="Bring forward" onPress={run('bring-forward')} />
      <Item label="Send backward" onPress={run('send-backward')} />
      <Item danger label="Remove" onPress={run('remove')} />
    </View>
  );
}

function Item({ label, danger, onPress }: { label: string; danger?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.item}
      onPress={onPress}
    >
      <Text
        style={[
          styles.itemLabel,
          { color: danger ? '#ef4444' : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Layout-only statics; colors come from `useTheme()` inline overrides.
const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    zIndex: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    width: menuWidth,
  },
  item: { paddingHorizontal: 14, paddingVertical: 9 },
  itemPressed: { backgroundColor: '#f1f5f9' },
  itemLabel: { fontSize: 13, fontWeight: '600' },
});
