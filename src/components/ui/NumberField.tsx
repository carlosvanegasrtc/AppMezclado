import React from 'react';
import { StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '@constants/index';

interface NumberFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  expected?: number | null;
  tolerance?: string;
  decimal?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
}

export function NumberField({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
  hint,
  error,
  expected,
  tolerance,
  decimal = true,
  containerStyle,
  testID,
}: NumberFieldProps) {
  const sanitize = (raw: string) => {
    if (!raw) return '';
    let v = raw.replace(',', '.');
    v = decimal ? v.replace(/[^\d.]/g, '') : v.replace(/\D/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    return v;
  };

  return (
    <View style={[styles.field, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {expected != null && (
          <Text style={styles.expected}>
            esperado {expected}
            {tolerance ? ` ±${tolerance}` : ''}
          </Text>
        )}
      </View>
      <View style={[styles.inputWrap, error && styles.inputWrapError]}>
        <TextInput
          testID={testID}
          value={value}
          onChangeText={(t) => onChangeText(sanitize(t))}
          placeholder={placeholder ?? '0'}
          placeholderTextColor={Colors.hint}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          style={styles.input}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    color: Colors.slate[700],
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  expected: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate[200],
    gap: 8,
  },
  inputWrapError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.foreground,
    padding: 0,
    letterSpacing: 0.4,
  },
  unit: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate[600],
  },
  hint: { fontSize: 11, color: Colors.muted, fontWeight: '500' },
  errorText: { fontSize: 11, color: Colors.error, fontWeight: '700' },
});
