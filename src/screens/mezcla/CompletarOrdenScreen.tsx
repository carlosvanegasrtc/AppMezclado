/**
 * CompletarOrdenScreen — confirma cierre de la orden de mezcla.
 *
 * Reglas (validadas también en backend):
 *  - kg producidos ≥ planificados → COMPLETADA, motivo opcional
 *  - kg producidos = 0            → INCOMPLETA, motivo OBLIGATORIO
 *  - kg < plan + motivo justificado → INCOMPLETA (no afecta cumplimiento)
 *  - kg < plan + motivo NO justificado → COMPLETADA (sí afecta)
 *  - motivo = OTRO → observaciones obligatorias
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2 } from 'lucide-react-native';
import { AppBar } from '@components/ui/AppBar';
import { AppButton } from '@components/ui/AppButton';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import {
  useCompletarOrden,
  useMotivosCierre,
  useOrdenesPorEmpleado,
} from '@hooks/useMezcla';
import { useHaptics } from '@hooks/useHaptics';
import { normalizeError } from '@utils/networkError';
import type { AppStackParamList } from '@navigation/types';
import type { MotivoCierreMezcla } from '@/types/mezcla';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'CompletarOrden'>;

export function CompletarOrdenScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { idOrdenProduccionMZCL } = route.params;
  const session = useAuthStore((s) => s.session);
  const haptics = useHaptics();
  const completar = useCompletarOrden();

  const { data: ordenes } = useOrdenesPorEmpleado(session?.idEmpleado);
  const orden = ordenes?.find((o) => o.IdOrdenProduccionMZCL === idOrdenProduccionMZCL);

  const motivos = useMotivosCierre();
  const motivosActivos = useMemo(
    () => (motivos.data ?? []).filter((m) => m.Activo !== false),
    [motivos.data],
  );

  const [observaciones, setObservaciones] = useState('');
  const [motivoSel, setMotivoSel] = useState<MotivoCierreMezcla | null>(null);

  const kgPlan = Number(orden?.KgPlanificados ?? 0);
  const kgProd = Number(orden?.KgProducidos ?? 0);
  const sacos = Number(orden?.TotalSacos ?? 0);

  const requiereMotivo = kgProd < kgPlan || sacos === 0;
  const requiereObs =
    requiereMotivo && (motivoSel?.Codigo === 'OTRO' || (kgProd === 0 && !motivoSel));

  const canSubmit =
    !!session?.nombreCompleto &&
    !completar.isPending &&
    (!requiereMotivo || !!motivoSel) &&
    (!requiereObs || observaciones.trim().length >= 5);

  const onSubmit = async () => {
    if (!session?.nombreCompleto) {
      Alert.alert('Sesión inválida', 'No se pudo identificar al usuario.');
      return;
    }
    try {
      await completar.mutateAsync({
        idOrdenProduccionMZCL,
        payload: {
          usuarioCierre: session.nombreCompleto,
          observaciones: observaciones.trim() || undefined,
          idMotivoCierre: motivoSel?.IdMotivoCierre,
        },
      });
      haptics.success();
      Alert.alert('Orden completada', 'Cierre registrado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      haptics.error();
      const e = normalizeError(err);
      Alert.alert('Error', e.message);
    }
  };

  return (
    <Screen edges={['top']} bg={Colors.slate[50]}>
      <AppBar title="Completar orden" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Card radius={Radius.lg}>
            <Text style={styles.heading}>{orden?.NumeroOrdenMezcla ?? 'Orden'}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {orden?.CodigoFormula}
              {orden?.DescripcionFormula ? ` · ${orden.DescripcionFormula}` : ''}
            </Text>

            <View style={styles.kpiBox}>
              <KpiRow label="Planificado" value={`${kgPlan.toFixed(0)} kg`} />
              <KpiRow
                label="Producido"
                value={`${kgProd.toFixed(0)} kg`}
                accent={kgProd >= kgPlan ? Colors.success : Colors.warning}
              />
              <KpiRow label="Sacos" value={String(sacos)} />
            </View>

            {requiereMotivo && (
              <>
                <Text style={styles.warn}>
                  {kgProd === 0
                    ? 'No hay producción registrada. Selecciona el motivo.'
                    : 'La producción no alcanzó el plan. Selecciona el motivo.'}
                </Text>

                <Text style={styles.label}>Motivo de cierre</Text>
                {motivos.isLoading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
                ) : motivos.isError ? (
                  <Text style={styles.errorTxt}>
                    No se pudo cargar el catálogo de motivos. Reintenta.
                  </Text>
                ) : (
                  <View style={styles.motivosList}>
                    {motivosActivos.map((m) => {
                      const sel = motivoSel?.IdMotivoCierre === m.IdMotivoCierre;
                      return (
                        <Pressable
                          key={m.IdMotivoCierre}
                          onPress={() => {
                            haptics.light();
                            setMotivoSel(m);
                          }}
                          style={[styles.motivoRow, sel && styles.motivoRowSel]}
                        >
                          <View style={[styles.dot, sel && styles.dotSel]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.motivoTxt} numberOfLines={1}>
                              {m.Descripcion}
                            </Text>
                            <Text
                              style={[
                                styles.motivoTag,
                                m.Justificado ? styles.tagOk : styles.tagBad,
                              ]}
                            >
                              {m.Justificado
                                ? 'Justificado · no afecta cumplimiento'
                                : 'No justificado · afecta cumplimiento'}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            <Text style={styles.label}>
              Observaciones {requiereObs ? '(obligatorias)' : '(opcional)'}
            </Text>
            <TextInput
              value={observaciones}
              onChangeText={setObservaciones}
              placeholder="Ej: Falta de material entre 10:00 y 11:30…"
              placeholderTextColor={Colors.hint}
              multiline
              numberOfLines={4}
              style={styles.textarea}
              textAlignVertical="top"
            />

            <AppButton
              label="Cerrar orden"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={completar.isPending}
              variant="success"
              size="lg"
              fullWidth
              leftIcon={<CheckCircle2 size={18} color={Colors.white} strokeWidth={2.4} />}
              style={{ marginTop: 14 }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function KpiRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.kpiRow}>
      <Text style={styles.kpiLbl}>{label}</Text>
      <Text style={[styles.kpiVal, accent && { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16 },
  heading: { fontSize: 18, fontWeight: '900', color: Colors.foreground, letterSpacing: 0.4 },
  subtitle: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  kpiBox: {
    marginTop: 14,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiLbl: { fontSize: 13, color: Colors.muted, fontWeight: '600' },
  kpiVal: { fontSize: 14, fontWeight: '900', color: Colors.foreground },
  warn: {
    marginTop: 14,
    fontSize: 12,
    color: Colors.amber[800],
    backgroundColor: Colors.amber[50],
    padding: 10,
    borderRadius: Radius.sm,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[700],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  motivosList: { gap: 8 },
  motivoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate[200],
  },
  motivoRowSel: {
    borderColor: Colors.primary,
    backgroundColor: Colors.sky[50],
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.slate[300],
    backgroundColor: Colors.white,
  },
  dotSel: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  motivoTxt: { fontSize: 14, color: Colors.foreground, fontWeight: '700' },
  motivoTag: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  tagOk: { color: Colors.success },
  tagBad: { color: Colors.error },
  errorTxt: {
    fontSize: 12,
    color: Colors.error,
    paddingVertical: 8,
  },
  textarea: {
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate[200],
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.foreground,
    minHeight: 100,
  },
});
