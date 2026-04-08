import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import CategoryService from "../../api/CategoryService";
import ProductService from "../../api/ProductService";
import WishlistService from "../../api/WishlistService";
import Footer from "../common/Footer";
import { useCart } from "../context/CartContext";

type ProductItem = {
  id: string;
  productId?: string | number;
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

const getProductId = (product: ProductItem | any) =>
  String(product?.id ?? product?.productId ?? product?.product?.id ?? "");

type SortValue = "featured" | "price-low" | "price-high";

const FILTER_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Featured", value: "featured" },
  { label: "Low to High", value: "price-low" },
  { label: "High to Low", value: "price-high" },
];

const formatMoney = (value?: number) => `$${Number(value || 0).toFixed(2)}`;

export default function ProductSubCategoryPage({
  subCategoryId,
  onNavigate,
  onOpenProduct,
}: {
  subCategoryId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenProduct?: (product: ProductItem) => void;
}) {
  const { cart, dispatch } = useCart();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | "info">("info");
  const [sortValue, setSortValue] = useState<SortValue>("featured");

  const fetchWishlist = async () => {
    try {
      const data = await WishlistService.getWishlist();
      setWishlist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
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
    } catch (error) {
      console.error("Failed to fetch likes:", error);
    }
  };

  const fetchSubCategoryAndProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setMessage("");

      const subCategoryResponse = await CategoryService.getSubCategoryById(subCategoryId);
      if (subCategoryResponse?.status === 200 && subCategoryResponse?.subCategory) {
        setSubCategoryName(subCategoryResponse.subCategory.name || "");
      } else {
        setProducts([]);
        setMessageTone("error");
        setMessage("Subcategory not found.");
        return;
      }

      const productsResponse = await ProductService.getAllProductsBySubCategory(subCategoryId);
      if (productsResponse?.status === 200 && Array.isArray(productsResponse?.productList)) {
        setProducts(productsResponse.productList);
        if (!productsResponse.productList.length) {
          setMessageTone("info");
          setMessage("No products found for this subcategory.");
        }
      } else {
        setProducts([]);
        setMessageTone("error");
        setMessage("No products found for this subcategory.");
      }

      await Promise.all([fetchWishlist(), fetchLikes()]);
    } catch (error: any) {
      setProducts([]);
      setMessageTone("error");
      setMessage(error?.response?.data?.message || error?.message || "Unable to fetch data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubCategoryAndProducts();
  }, [subCategoryId]);

  const sortedProducts = useMemo(() => {
    const next = [...products];

    if (sortValue === "price-low") {
      next.sort((a, b) => Number(a.newPrice || 0) - Number(b.newPrice || 0));
    } else if (sortValue === "price-high") {
      next.sort((a, b) => Number(b.newPrice || 0) - Number(a.newPrice || 0));
    }

    return next;
  }, [products, sortValue]);

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
      const exists = wishlist.some((item) => String(item.productId) === String(productId));
      if (exists) {
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

  const openProduct = (product: ProductItem) => {
    const resolvedProductId = getProductId(product);
    console.log("[ProductSubCategory] openProduct", {
      resolvedProductId,
      rawId: product?.id,
      rawProductId: product?.productId,
      name: product?.name,
      keys: Object.keys(product || {}),
    });

    if (onOpenProduct) {
      onOpenProduct({ ...product, id: resolvedProductId });
      return;
    }

    if (resolvedProductId) {
      onNavigate?.("product-details", { productId: resolvedProductId });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSubCategoryAndProducts(true)}
            tintColor="#0F766E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>{subCategoryName || "Subcategory"}</Text>
          <Text style={styles.headerSubtitle}>
            Browse products in this collection.
          </Text>
        </View>

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

        <View style={styles.controlsBlock}>
          <Text style={styles.filterTitle}>Sort</Text>
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.filterChip,
                  sortValue === option.value && styles.filterChipActive,
                ]}
                onPress={() => setSortValue(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sortValue === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <Text style={styles.centerStateTitle}>Loading subcategory products...</Text>
            <Text style={styles.centerStateBody}>Preparing products, likes, and wishlist state.</Text>
          </View>
        ) : null}

        {!loading && !sortedProducts.length ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons
                name="shopping-search-outline"
                size={30}
                color="#0F766E"
              />
            </View>
            <Text style={styles.emptyTitle}>{subCategoryName || "No products found"}</Text>
            <Text style={styles.emptyBody}>
              This subcategory does not have visible items yet. Try refreshing or browse a
              different collection.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => onNavigate?.("home")}>
              <Text style={styles.primaryButtonText}>Browse Home</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && sortedProducts.length ? (
          <View style={styles.productsBlock}>
            <View style={styles.grid}>
              {sortedProducts.map((product) => {
                const resolvedProductId = getProductId(product);
                const cartItem = cart.find((item) => String(item.id) === resolvedProductId);
                const inWishlist = wishlist.some(
                  (item) => String(item.productId) === resolvedProductId
                );
                const discount =
                  Number(product.oldPrice || 0) > Number(product.newPrice || 0)
                    ? Math.round(
                        ((Number(product.oldPrice || 0) - Number(product.newPrice || 0)) /
                          Number(product.oldPrice || 1)) *
                          100
                      )
                    : 0;
                const imageUrl = product.imageUrls?.[0] || product.imageUrl;

                return (
                  <View key={resolvedProductId || product.name} style={styles.productCard}>
                    <View style={styles.productCardTop}>
                      {discount > 0 ? (
                        <View style={styles.discountTag}>
                          <Text style={styles.discountTagText}>-{discount}%</Text>
                        </View>
                      ) : (
                        <View />
                      )}

                      <Pressable
                        onPress={() => handleToggleWishlist(resolvedProductId)}
                        style={styles.iconButton}
                      >
                        <Feather
                          name="bookmark"
                          size={16}
                          color={inWishlist ? "#B45309" : "#94A3B8"}
                        />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => openProduct(product)}
                      style={styles.imageShell}
                    >
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.productImage} />
                      ) : (
                        <View style={[styles.productImage, styles.imageFallback]}>
                          <MaterialCommunityIcons
                            name="paw-outline"
                            size={28}
                            color="#94A3B8"
                          />
                        </View>
                      )}
                    </Pressable>

                    <Text numberOfLines={1} style={styles.productName}>
                      {product.name || "Product"}
                    </Text>

                    {Number(product.oldPrice || 0) > 0 ? (
                      <Text style={styles.productOldPrice}>{formatMoney(product.oldPrice)}</Text>
                    ) : null}

                    <Text style={styles.productPrice}>{formatMoney(product.newPrice)}</Text>

                    {cartItem ? (
                      <View style={styles.qtyRow}>
                        <Pressable
                          onPress={() => handleDecrement(product)}
                          style={styles.qtyButton}
                        >
                          <Text style={styles.qtyButtonText}>-</Text>
                        </Pressable>
                        <View style={styles.qtyValueWrap}>
                          <Text style={styles.qtyValue}>{cartItem.quantity}</Text>
                        </View>
                        <Pressable
                          onPress={() => handleIncrement(product)}
                          style={styles.qtyButton}
                        >
                          <Text style={styles.qtyButtonText}>+</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.addButton}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Text style={styles.addButtonText}>Add to Cart</Text>
                      </Pressable>
                    )}

                    <View style={styles.cardFooter}>
                      <Pressable
                        style={styles.likeRow}
                        onPress={() => handleLike(resolvedProductId)}
                      >
                        <Feather
                          name="heart"
                          size={15}
                          color={likes[resolvedProductId] ? "#DC2626" : "#94A3B8"}
                        />
                        <Text style={styles.likeText}>{likes[resolvedProductId] || 0}</Text>
                      </Pressable>

                      <Pressable onPress={() => openProduct(product)}>
                        <Text style={styles.viewLink}>View</Text>
                      </Pressable>
                    </View>
                  </View>
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
    gap: 14,
    backgroundColor: "#F5FAF8",
  },
  headerBlock: {
    gap: 4,
    paddingTop: 4,
  },
  headerTitle: {
    color: "#102A43",
    fontSize: 28,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#64748B",
    lineHeight: 20,
    fontSize: 14,
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
  controlsBlock: {
    gap: 10,
  },
  filterTitle: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "900",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D9E2EC",
  },
  filterChipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  filterChipText: {
    color: "#334E68",
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
  emptyCard: {
    alignItems: "center",
    gap: 12,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  emptyTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyBody: {
    color: "#486581",
    lineHeight: 22,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productsBlock: {
    gap: 12,
  },
  productCard: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  productCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  discountTagText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "900",
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  imageShell: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  productImage: {
    width: "100%",
    height: 140,
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  productName: {
    color: "#102A43",
    fontSize: 15,
    fontWeight: "800",
  },
  productOldPrice: {
    color: "#DC2626",
    textDecorationLine: "line-through",
    fontSize: 12,
  },
  productPrice: {
    color: "#0F766E",
    fontSize: 18,
    fontWeight: "900",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  qtyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
  qtyValueWrap: {
    minWidth: 34,
    alignItems: "center",
  },
  qtyValue: {
    color: "#102A43",
    fontWeight: "800",
  },
  addButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#0F766E",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likeText: {
    color: "#486581",
    fontSize: 12,
    fontWeight: "700",
  },
  viewLink: {
    color: "#0F766E",
    fontWeight: "900",
  },
  primaryButton: {
    minWidth: 160,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
