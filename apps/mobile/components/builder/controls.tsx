import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../lib/theme';

/** Labeled row with a text input (used for names, content, hex colors). */
export function TextRow({
  label,
  value,
  multiline,
  onChangeText,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChangeText: (next: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
        ]}
        value={value}
      />
    </View>
  );
}

/** Numeric row with − / + steppers (touch-friendly replacement for sliders). */
export function StepperRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const theme = useTheme();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          disabled={value <= min}
          style={[styles.stepButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => onChange(clamp(value - step))}
        >
          <Text style={[styles.stepLabel, { color: theme.text }]}>−</Text>
        </Pressable>
        <Text style={[styles.stepValue, { color: theme.text }]}>{value}</Text>
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          disabled={value >= max}
          style={[styles.stepButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={() => onChange(clamp(value + step))}
        >
          <Text style={[styles.stepLabel, { color: theme.text }]}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Segmented option row (enum values: font, align, …). */
export function ChipRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.chip,
              { backgroundColor: theme.surfaceAlt },
              value === option && { backgroundColor: theme.accent },
            ]}
            onPress={() => onChange(option)}
          >
            <Text
              style={[
                styles.chipLabel,
                { color: theme.textSecondary },
                value === option && { color: theme.accentText },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Swatch palette + hex field for color editing without native pickers. */
export function ColorRow({
  label,
  value,
  swatches,
  onChange,
}: {
  label: string;
  value: string;
  swatches: string[];
  onChange: (next: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.column}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.swatches}>
        {swatches.map((swatch) => (
          <Pressable
            key={swatch}
            accessibilityLabel={`Color ${swatch}`}
            style={[
              styles.swatch,
              {
                backgroundColor: swatch === 'transparent' ? theme.surface : swatch,
                borderColor: theme.border,
              },
              value === swatch && { borderColor: theme.accent, borderWidth: 2 },
            ]}
            onPress={() => onChange(swatch)}
          >
            {swatch === 'transparent' ? (
              <Text style={[styles.swatchX, { color: theme.textMuted }]}>∅</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
      <TextInput
        autoCapitalize="none"
        onChangeText={(next) => {
          if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next);
        }}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.hexInput,
          { borderColor: theme.border, color: theme.text, backgroundColor: theme.surfaceAlt },
        ]}
        value={value}
      />
    </View>
  );
}

// Layout-only statics; colors come from `useTheme()` inline overrides.
const styles = StyleSheet.create({
  row: { gap: 6, marginBottom: 12 },
  column: { gap: 8, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: {
    width: 36,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 16, fontWeight: '700' },
  stepValue: { minWidth: 44, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipLabel: { fontSize: 12, fontWeight: '600' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchX: { fontSize: 12 },
  hexInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    alignSelf: 'flex-start',
    minWidth: 140,
  },
});
