import { create } from 'zustand';

const useSettingsStore = create((set) => ({
  shopInfo: {
    name: 'Jewelry Store',
    phone: '',
    address: '',
    gst: ''
  },

  setShopInfo: (info) => set({ shopInfo: info }),

  loadShopInfo: async () => {
    try {
      const response = await fetch('/api/settings/shop');
      if (response.ok) {
        const data = await response.json();
        set({ shopInfo: data });
      }
    } catch (error) {
      console.error('Failed to load shop info:', error);
    }
  },
}));

export default useSettingsStore;
