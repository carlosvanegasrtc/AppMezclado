import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { Colors, Radius } from '@constants/index';
import { useNetworkStore } from '@store/networkStore';

export function NoConnectionDialog() {
  const visible = useNetworkStore((s) => s.visible);
  const message = useNetworkStore((s) => s.message);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={() => null}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.iconWrap}>
            <WifiOff size={32} color={Colors.error} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Sin conexión</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.hint}>
            Esta ventana se cerrará automáticamente cuando recuperes la conexión.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.foreground,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    color: Colors.hint,
    textAlign: 'center',
    marginTop: 8,
  },
});
