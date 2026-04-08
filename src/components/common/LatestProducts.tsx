import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ProductService from "../../api/ProductService";
import { Banner, EmptyState, LoadingState } from "../admin/AdminCommon";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import ProductList from "./ProductList";

export default function LatestProducts({
  cartItems = [],
  onAddToCart,
  onIncrement,
  onDecrement,
  onOpenProduct,
  onNavigate,
}: {
  cartItems?: Array<{ id: string; quantity: number }>;
  onAddToCart?: (product: any) => void;
  onIncrement?: (product: any) => void;
  onDecrement?: (product: any) => void;
  onOpenProduct?: (product: any) => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const { colors } = useTheme();
  const { cart, dispatch } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setMessage("");

        const response = await ProductService.getAllProduct();
        const allProducts = response?.productList || [];
        const latestProducts = [...allProducts]
          .sort(
            (a, b) =>
              new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
          )
          .slice(0, 12);

        if (!mounted) return;
        setProducts(latestProducts);
      } catch (error: any) {
        if (!mounted) return;
        setMessage(error?.response?.data?.message || error?.message || "Unable to fetch latest products.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Loading latest products..." />;
  }

  const effectiveCartItems = cartItems.length ? cartItems : cart;

  const handleAddProduct = (product: any) => {
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }

    dispatch({ type: "ADD_ITEM", payload: { ...product, id: String(product.id) } });
  };

  const handleIncrementProduct = (product: any) => {
    if (onIncrement) {
      onIncrement(product);
      return;
    }

    dispatch({ type: "INCREMENT_ITEM", payload: { id: String(product.id) } });
  };

  const handleDecrementProduct = (product: any) => {
    if (onDecrement) {
      onDecrement(product);
      return;
    }

    const cartItem = effectiveCartItems.find((item) => String(item.id) === String(product.id));
    dispatch({
      type: Number(cartItem?.quantity || 0) > 1 ? "DECREMENT_ITEM" : "REMOVE_ITEM",
      payload: { id: String(product.id) },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner message={message} tone="error" />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>New Arrivals</Text>
      </View>

      {!products.length ? (
        <EmptyState label="No new arrivals available right now." />
      ) : (
        <ProductList
          products={products}
          cartItems={effectiveCartItems}
          onAddToCart={handleAddProduct}
          onIncrement={handleIncrementProduct}
          onDecrement={handleDecrementProduct}
          onOpenProduct={onOpenProduct}
          onNavigate={onNavigate}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
});
