import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { NoConnectionDialog } from '@components/ui/NoConnectionDialog';
import { useNetworkStore } from '@store/networkStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected === false) {
        useNetworkStore
          .getState()
          .showError('Sin acceso a internet.\nVerifica tu señal WiFi o datos móviles.');
      } else {
        useNetworkStore.getState().hide();
      }
    });
    return unsub;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <NoConnectionDialog />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
