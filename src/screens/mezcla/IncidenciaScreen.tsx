/**
 * IncidenciaScreen — formulario para reportar una incidencia de mezcla.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { useRegistrarIncidencia } from '@hooks/useMezcla';
import { useHaptics } from '@hooks/useHaptics';
import { normalizeError } from '@utils/networkError';
import type { AppStackParamList } from '@navigation/types';

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

  const [descripcion, setDescripcion] = useState('');

  const canSubmit =
    descripcion.trim().length >= 10 && !!session?.idEmpleado && !registrar.isPending;

  const onSubmit = async () => {
    if (!session?.idEmpleado) {
      Alert.alert('Sesión inválida', 'No se pudo identificar al usuario.');
      return;
    }
    try {
      await registrar.mutateAsync({
        idEmpleado: session.idEmpleado,
        idProduccion: idOrdenProduccionMZCL,
        fechaTurno: todayLocal(),
        codigoFormula: codigoFormula ?? '',
        descripcion: descripcion.trim(),
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
            <Text style={styles.tagline}>
              <AlertTriangle size={14} color={Colors.amber[700]} /> Describe el problema con el
              mayor detalle posible (máquina, material, condiciones).
            </Text>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Ej: Mezcladora #2 se detuvo a las 09:45 por sobrecarga…"
              placeholderTextColor={Colors.hint}
              multiline
              numberOfLines={5}
              style={styles.textarea}
              textAlignVertical="top"
            />
            <Text style={styles.help}>{descripcion.trim().length}/10 caracteres mínimos</Text>

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
  body: { padding: 16 },
  tagline: {
    fontSize: 12,
    color: Colors.amber[800],
    backgroundColor: Colors.amber[50],
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    marginBottom: 14,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate[700],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
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
    minHeight: 120,
  },
  help: { fontSize: 11, color: Colors.muted, marginTop: 4, textAlign: 'right' },
});
