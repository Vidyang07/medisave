import { useState, useEffect } from "react";
import { CartContext } from "./cartContextDef";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem("medisave_cart_items");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("medisave_cart_items", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items]);

  const addToCart = (medicine, quantity = 1) => {
    const medId = medicine.id || medicine._id;
    if (!medId) return;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === medId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const currentItem = updated[existingIndex];
        const maxAvail = currentItem.maxAvailable || medicine.quantity || 99;
        updated[existingIndex] = {
          ...currentItem,
          quantity: Math.min(currentItem.quantity + quantity, maxAvail),
        };
        return updated;
      }
      return [
        ...prevItems,
        {
          id: medId,
          name: medicine.name || medicine.medicineName,
          brandName: medicine.brandName || medicine.name || medicine.medicineName,
          company: medicine.company,
          strength: medicine.strength,
          price: Number(medicine.price) || 0,
          originalMrp: Number(medicine.originalMrp) || Number(medicine.price) || 0,
          expiryDate: medicine.expiryDate,
          expiryText: medicine.expiryText,
          image: medicine.image,
          seller: medicine.seller,
          maxAvailable: medicine.quantity,
          quantity: Math.min(quantity, medicine.quantity || 99),
          isPrescriptionRequired: Boolean(medicine.isPrescriptionRequired),
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(newQty, item.maxAvailable || 99) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Totals calculations
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const originalTotal = items.reduce((acc, item) => acc + (item.originalMrp || item.price) * item.quantity, 0);
  const totalSavings = Math.max(0, originalTotal - subtotal);
  const shippingFee = items.length > 0 ? (subtotal >= 200 ? 0 : 25) : 0;
  const grandTotal = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        originalTotal,
        totalSavings,
        shippingFee,
        grandTotal,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
