import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { CartItem } from '../types/database.types';

interface CartContextType {
  cartItems: CartItem[];
  cartId: string | null;
  loading: boolean;
  error: string | null;
  getCartItemsCount: () => number;
  updateItemQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCartData();
    }
  }, [user]);

  const fetchCartData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Find all carts for this user
      const { data: userCarts, error: cartsError } = await supabase
        .from('carts')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });
      
      if (cartsError) throw cartsError;
      // Check if we have any carts
      if (!userCarts || userCarts.length === 0) {
        // Set empty cart state - don't create a new cart here
        // The cart should have been created during registration
        console.warn('No cart found for user. Cart should be created during registration.');
        setCartId(null);
        setCartItems([]);
        setLoading(false);
        return;
      }
      
      // Use the most recent cart
      const mostRecentCart = userCarts[0];
      setCartId(mostRecentCart.id);
      
      // If we have multiple carts, clean them up
      if (userCarts.length > 1) {
        console.warn(`User has ${userCarts.length} carts. Using the most recent one.`);
        // We could clean up old carts here, but for simplicity we'll skip this
      }
      
      // Fetch cart items for the most recent cart
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', mostRecentCart.id);
      
      if (itemsError) throw itemsError;
      
      if (!items || items.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }
      
      setCartItems(items);
    } catch (error: any) {
      console.error('Error fetching cart data:', error);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Public function to refresh cart data
  const refreshCart = async () => {
    await fetchCartData();
  };

  // Get the total number of items in the cart
  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Update item quantity
  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        // Remove item
        await removeItem(itemId);
      } else {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', itemId);
        
        if (error) throw error;
        
        // Update local state
        setCartItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity. Please try again.');
    }
  };
  
  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error: any) {
      console.error('Error removing item:', error);
      setError('Failed to remove item. Please try again.');
    }
  };
  
  // Clear entire cart
  const clearCart = async () => {
    if (!cartId) return;
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);
      
      if (error) throw error;
      
      setCartItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart. Please try again.');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartId,
        loading,
        error,
        getCartItemsCount,
        updateItemQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 