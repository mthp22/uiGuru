import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { presetProjects } from '@uiguru/core';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.brand}>uiGuru</Text>
          <Text style={styles.tagline}>Build visually.{'\n'}Own the code.</Text>
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
          style={styles.secondaryButton}
          onPress={() => router.push('/projects')}
        >
          <Text style={styles.secondaryLabel}>My projects</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Start from a template</Text>
        {presetProjects.map((preset) => (
          <Pressable
            key={preset.id}
            accessibilityRole="button"
            style={styles.presetButton}
            onPress={() => router.push({ pathname: '/builder', params: { preset: preset.id } })}
          >
            <Text style={styles.presetLabel}>{preset.label}</Text>
            <Text style={styles.presetArrow}>›</Text>
          </Pressable>
        ))}

        <Text style={styles.footnote}>Native builder · shared uiGuru core</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, gap: 12 },
  hero: { marginBottom: 20 },
  brand: { fontSize: 36, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  tagline: { marginTop: 8, fontSize: 17, lineHeight: 24, color: '#64748b' },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryLabel: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryLabel: { color: '#334155', fontSize: 15, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  presetLabel: { fontSize: 15, fontWeight: '600', color: '#172033' },
  presetArrow: { fontSize: 20, color: '#94a3b8' },
  pressed: { opacity: 0.7 },
  footnote: { marginTop: 'auto', textAlign: 'center', color: '#94a3b8', fontSize: 12, paddingBottom: 12 },
});
