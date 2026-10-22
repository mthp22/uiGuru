import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  accentKinds,
  colorSwatches,
  contentByKind,
  fontFamilies,
  numericRanges,
  textAlignOptions,
  type CanvasElement,
  type CanvasProject,
  type EditorApi,
  type FontFamily,
  type TextAlign,
} from '@uiguru/core';
import Sheet from './Sheet';
import { ChipRow, ColorRow, StepperRow, TextRow } from './controls';

const tabs = ['Content', 'Type', 'Space', 'Position', 'Look'] as const;
type Tab = (typeof tabs)[number];

/**
 * Inspector sheet driven by the shared core field schema — the same
 * `contentByKind`/option lists the web Inspector renders, with native
 * controls (steppers, chips, swatches) instead of DOM inputs.
 */
export default function InspectorSheet({
  editor,
  visible,
  onClose,
}: {
  editor: EditorApi;
  visible: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('Content');
  const element = editor.selected;
  if (!element) return null;

  const update = (
    recipe: (current: CanvasElement) => CanvasElement,
    groupKey?: string,
  ) => editor.updateElementField(element.id, recipe, groupKey);

  const updateStyle = (key: keyof CanvasElement['style'], value: string | number) =>
    update((current) => ({ ...current, style: { ...current.style, [key]: value } }), `style.${key}`);

  const updateFrame = (key: keyof CanvasElement['frame'], value: number) =>
    update((current) => ({ ...current, frame: { ...current.frame, [key]: value } }), `frame.${key}`);

  return (
    <Sheet onClose={onClose} title={element.name} visible={visible}>
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable
            key={item}
            style={[styles.tab, tab === item && styles.tabActive]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabLabel, tab === item && styles.tabLabelActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroller}>
        {tab === 'Content' ? (
          <ContentFields element={element} update={update} />
        ) : null}

        {tab === 'Type' ? (
          element.kind === 'image' ? (
            <Text style={styles.note}>Images have no typography.</Text>
          ) : (
            <>
              <ChipRow
                label="Font"
                onChange={(value) => updateStyle('fontFamily', value)}
                options={fontFamilies}
                value={element.style.fontFamily}
              />
              <StepperRow
                label={`Size ${element.style.fontSize}px`}
                max={numericRanges.fontSize.max}
                min={numericRanges.fontSize.min}
                onChange={(value) => updateStyle('fontSize', value)}
                value={element.style.fontSize}
              />
              <StepperRow
                label={`Weight ${element.style.fontWeight}`}
                max={numericRanges.fontWeight.max}
                min={numericRanges.fontWeight.min}
                onChange={(value) => updateStyle('fontWeight', value)}
                step={numericRanges.fontWeight.step}
                value={element.style.fontWeight}
              />
              <ColorRow
                label="Text color"
                onChange={(value) => updateStyle('color', value)}
                swatches={colorSwatches}
                value={element.style.color}
              />
              <ChipRow
                label="Align"
                onChange={(value) => updateStyle('textAlign', value)}
                options={textAlignOptions.map((option) => option.value)}
                value={element.style.textAlign}
              />
            </>
          )
        ) : null}

        {tab === 'Space' ? (
          <StepperRow
            label={`Padding ${element.style.padding}px`}
            max={numericRanges.padding.max}
            min={numericRanges.padding.min}
            onChange={(value) => updateStyle('padding', value)}
            value={element.style.padding}
          />
        ) : null}

        {tab === 'Position' ? (
          <>
            <View style={styles.splitRow}>
              <View style={styles.splitCell}>
                <StepperRow
                  label="X"
                  max={4000}
                  min={0}
                  onChange={(value) => updateFrame('x', value)}
                  step={8}
                  value={element.frame.x}
                />
              </View>
              <View style={styles.splitCell}>
                <StepperRow
                  label="Y"
                  max={4000}
                  min={0}
                  onChange={(value) => updateFrame('y', value)}
                  step={8}
                  value={element.frame.y}
                />
              </View>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.splitCell}>
                <StepperRow
                  label="Width"
                  max={4000}
                  min={24}
                  onChange={(value) => updateFrame('width', value)}
                  step={8}
                  value={element.frame.width}
                />
              </View>
              <View style={styles.splitCell}>
                <StepperRow
                  label="Height"
                  max={4000}
                  min={24}
                  onChange={(value) => updateFrame('height', value)}
                  step={8}
                  value={element.frame.height}
                />
              </View>
            </View>
            <Pressable
              style={styles.action}
              onPress={() => editor.runCommand('reset-size', element.id)}
            >
              <Text style={styles.actionLabel}>Reset size</Text>
            </Pressable>
          </>
        ) : null}

        {tab === 'Look' ? (
          <>
            <ColorRow
              label="Fill"
              onChange={(value) => updateStyle('background', value)}
              swatches={colorSwatches}
              value={element.style.background}
            />
            <ColorRow
              label="Border"
              onChange={(value) => updateStyle('borderColor', value)}
              swatches={colorSwatches}
              value={element.style.borderColor}
            />
            {accentKinds.includes(element.kind) ? (
              <ColorRow
                label="Accent"
                onChange={(value) => updateStyle('accent', value)}
                swatches={colorSwatches}
                value={element.style.accent}
              />
            ) : null}
            <StepperRow
              label={`Radius ${element.style.radius}px`}
              max={numericRanges.radius.max}
              min={numericRanges.radius.min}
              onChange={(value) => updateStyle('radius', value)}
              value={element.style.radius}
            />
            <StepperRow
              label={`Shadow ${element.style.shadow}`}
              max={numericRanges.shadow.max}
              min={numericRanges.shadow.min}
              onChange={(value) => updateStyle('shadow', value)}
              value={element.style.shadow}
            />
            <StepperRow
              label={`Opacity ${element.style.opacity}%`}
              max={numericRanges.opacity.max}
              min={numericRanges.opacity.min}
              onChange={(value) => updateStyle('opacity', value)}
              value={element.style.opacity}
            />
            <View style={styles.commandRow}>
              <Pressable
                style={styles.action}
                onPress={() => editor.runCommand('toggle-lock', element.id)}
              >
                <Text style={styles.actionLabel}>{element.locked ? 'Unlock' : 'Lock'}</Text>
              </Pressable>
              <Pressable
                style={styles.action}
                onPress={() => editor.runCommand('duplicate', element.id)}
              >
                <Text style={styles.actionLabel}>Duplicate</Text>
              </Pressable>
              <Pressable
                style={styles.dangerAction}
                onPress={() => {
                  editor.runCommand('remove', element.id);
                  onClose();
                }}
              >
                <Text style={styles.dangerLabel}>Delete</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function ContentFields({
  element,
  update,
}: {
  element: CanvasElement;
  update: (recipe: (current: CanvasElement) => CanvasElement, groupKey?: string) => void;
}) {
  return (
    <>
      <TextRow
        label="Layer name"
        onChangeText={(next) => update((current) => ({ ...current, name: next }), 'name')}
        value={element.name}
      />
      {contentByKind[element.kind].map((field) => {
        const value = element.content[field.key];
        const text = Array.isArray(value) ? value.join('\n') : String(value ?? '');
        return (
          <TextRow
            key={field.key}
            label={field.label}
            multiline={field.multiline}
            onChangeText={(next) =>
              update(
                (current) => ({
                  ...current,
                  content: {
                    ...current.content,
                    [field.key]: Array.isArray(value)
                      ? next.split('\n').filter(Boolean)
                      : next,
                  },
                }),
                `content.${String(field.key)}`,
              )
            }
            value={text}
          />
        );
      })}
    </>
  );
}

/** Type-level helpers re-exported for tests/tools. */
export type InspectorUpdate = (
  recipe: (current: CanvasElement) => CanvasElement,
  groupKey?: string,
) => void;
export type InspectorProject = CanvasProject;
export type InspectorFont = FontFamily;
export type InspectorAlign = TextAlign;

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#2563eb' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tabLabelActive: { color: '#ffffff' },
  scroller: { maxHeight: 420 },
  note: { fontSize: 13, color: '#94a3b8', paddingVertical: 8 },
  splitRow: { flexDirection: 'row', gap: 12 },
  splitCell: { flex: 1 },
  action: {
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  commandRow: { flexDirection: 'row', gap: 8 },
  dangerAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    marginBottom: 12,
  },
  dangerLabel: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  pressed: { opacity: 0.7 },
});
