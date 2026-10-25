import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { presetProjects } from '@uiguru/core';
import { useTheme } from '../../lib/theme';

export default function HomeScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={[styles.brand, { color: theme.text }]}>uiGuru</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Build visuals.{'\n'}Own the code.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => router.push('/builder')}
        >
          <Text style={styles.primaryLabel}>New canvas</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[styles.secondaryButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => router.push('/projects')}
        >
          <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>My projects</Text>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Start from a template</Text>
        {presetProjects.map((preset) => (
          <Pressable
            key={preset.id}
            accessibilityRole="button"
            style={[styles.presetButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push({ pathname: '/builder', params: { preset: preset.id } })}
          >
            <Text style={[styles.presetLabel, { color: theme.text }]}>{preset.label}</Text>
            <Text style={[styles.presetArrow, { color: theme.textMuted }]}>›</Text>
          </Pressable>
        ))}

        <Text style={[styles.footnote, { color: theme.textMuted }]}>
          Native builder · shared uiGuru core
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Layout-only statics; colors come from `useTheme()` inline overrides.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, gap: 12 },
  hero: { marginBottom: 20 },
  brand: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { marginTop: 8, fontSize: 17, lineHeight: 24 },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryLabel: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryLabel: { fontSize: 15, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  presetLabel: { fontSize: 15, fontWeight: '600' },
  presetArrow: { fontSize: 20 },
  pressed: { opacity: 0.7 },
  footnote: { marginTop: 'auto', textAlign: 'center', fontSize: 12, paddingBottom: 12 },
});
