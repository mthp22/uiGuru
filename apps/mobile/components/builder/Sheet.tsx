import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';

/**
 * Bottom sheet built on RN Modal — no third-party dependency. Backdrop tap
 * dismisses; content scrolls inside.
 */
export default function Sheet({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close sheet" style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <View style={[styles.grabber, { backgroundColor: theme.textMuted, opacity: 0.5 }]} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeLabel, { color: theme.accent }]}>Done</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700' },
  closeButton: { paddingHorizontal: 8, paddingVertical: 4 },
  closeLabel: { fontSize: 15, fontWeight: '600' },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
});
