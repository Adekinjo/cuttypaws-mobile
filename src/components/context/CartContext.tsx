import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import keyValueStorage from "../../utils/keyValueStorage";

const CART_KEY = "cart";

type CartItem = {
  id: string;
  quantity: number;
  name?: string;
  imageUrls?: string[];
  oldPrice?: number;
  newPrice?: number;
  size?: string | null;
  color?: string | null;
  [key: string]: any;
};

type CartPayload = {
  id: string;
  quantity?: number;
  name?: string;
  imageUrls?: string[];
  oldPrice?: number;
  newPrice?: number;
  size?: string | null;
  color?: string | null;
  [key: string]: any;
};

type CartState = {
  cart: CartItem[];
};

type CartAction =
  | { type: "ADD_ITEM" | "ADD ITEM"; payload: CartPayload }
  | { type: "REMOVE_ITEM"; payload: { id: string; size?: string | null; color?: string | null } }
  | { type: "INCREMENT_ITEM"; payload: { id: string; size?: string | null; color?: string | null } }
  | { type: "DECREMENT_ITEM"; payload: { id: string; size?: string | null; color?: string | null } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE_CART"; payload: CartItem[] };

type CartContextValue = {
  cart: CartItem[];
  dispatch: React.Dispatch<CartAction>;
  isReady: boolean;
  isError: boolean;
  setIsError: React.Dispatch<React.SetStateAction<boolean>>;
  totalItemsInCart: number;
  totalCartValue: number;
  addItem: (item: CartPayload) => void;
  incrementItem: (item: { id: string; size?: string | null; color?: string | null }) => void;
  decrementItem: (item: { id: string; size?: string | null; color?: string | null }) => void;
  removeItem: (item: { id: string; size?: string | null; color?: string | null }) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const initialState: CartState = {
  cart: [],
};

function matchesVariant(
  item: { id: string; size?: string | null; color?: string | null },
  payload: { id: string; size?: string | null; color?: string | null }
) {
  return (
    item.id === payload.id &&
    String(item.size || "") === String(payload.size || "") &&
    String(item.color || "") === String(payload.color || "")
  );
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE_CART":
      return { ...state, cart: Array.isArray(action.payload) ? action.payload : [] };

    case "ADD_ITEM":
    case "ADD ITEM": {
      const existingItem = state.cart.find((item) => matchesVariant(item, action.payload));
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            matchesVariant(item, action.payload)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        cart: state.cart.filter((item) => !matchesVariant(item, action.payload)),
      };

    case "INCREMENT_ITEM":
      return {
        ...state,
        cart: state.cart.map((item) =>
          matchesVariant(item, action.payload)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };

    case "DECREMENT_ITEM":
      return {
        ...state,
        cart: state.cart
          .map((item) =>
            matchesVariant(item, action.payload) && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    default:
      return state;
  }
}

async function loadCartFromStorage() {
  try {
    const raw = await keyValueStorage.getItem(CART_KEY);
    if (!raw || raw === "null" || raw === "undefined") return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error parsing cart from storage:", error);
    return [];
  }
}

async function saveCartToStorage(cart: CartItem[]) {
  try {
    await keyValueStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isReady, setIsReady] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const storedCart = await loadCartFromStorage();
      if (!mounted) return;
      dispatch({ type: "HYDRATE_CART", payload: storedCart });
      setIsReady(true);
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveCartToStorage(state.cart);
  }, [isReady, state.cart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart: state.cart,
      dispatch,
      isReady,
      isError,
      setIsError,
      totalItemsInCart: state.cart.reduce((sum, item) => sum + (item.quantity || 0), 0),
      totalCartValue: state.cart.reduce(
        (sum, item) => sum + Number(item.newPrice || 0) * Number(item.quantity || 0),
        0
      ),
      addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
      incrementItem: (item) => dispatch({ type: "INCREMENT_ITEM", payload: item }),
      decrementItem: (item) => dispatch({ type: "DECREMENT_ITEM", payload: item }),
      removeItem: (item) => dispatch({ type: "REMOVE_ITEM", payload: item }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
    }),
    [isError, isReady, state.cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
