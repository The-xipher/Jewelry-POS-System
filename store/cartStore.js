import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  customer: { name: '', whatsapp: '' },
  discountPercent: 0,

  addItem: (product) => set((state) => {
    const existingItem = state.items.find(item => item.id === product.id);
    if (existingItem) {
      return {
        items: state.items.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      };
    }
    return {
      items: [...state.items, { ...product, qty: 1 }]
    };
  }),

  updateQuantity: (id, qty) => set((state) => ({
    items: state.items.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, qty) } : item
    )
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  setCustomer: (customer) => set({ customer }),

  setDiscount: (discount) => set({ discountPercent: Math.max(0, Math.min(100, discount)) }),

  clearCart: () => set({ items: [], customer: { name: '', whatsapp: '' }, discountPercent: 0 }),

  getSubTotal: () => {
    const state = useCartStore.getState();
    return state.items.reduce((total, item) => total + (item.sellPrice * item.qty), 0);
  },

  getGrandTotal: () => {
    const state = useCartStore.getState();
    const subTotal = state.getSubTotal();
    return subTotal - (subTotal * state.discountPercent / 100);
  },
}));

export default useCartStore;
