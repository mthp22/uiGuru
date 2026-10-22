import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { componentPalette, elementPalette, type EditorApi } from '@uiguru/core';
import * as Haptics from 'expo-haptics';
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

const componentIcons: Record<string, string> = {
  navbar: '☰',
  hero: '🚀',
  'feature-grid': '▦',
  'pricing-card': '💳',
  'login-form': '🔑',
  'contact-form': '✉',
  testimonial: '❝',
  footer: '▂',
};

/** Insert palette: individual blocks + prebuilt components, both from core. */
export default function PaletteSheet({
  editor,
  visible,
  onClose,
}: {
  editor: EditorApi;
  visible: boolean;
  onClose: () => void;
}) {
  const insertKind = (kind: (typeof elementPalette)[number]['kind']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    editor.insertKind(kind);
    onClose();
  };

  const insertComponent = (id: (typeof componentPalette)[number]['id']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    editor.insertComponent(id);
    onClose();
  };

  return (
    <Sheet onClose={onClose} title="Insert" visible={visible}>
      <ScrollView style={styles.scroller}>
        <Text style={styles.sectionLabel}>Blocks</Text>
        <View style={styles.grid}>
          {elementPalette.map((item) => (
            <Pressable
              key={item.kind}
              style={styles.card}
              onPress={() => insertKind(item.kind)}
            >
              <Text style={styles.icon}>{kindIcons[item.kind]}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text numberOfLines={2} style={styles.cardHint}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Components</Text>
        <View style={styles.grid}>
          {componentPalette.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => insertComponent(item.id)}
            >
              <Text style={styles.icon}>{componentIcons[item.id]}</Text>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text numberOfLines={2} style={styles.cardHint}>
                {item.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroller: { maxHeight: 460 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  icon: { fontSize: 18, marginBottom: 2 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#172033' },
  cardHint: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },
});
