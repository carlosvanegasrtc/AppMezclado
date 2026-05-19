import { create } from 'zustand';

interface NetworkState {
  visible: boolean;
  message: string;
  showError: (message: string) => void;
  hide: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  visible: false,
  message: '',
  showError: (message) => set({ visible: true, message }),
  hide: () => set({ visible: false }),
}));
