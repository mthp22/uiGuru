import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  exportFileName,
  exportProject,
  frameworks,
  type EditorApi,
  type Framework,
  type ReactFlavor,
} from '@uiguru/core';
import { useTheme } from '../../lib/theme';
import Sheet from './Sheet';
import { ChipRow } from './controls';

/**
 * Export sheet: generates code through the shared core exporters (same
 * output as the web Builder) and hands it to the OS share sheet or clipboard.
 */
export default function ExportSheet({
  editor,
  visible,
  onClose,
}: {
  editor: EditorApi;
  visible: boolean;
  onClose: () => void;
}) {
  const [framework, setFramework] = useState<Framework>(frameworks[0].id);
  const [flavor, setFlavor] = useState<ReactFlavor>('tsx');
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const code = useMemo(
    () => exportProject(editor.project, framework, flavor),
    [editor.project, framework, flavor],
  );
  const fileName = exportFileName(editor.project, framework, flavor);

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    try {
      await Share.share({ message: code, title: fileName });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  return (
    <Sheet onClose={onClose} title="Export code" visible={visible}>
      <ChipRow
        label="Framework"
        onChange={setFramework}
        options={frameworks.map((item) => item.id)}
        value={framework}
      />
      {framework === 'react' ? (
        <ChipRow
          label="Flavor"
          onChange={setFlavor}
          options={['tsx', 'jsx'] as const}
          value={flavor}
        />
      ) : null}

      <Text numberOfLines={1} style={[styles.fileName, { color: theme.textSecondary }]}>
        {fileName}
      </Text>
      <ScrollView style={styles.code} horizontal>
        <ScrollView style={styles.codeInner} nestedScrollEnabled>
          <Text selectable style={styles.codeText}>
            {code}
          </Text>
        </ScrollView>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => void copy()}
        >
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
            {copied ? 'Copied ✓' : 'Copy'}
          </Text>
        </Pressable>
        <Pressable style={styles.primaryAction} onPress={() => void share()}>
          <Text style={styles.primaryLabel}>Share…</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fileName: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  code: { maxHeight: 280, borderRadius: 12, backgroundColor: '#0f172a' },
  codeInner: { padding: 12, flexGrow: 1 },
  codeText: {
    fontFamily: 'Menlo',
    fontSize: 11,
    lineHeight: 16,
    color: '#e2e8f0',
  },
  actions: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  primaryAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  primaryLabel: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
