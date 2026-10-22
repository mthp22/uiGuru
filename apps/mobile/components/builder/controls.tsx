import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.inputMultiline]}
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
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          disabled={value <= min}
          style={styles.stepButton}
          onPress={() => onChange(clamp(value - step))}
        >
          <Text style={styles.stepLabel}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          disabled={value >= max}
          style={styles.stepButton}
          onPress={() => onChange(clamp(value + step))}
        >
          <Text style={styles.stepLabel}>＋</Text>
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
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, value === option && styles.chipActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipLabel, value === option && styles.chipLabelActive]}>{option}</Text>
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
  return (
    <View style={styles.column}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.swatches}>
        {swatches.map((swatch) => (
          <Pressable
            key={swatch}
            accessibilityLabel={`Color ${swatch}`}
            style={[styles.swatch, { backgroundColor: swatch === 'transparent' ? '#ffffff' : swatch }, value === swatch && styles.swatchActive]}
            onPress={() => onChange(swatch)}
          >
            {swatch === 'transparent' ? <Text style={styles.swatchX}>∅</Text> : null}
          </Pressable>
        ))}
      </View>
      <TextInput
        autoCapitalize="none"
        onChangeText={(next) => {
          if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next);
        }}
        style={styles.hexInput}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, marginBottom: 12 },
  column: { gap: 8, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#172033',
    backgroundColor: '#f8fafc',
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepButton: {
    width: 36,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  stepLabel: { fontSize: 16, fontWeight: '700', color: '#334155' },
  stepValue: { minWidth: 44, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#0f172a' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipLabelActive: { color: '#ffffff' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: { borderColor: '#2563eb', borderWidth: 2 },
  swatchX: { fontSize: 12, color: '#94a3b8' },
  hexInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#334155',
    backgroundColor: '#f8fafc',
    alignSelf: 'flex-start',
    minWidth: 140,
  },
});
