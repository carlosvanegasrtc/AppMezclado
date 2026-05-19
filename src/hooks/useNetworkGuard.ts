import { useEffect } from 'react';
import { useNetworkStore } from '@store/networkStore';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Hook que escucha el estado de red y muestra/oculta el diálogo global
 * de "sin conexión" automáticamente.
 *
 * Úsalo en el componente raíz de un stack que requiera red obligatoria.
 */
export function useNetworkGuard() {
  const { isConnected } = useNetworkStatus();
  const showError = useNetworkStore((s) => s.showError);
  const hide = useNetworkStore((s) => s.hide);

  useEffect(() => {
    if (isConnected === false) {
      showError('Sin acceso a internet.\nVerifica tu señal WiFi o datos móviles.');
    } else if (isConnected === true) {
      hide();
    }
  }, [isConnected, showError, hide]);
}
