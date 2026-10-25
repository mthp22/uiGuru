import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createProjectStorage, type CanvasProject } from '@uiguru/core';
import { useTheme } from '../../lib/theme';

/**
 * Saved-projects browser backed by the shared local-first storage (AsyncStorage
 * on native, injected as the key/value implementation). Opening a project
 * deep-links into the builder with its id; edits flow back through the
 * engine's autosave seam.
 */
export default function ProjectsScreen() {
  const storage = useMemo(() => createProjectStorage(AsyncStorage), []);
  const [projects, setProjects] = useState<CanvasProject[] | null>(null);
  const theme = useTheme();

  const reload = useCallback(async () => {
    setProjects(await storage.list());
  }, [storage]);

  useEffect(() => {
    let cancelled = false;
    storage.list().then((items) => {
      if (!cancelled) setProjects(items);
    });
    return () => {
      cancelled = true;
    };
  }, [storage]);

  const open = (id: string) => router.push({ pathname: '/builder', params: { projectId: id } });

  const rename = (project: CanvasProject) => {
    if (typeof Alert.prompt !== 'function') return;
    Alert.prompt('Rename project', undefined, (name?: string) => {
      const trimmed = name?.trim();
      if (!trimmed) return;
      void storage.save({ ...project, name: trimmed, updatedAt: new Date().toISOString() }).then(reload);
    }, undefined, project.name);
  };

  const confirmDelete = (project: CanvasProject) => {
    Alert.alert('Delete project', `“${project.name}” will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void storage.remove(project.id).then(reload),
      },
    ]);
  };

  const menu = (project: CanvasProject) => {
    Alert.alert(project.name, undefined, [
      { text: 'Open', onPress: () => open(project.id) },
      { text: 'Rename', onPress: () => rename(project) },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(project) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Pressable accessibilityLabel="Back" style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backLabel, { color: theme.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>My projects</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {projects && projects.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            No saved projects yet — build something!
          </Text>
        ) : null}
        {projects === null ? <Text style={[styles.empty, { color: theme.textMuted }]}>Loading…</Text> : null}

        {(projects ?? []).map((project) => (
          <Pressable
            key={project.id}
            style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => open(project.id)}
            onLongPress={() => menu(project)}
          >
            <View style={styles.rowBody}>
              <Text numberOfLines={1} style={[styles.rowTitle, { color: theme.text }]}>
                {project.name}
              </Text>
              <Text style={[styles.rowMeta, { color: theme.textMuted }]}>
                {project.elements.length} blocks · {formatDate(project.updatedAt)}
              </Text>
            </View>
            <Text style={[styles.rowArrow, { color: theme.textMuted }]}>›</Text>
          </Pressable>
        ))}

        <Text style={[styles.hint, { color: theme.textMuted }]}>
          Tip: long-press a project to rename or delete it.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value?: string): string {
  if (!value) return 'just now';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Layout-only statics; colors come from `useTheme()` inline overrides.
const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  backLabel: { fontSize: 26, lineHeight: 28 },
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  content: { padding: 16, gap: 10 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowMeta: { fontSize: 12, marginTop: 2 },
  rowArrow: { fontSize: 22, marginLeft: 8 },
  hint: { fontSize: 11, textAlign: 'center', marginTop: 16 },
});
