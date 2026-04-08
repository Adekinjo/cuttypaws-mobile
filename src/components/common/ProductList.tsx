import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AuthService from "../../api/AuthService";
import ProductService from "../../api/ProductService";
import WishlistService from "../../api/WishlistService";
import { Banner, EmptyState } from "../admin/AdminCommon";
import LoadingSpinner from "./LoadingSpinner";

type Product = {
  id: string;
  productId?: string | number;
  name: string;
  description?: string;
  oldPrice?: number;
  newPrice?: number;
  imageUrls?: string[];
  imageUrl?: string;
  category?: string | { name?: string };
  subCategory?: string | { name?: string };
};

const getProductId = (product: Product | any) =>
  String(product?.id ?? product?.productId ?? product?.product?.id ?? "");

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);

export default function ProductList({
  products,
  showFeaturedBadge = false,
  cartItems = [],
  onAddToCart,
  onIncrement,
  onDecrement,
  onOpenProduct,
  onNavigate,
}: {
  products: Product[];
  showFeaturedBadge?: boolean;
  cartItems?: Array<{ id: string; quantity: number }>;
  onAddToCart?: (product: any) => void;
  onIncrement?: (product: any) => void;
  onDecrement?: (product: any) => void;
  onOpenProduct?: (product: any) => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        setLoading(true);
        const [wishlistData, likesData] = await Promise.all([
          WishlistService.getWishlist(),
          ProductService.getAllLikes(),
        ]);

        if (!mounted) return;

        setWishlist(Array.isArray(wishlistData) ? wishlistData : []);
        const likesMap = (likesData?.productList || []).reduce(
          (acc: Record<string, number>, product: any) => {
            acc[product.id] = product.likes || 0;
            return acc;
          },
          {}
        );
        setLikes(likesMap);
      } catch (error: any) {
        if (!mounted) return;
        setMessage(error?.message || "Unable to load product interactions.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleWishlist = async (productId: string) => {
    const isAuthenticated = await AuthService.isAuthenticated();
    if (!isAuthenticated) {
      setMessage("Please login to manage your wishlist.");
      return;
    }

    try {
      const isInWishlist = wishlist.some((item) => item.productId === productId);
      if (isInWishlist) {
        await WishlistService.removeFromWishlist(productId);
        setWishlist((prev) => prev.filter((item) => item.productId !== productId));
      } else {
        await WishlistService.addToWishlist(productId);
        setWishlist(await WishlistService.getWishlist());
      }
    } catch (error: any) {
      setMessage(error?.message || "Wishlist update failed.");
    }
  };

  const handleLike = async (productId: string) => {
    try {
      await ProductService.likeProduct(productId);
      setLikes((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
    } catch (error: any) {
      setMessage(error?.message || "Failed to like the product.");
    }
  };

  const openProduct = (product: Product) => {
    const resolvedProductId = getProductId(product);
    console.log("[ProductList] openProduct", {
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

  if (loading) {
    return <LoadingSpinner label="Loading products..." subtitle="Preparing product cards and interactions" />;
  }

  if (!products.length) {
    return <EmptyState label="No products found." />;
  }

  return (
    <View style={styles.container}>
      <Banner message={message} tone="error" />

      <ScrollView contentContainerStyle={styles.grid}>
        {products.map((product) => {
          const resolvedProductId = getProductId(product);
          const cartItem = cartItems.find(
            (item) => String(item.id) === resolvedProductId
          );
          const isInWishlist = wishlist.some(
            (item) => String(item.productId) === resolvedProductId
          );
          const imageUrl = product.imageUrls?.[0] || product.imageUrl;
          const discount =
            product.oldPrice && product.newPrice && product.oldPrice > product.newPrice
              ? Math.round(((product.oldPrice - product.newPrice) / product.oldPrice) * 100)
              : 0;
          return (
            <View key={resolvedProductId || product.name} style={styles.card}>
              <View style={styles.cardTopBar}>
                {discount > 0 ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>-{discount}%</Text>
                  </View>
                ) : (
                  <View />
                )}
                <Pressable onPress={() => toggleWishlist(resolvedProductId)} style={styles.iconButton}>
                  <Feather
                    name="bookmark"
                    size={16}
                    color={isInWishlist ? "#B45309" : "#94A3B8"}
                  />
                </Pressable>
              </View>

              {showFeaturedBadge ? (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>Featured</Text>
                </View>
              ) : null}

              <Pressable onPress={() => openProduct(product)}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <MaterialCommunityIcons name="paw-outline" size={28} color="#94A3B8" />
                  </View>
                )}
              </Pressable>

              <Pressable
                style={styles.textBlock}
                onPress={() => openProduct(product)}
              >
                <Text numberOfLines={1} style={styles.name}>
                  {product.name}
                </Text>
                <Text numberOfLines={1} style={styles.meta}>
                  {product.description?.trim() || "Marketplace item"}
                </Text>
              </Pressable>

              <View style={styles.priceBlock}>
                {product.oldPrice ? (
                  <Text style={styles.oldPrice}>{formatMoney(Number(product.oldPrice))}</Text>
                ) : null}
                <Text style={styles.newPrice}>{formatMoney(Number(product.newPrice || 0))}</Text>
              </View>

              {cartItem ? (
                <View style={styles.qtyRow}>
                  <Pressable onPress={() => onDecrement?.(product)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>-</Text>
                  </Pressable>
                  <View style={styles.qtyValueWrap}>
                    <Text style={styles.qtyValue}>{cartItem.quantity}</Text>
                  </View>
                  <Pressable onPress={() => onIncrement?.(product)} style={styles.qtyButton}>
                    <Text style={styles.qtyButtonText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => onAddToCart?.(product)} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </Pressable>
              )}

              <View style={styles.bottomRow}>
                <Pressable onPress={() => handleLike(resolvedProductId)} style={styles.likeButton}>
                  <Feather
                    name="heart"
                    size={15}
                    color={likes[resolvedProductId] ? "#DC2626" : "#94A3B8"}
                  />
                  <Text style={styles.likeText}>{likes[resolvedProductId] || 0}</Text>
                </Pressable>

                <Pressable onPress={() => openProduct(product)} style={styles.viewLink}>
                  <Text style={styles.viewLinkText}>View</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  discountBadgeText: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 11,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  featuredBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  featuredBadgeText: {
    color: "#92400E",
    fontWeight: "800",
    fontSize: 11,
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  textBlock: {
    gap: 3,
  },
  name: {
    fontWeight: "800",
    color: "#102A43",
    fontSize: 15,
  },
  meta: {
    color: "#64748B",
    fontSize: 12,
  },
  priceBlock: {
    gap: 2,
  },
  oldPrice: {
    color: "#DC2626",
    textDecorationLine: "line-through",
    fontSize: 12,
  },
  newPrice: {
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
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  likeButton: {
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
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
  },
  viewLinkText: {
    color: "#1D4ED8",
    fontWeight: "800",
    fontSize: 12,
  },
});
