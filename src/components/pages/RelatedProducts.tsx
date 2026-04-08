import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import ProductService from "../../api/ProductService";
import WishlistService from "../../api/WishlistService";
import Footer from "../common/Footer";
import { useCart } from "../context/CartContext";
import RelatedProductCard from "../product/RelatedProductCard";
import RelatedProductsHero from "../product/RelatedProductsHero";
import RelatedProductsEmptyState from "../product/RelatedProductsEmptyState";

type ProductItem = {
  id: string;
  name?: string;
  oldPrice?: number;
  newPrice?: number;
  imageUrls?: string[];
  imageUrl?: string;
  category?: string | { name?: string };
  subCategory?: string | { name?: string };
  description?: string;
  [key: string]: any;
};

export default function RelatedProducts({
  searchTerm,
  onNavigate,
  onOpenProduct,
}: {
  searchTerm?: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenProduct?: (product: ProductItem) => void;
}) {
  const { cart, dispatch } = useCart();

  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | "info">("info");

  const fetchWishlist = async () => {
    try {
      const data = await WishlistService.getWishlist();
      setWishlist(Array.isArray(data) ? data : []);
    } catch (wishlistError) {
      console.error("Failed to fetch wishlist:", wishlistError);
      setMessageTone("error");
      setMessage("Failed to fetch wishlist.");
    }
  };

  const fetchLikes = async () => {
    try {
      const data = await ProductService.getAllLikes();
      const likesMap = (data?.productList || []).reduce(
        (acc: Record<string, number>, product: any) => {
          acc[String(product.id)] = Number(product.likes || 0);
          return acc;
        },
        {}
      );
      setLikes(likesMap);
    } catch (likesError) {
      console.error("Failed to fetch likes:", likesError);
      setMessageTone("error");
      setMessage("Failed to fetch likes.");
    }
  };

  const fetchRelatedProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setMessage("");

      if (!searchTerm?.trim()) {
        setRelatedProducts([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const data = await ProductService.getRelatedProducts(searchTerm.trim());
      setRelatedProducts(Array.isArray(data) ? data : data?.productList || []);
      await Promise.all([fetchWishlist(), fetchLikes()]);
    } catch (fetchError: any) {
      setError(fetchError?.message || "Failed to fetch related products.");
      setMessageTone("error");
      setMessage("Failed to fetch related products.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRelatedProducts();
  }, [searchTerm]);

  const handleLike = async (productId: string) => {
    try {
      await ProductService.likeProduct(productId);
      setLikes((prev) => ({ ...prev, [productId]: Number(prev[productId] || 0) + 1 }));
    } catch {
      setMessageTone("error");
      setMessage("Failed to like the product.");
    }
  };

  const handleAddToCart = (product: ProductItem) => {
    dispatch({ type: "ADD_ITEM", payload: { ...product, id: String(product.id) } });
    setMessageTone("success");
    setMessage(`${product.name || "Product"} added to cart.`);
  };

  const handleIncrement = (product: ProductItem) => {
    dispatch({ type: "INCREMENT_ITEM", payload: { id: String(product.id) } });
  };

  const handleDecrement = (product: ProductItem) => {
    const cartItem = cart.find((item) => String(item.id) === String(product.id));
    dispatch({
      type: Number(cartItem?.quantity || 0) > 1 ? "DECREMENT_ITEM" : "REMOVE_ITEM",
      payload: { id: String(product.id) },
    });
  };

  const handleToggleWishlist = async (productId: string) => {
    const isAuthenticated = await AuthService.isAuthenticated();
    if (!isAuthenticated) {
      Alert.alert("Login required", "Please login to manage your wishlist.");
      return;
    }

    try {
      const isInWishlist = wishlist.some((item) => String(item.productId) === String(productId));
      if (isInWishlist) {
        await WishlistService.removeFromWishlist(productId);
        setWishlist((prev) => prev.filter((item) => String(item.productId) !== String(productId)));
      } else {
        await WishlistService.addToWishlist(productId);
        setWishlist(await WishlistService.getWishlist());
      }
    } catch {
      setMessageTone("error");
      setMessage("Wishlist update failed.");
    }
  };

  const summary = useMemo(() => {
    const discounted = relatedProducts.filter(
      (product) =>
        Number(product.oldPrice || 0) > 0 &&
        Number(product.oldPrice || 0) > Number(product.newPrice || 0)
    ).length;

    return {
      total: relatedProducts.length,
      discounted,
    };
  }, [relatedProducts]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRelatedProducts(true)}
            tintColor="#0F766E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <RelatedProductsHero
          title="Related Products"
          subtitle="Recommendations based on what the user is currently exploring."
          totalProducts={summary.total}
          discountedProducts={summary.discounted}
          searchTerm={searchTerm}
        />

        {message ? (
          <View
            style={[
              styles.banner,
              messageTone === "error" && styles.bannerError,
              messageTone === "success" && styles.bannerSuccess,
            ]}
          >
            <Feather
              name={
                messageTone === "error"
                  ? "alert-circle"
                  : messageTone === "success"
                    ? "check-circle"
                    : "info"
              }
              size={16}
              color={
                messageTone === "error"
                  ? "#991B1B"
                  : messageTone === "success"
                    ? "#065F46"
                    : "#0F766E"
              }
            />
            <Text
              style={[
                styles.bannerText,
                messageTone === "error" && styles.bannerTextError,
                messageTone === "success" && styles.bannerTextSuccess,
              ]}
            >
              {message}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>Loading related products...</Text>
            <Text style={styles.centerStateBody}>
              Matching recommendations, likes, wishlist state, and cart actions.
            </Text>
          </View>
        ) : null}

        {!loading && (error || !relatedProducts.length) ? (
          <RelatedProductsEmptyState
            title="No related products available"
            description={
              error ||
              "There are no matching recommendations for this search term yet. Try a different product or return to discovery."
            }
            onBrowseHome={() => onNavigate?.("home")}
          />
        ) : null}

        {!loading && relatedProducts.length ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionEyebrow}>Recommended for you</Text>
            <Text style={styles.sectionTitle}>Product Matches</Text>
            <View style={styles.grid}>
              {relatedProducts.map((product) => {
                const cartItem = cart.find((item) => String(item.id) === String(product.id));
                const isInWishlist = wishlist.some(
                  (item) => String(item.productId) === String(product.id)
                );

                return (
                  <RelatedProductCard
                    key={String(product.id)}
                    product={product}
                    cartQuantity={cartItem?.quantity || 0}
                    isInWishlist={isInWishlist}
                    likesCount={likes[String(product.id)] || 0}
                    onAddToCart={() => handleAddToCart(product)}
                    onIncrement={() => handleIncrement(product)}
                    onDecrement={() => handleDecrement(product)}
                    onToggleWishlist={() => handleToggleWishlist(String(product.id))}
                    onLike={() => handleLike(String(product.id))}
                    onPress={() => onOpenProduct?.(product)}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        <Footer onNavigate={(route) => onNavigate?.(route)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#F5FAF8",
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  bannerError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  bannerSuccess: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  bannerText: {
    flex: 1,
    color: "#0F766E",
    lineHeight: 20,
    fontWeight: "600",
  },
  bannerTextError: {
    color: "#991B1B",
  },
  bannerTextSuccess: {
    color: "#065F46",
  },
  centerState: {
    alignItems: "center",
    gap: 10,
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  centerStateTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  centerStateBody: {
    color: "#486581",
    lineHeight: 21,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  sectionEyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
  },
  grid: {
    gap: 12,
  },
});
