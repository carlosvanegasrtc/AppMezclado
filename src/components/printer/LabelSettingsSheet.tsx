import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Circle, X } from 'lucide-react-native';
import { Colors, Radius } from '@constants/index';
import { LABEL_SIZES, type LabelSizeId, type LabelSizeOption } from '@config/labelSizes';

interface LabelSettingsSheetProps {
  visible: boolean;
  selected: LabelSizeId;
  onSelect: (size: LabelSizeId) => void;
  onClose: () => void;
}

/**
 * Hoja de configuración de impresión: permite elegir el tamaño de etiqueta.
 * Es un componente de presentación: no conoce la persistencia ni la impresora,
 * recibe el valor actual y notifica la selección.
 */
export function LabelSettingsSheet({ visible, selected, onSelect, onClose }: LabelSettingsSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Configuración de impresión</Text>
            <TouchableOpacity onPress={onClose} hitSlop={14} accessibilityLabel="Cerrar">
              <X size={20} color={Colors.slate[500]} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>
            Tamaño de etiqueta. Debe coincidir con el rollo cargado en la impresora.
          </Text>

          {LABEL_SIZES.map((opt) => (
            <LabelSizeRow
              key={opt.id}
              option={opt}
              selected={opt.id === selected}
              onPress={() => onSelect(opt.id)}
            />
          ))}

          <Text style={styles.hint}>
            Todas las etiquetas incluyen código de barras, código, fórmula y la fecha y hora de impresión.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function LabelSizeRow({
  option, selected, onPress,
}: { option: LabelSizeOption; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSel]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <View style={styles.previewBox}>
        <LabelPreview option={option} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, selected && { color: Colors.sky[700] }]}>{option.nombre}</Text>
        <Text style={styles.rowDesc}>{option.descripcion}</Text>
      </View>
      {selected
        ? <CheckCircle2 size={20} color={Colors.sky[600]} strokeWidth={2.2} />
        : <Circle       size={20} color={Colors.hint}      strokeWidth={1.8} />}
    </TouchableOpacity>
  );
}

/** Miniatura a escala real relativa (12 px por pulgada) del diseño impreso. */
const PX_PER_INCH = 12;

function LabelPreview({ option }: { option: LabelSizeOption }) {
  const width  = option.widthIn  * PX_PER_INCH;
  const height = option.heightIn * PX_PER_INCH;
  const tall   = option.heightIn > option.widthIn;
  const barH   = height * (tall ? 0.4 : 0.6);

  return (
    <View style={[styles.preview, { width, height }]}>
      <View style={[styles.previewBars, { height: barH }]} />
      <View style={[styles.previewLine, { width: '70%' }]} />
      <View style={[styles.previewLine, { width: '50%' }]} />
      {tall && <View style={[styles.previewLine, { width: '60%', marginTop: 6 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.slate[900] },
  sub:   { fontSize: 12, color: Colors.muted, marginBottom: 12 },
  hint:  { fontSize: 11, color: Colors.hint, lineHeight: 16, marginTop: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginBottom: 6,
    backgroundColor: Colors.slate[50],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSel: { backgroundColor: Colors.sky[50], borderColor: Colors.sky[200] },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Colors.slate[800] },
  rowDesc:  { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 16 },

  previewBox: { width: 56, height: 76, alignItems: 'center', justifyContent: 'center' },
  preview: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate[300],
    borderRadius: 2,
    padding: 2,
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  previewBars: { width: '100%', backgroundColor: Colors.slate[700], borderRadius: 1 },
  previewLine: { height: 2, backgroundColor: Colors.slate[400], borderRadius: 1 },
});
