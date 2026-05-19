import './global.css';
import React from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@providers/AppProviders';
import { RootNavigator } from '@navigation/RootNavigator';

// Forzar Roboto en Android para evitar fuentes del SO (Samsung One UI, MIUI, etc.)
if (Platform.OS === 'android') {
  const TextAny = Text as any;
  const InputAny = TextInput as any;
  TextAny.defaultProps = TextAny.defaultProps || {};
  TextAny.defaultProps.style = [{ fontFamily: 'Roboto' }, TextAny.defaultProps.style];
  InputAny.defaultProps = InputAny.defaultProps || {};
  InputAny.defaultProps.style = [{ fontFamily: 'Roboto' }, InputAny.defaultProps.style];
}

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}
