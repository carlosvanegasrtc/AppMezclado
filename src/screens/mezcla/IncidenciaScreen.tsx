/**
 * IncidenciaScreen — formulario para reportar una incidencia de mezcla.
 * Flujo: seleccionar tipo → descripción (obligatoria si OTRO) → enviar.
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
import { AlertTriangle, Send } from 'lucide-react-native';
import { AppBar } from '@components/ui/AppBar';
import { AppButton } from '@components/ui/AppButton';
import { Card } from '@components/ui/Card';
import { Screen } from '@components/ui/Screen';
import { Colors, Radius } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { useRegistrarIncidencia, useTiposIncidencia } from '@hooks/useMezcla';
import { useHaptics } from '@hooks/useHaptics';
import { normalizeError } from '@utils/networkError';
import type { AppStackParamList } from '@navigation/types';
import type { TipoIncidenciaMezcla } from '@/types/mezcla';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'Incidencia'>;

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function IncidenciaScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { idOrdenProduccionMZCL, codigoFormula } = route.params;
  const session = useAuthStore((s) => s.session);
  const haptics = useHaptics();
  const registrar = useRegistrarIncidencia();
  const tipos = useTiposIncidencia();

  const tiposActivos = useMemo(
    () => (tipos.data ?? []).filter((t) => t.Activo !== false),
    [tipos.data],
  );

  const [tipoSel, setTipoSel] = useState<TipoIncidenciaMezcla | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const requiereDescripcion = tipoSel?.Codigo === 'OTRO';
  const canSubmit =
    !!tipoSel &&
    !!session?.idEmpleado &&
    !registrar.isPending &&
    (!requiereDescripcion || descripcion.trim().length >= 5);

  const onSubmit = async () => {
    if (!session?.idEmpleado || !tipoSel) {
      Alert.alert('Datos incompletos', 'Selecciona un tipo de incidencia.');
      return;
    }
    try {
      await registrar.mutateAsync({
        idEmpleado: session.idEmpleado,
        idProduccion: idOrdenProduccionMZCL,
        fechaTurno: todayLocal(),
        codigoFormula: codigoFormula ?? '',
        descripcion: descripcion.trim() || tipoSel.Descripcion,
        idTipoIncidencia: tipoSel.IdTipoIncidencia,
      });
      haptics.success();
      Alert.alert('Incidencia reportada', 'El jefe de turno fue notificado.', [
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
      <AppBar title="Reportar incidencia" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Card radius={Radius.lg}>
            <View style={styles.banner}>
              <AlertTriangle size={14} color={Colors.amber[700]} strokeWidth={2.4} />
              <Text style={styles.bannerText}>
                Selecciona el tipo de incidencia y agrega detalles si es necesario.
              </Text>
            </View>

            <Text style={styles.label}>Tipo de incidencia</Text>

            {tipos.isLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : tipos.isError ? (
              <Text style={styles.errorTxt}>
                No se pudo cargar el catálogo. Intenta de nuevo.
              </Text>
            ) : (
              <View style={styles.tiposList}>
                {tiposActivos.map((t) => {
                  const sel = tipoSel?.IdTipoIncidencia === t.IdTipoIncidencia;
                  return (
                    <Pressable
                      key={t.IdTipoIncidencia}
                      onPress={() => {
                        haptics.light();
                        setTipoSel(t);
                      }}
                      style={[styles.tipoRow, sel && styles.tipoRowSel]}
                    >
                      <View style={[styles.dot, sel && styles.dotSel]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tipoTxt}>{t.Descripcion}</Text>
                        <Text
                          style={[
                            styles.tipoTag,
                            t.Justificado ? styles.tagOk : styles.tagBad,
                          ]}
                        >
                          {t.Justificado
                            ? 'Justificada · no afecta cumplimiento'
                            : 'No justificada · afecta cumplimiento'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>
              Descripción {requiereDescripcion ? '(obligatoria)' : '(opcional)'}
            </Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder={
                requiereDescripcion
                  ? 'Describe el motivo con detalle (mínimo 5 caracteres)…'
                  : 'Agrega detalles adicionales si lo deseas…'
              }
              placeholderTextColor={Colors.hint}
              multiline
              numberOfLines={4}
              style={styles.textarea}
              textAlignVertical="top"
            />
            {requiereDescripcion && (
              <Text style={styles.help}>
                {descripcion.trim().length}/5 caracteres mínimos
              </Text>
            )}

            <AppButton
              label="Enviar incidencia"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={registrar.isPending}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Send size={18} color={Colors.white} strokeWidth={2.4} />}
              style={{ marginTop: 14 }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingBottom: 32 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.amber[50],
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginBottom: 14,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.amber[800],
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
  tiposList: { gap: 8 },
  tipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.slate[50],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slate[200],
  },
  tipoRowSel: {
    borderColor: Colors.amber[500],
    backgroundColor: Colors.amber[50],
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
    borderColor: Colors.amber[500],
    backgroundColor: Colors.amber[500],
  },
  tipoTxt: { fontSize: 14, color: Colors.foreground, fontWeight: '700' },
  tipoTag: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  tagOk: { color: Colors.success },
  tagBad: { color: Colors.error },
  errorTxt: { fontSize: 12, color: Colors.error, paddingVertical: 8 },
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
  help: { fontSize: 11, color: Colors.muted, marginTop: 4, textAlign: 'right' },
});
