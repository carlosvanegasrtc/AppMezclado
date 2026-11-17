import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LABEL_SIZE, isLabelSizeId, type LabelSizeId } from '@config/labelSizes';

interface LabelSettingsState {
  labelSize: LabelSizeId;
  setLabelSize: (size: LabelSizeId) => void;
}

/** Preferencias de impresión de etiquetas, persistidas en el dispositivo. */
export const useLabelSettingsStore = create<LabelSettingsState>()(
  persist(
    (set) => ({
      labelSize: DEFAULT_LABEL_SIZE,
      setLabelSize: (labelSize) => set({ labelSize }),
    }),
    {
      name: 'label-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ labelSize }) => ({ labelSize }),
      // Si el valor guardado ya no existe en el catálogo, se vuelve al predeterminado.
      merge: (persisted, current) => {
        const size = (persisted as Partial<LabelSettingsState> | undefined)?.labelSize;
        return { ...current, labelSize: isLabelSizeId(size) ? size : DEFAULT_LABEL_SIZE };
      },
    },
  ),
);
