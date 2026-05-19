import React from 'react';
import { Dimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeScreen } from '@screens/home/HomeScreen';
import { OrdenesScreen } from '@screens/mezcla/OrdenesScreen';
import { HistorialScreen } from '@screens/mezcla/HistorialScreen';
import { SettingsScreen } from '@screens/settings/SettingsScreen';
import { Colors } from '@constants/colors';
import { CustomDrawerContent } from './CustomDrawerContent';
import type { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

const screenWidth = Dimensions.get('window').width;
const drawerWidth = Math.min(320, screenWidth * 0.85);

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(p) => <CustomDrawerContent {...p} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: Colors.surface,
          width: drawerWidth,
        },
        overlayColor: 'rgba(15, 23, 42, 0.45)',
        drawerType: 'front',
        sceneStyle: { backgroundColor: Colors.slate[50] },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Drawer.Screen
        name="Ordenes"
        component={OrdenesScreen}
        options={{ title: 'Mis órdenes' }}
      />
      <Drawer.Screen
        name="Historial"
        component={HistorialScreen}
        options={{ title: 'Historial' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configuración' }}
      />
    </Drawer.Navigator>
  );
}
