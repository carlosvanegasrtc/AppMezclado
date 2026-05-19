import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/authStore';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { OrdenDetalleScreen } from '@screens/mezcla/OrdenDetalleScreen';
import { RegistrarSacoScreen } from '@screens/mezcla/RegistrarSacoScreen';
import { EscanerScreen } from '@screens/mezcla/EscanerScreen';
import { IncidenciaScreen } from '@screens/mezcla/IncidenciaScreen';
import { CompletarOrdenScreen } from '@screens/mezcla/CompletarOrdenScreen';
import { BoletaTurnoScreen } from '@screens/mezcla/BoletaTurnoScreen';
import { InsumosScreen } from '@screens/mezcla/InsumosScreen';
import { DrawerNavigator } from './DrawerNavigator';
import { Colors } from '@constants/colors';
import type { AuthStackParamList, AppStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="DrawerMain" component={DrawerNavigator} />
      <AppStack.Screen
        name="OrdenDetalle"
        component={OrdenDetalleScreen}
        options={{ presentation: 'card' }}
      />
      <AppStack.Screen
        name="RegistrarSaco"
        component={RegistrarSacoScreen}
        options={{ presentation: 'card' }}
      />
      <AppStack.Screen
        name="Escaner"
        component={EscanerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <AppStack.Screen
        name="Incidencia"
        component={IncidenciaScreen}
        options={{ presentation: 'card' }}
      />
      <AppStack.Screen
        name="CompletarOrden"
        component={CompletarOrdenScreen}
        options={{ presentation: 'card' }}
      />
      <AppStack.Screen
        name="BoletaTurno"
        component={BoletaTurnoScreen}
        options={{ presentation: 'card' }}
      />
      <AppStack.Screen
        name="Insumos"
        component={InsumosScreen}
        options={{ presentation: 'card' }}
      />
    </AppStack.Navigator>
  );
}

function SplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.sky[900],
      }}
    >
      <ActivityIndicator color={Colors.white} size="large" />
    </View>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
