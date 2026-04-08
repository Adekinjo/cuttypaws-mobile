import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AuthService from "../../api/AuthService";
import DealService from "../../api/DealService";
import WishlistService from "../../api/WishlistService";
import { useCart } from "../context/CartContext";
import { Banner, EmptyState, LoadingState } from "../admin/AdminCommon";

type ProductItem = {
  id: string;
  name: string;
  stock?: number;
  oldPrice?: number;
  newPrice?: number;
  thumbnailImageUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  category?: string | { name?: string };
  subCategory?: string | { name?: string };
};

type DealItem = {
  id: string;
  discountPercentage?: number;
  endDate?: string;
  product?: ProductItem | null;
};

const formatMoney = (value: number) => `₦${Number(value || 0).toLocaleString()}`;

const getTimeLeft = (endDate?: string) => {
  if (!endDate) return null;
  const difference = new Date(endDate).getTime() - Date.now();

  if (difference <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    expired: false,
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export default function Deal({
  onOpenProduct,
  onContinueShopping,
}: {
  onOpenProduct?: (product: ProductItem) => void;
  onContinueShopping?: () => void;
}) {
  const { cart, addItem, incrementItem, decrementItem, removeItem } = useCart();
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [dealsResponse, wishlistResponse] = await Promise.all([
          DealService.getActiveDeals(),
          WishlistService.getWishlist(),
        ]);

        if (!mounted) return;

        setDeals(Array.isArray(dealsResponse?.dealList) ? dealsResponse.dealList : []);
        setWishlist(Array.isArray(wishlistResponse) ? wishlistResponse : []);
      } catch (err: any) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load deals. Please try again later."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const activeDeals = useMemo(
    () =>
      deals.filter(
        (deal) => deal?.product && Number(deal?.discountPercentage || 0) > 0
      ),
    [deals]
  );

  const summary = useMemo(() => {
    const activeCount = activeDeals.filter((deal) => !getTimeLeft(deal.endDate)?.expired).length;
    const averageDiscount = activeDeals.length
      ? activeDeals.reduce((sum, deal) => sum + Number(deal.discountPercentage || 0), 0) /
        activeDeals.length
      : 0;
    const savings = activeDeals.reduce((sum, deal) => {
      const product = deal.product;
      if (!product) return sum;
      const oldPrice = Number(product.oldPrice || 0);
      const newPrice = Number(product.newPrice || 0);
      if (oldPrice <= 0 || oldPrice <= newPrice) return sum;
      return sum + (oldPrice - newPrice);
    }, 0);

    return {
      total: activeDeals.length,
      activeCount,
      averageDiscount,
      savings,
    };
  }, [activeDeals, now]);

  const toggleWishlist = async (productId: string) => {
    const authenticated = await AuthService.isAuthenticated();
    if (!authenticated) {
      setMessage("Please login to manage your wishlist.");
      return;
    }

    try {
      const isInWishlist = wishlist.some((item) => item.productId === productId);
      if (isInWishlist) {
        await WishlistService.removeFromWishlist(productId);
        setWishlist((prev) => prev.filter((item) => item.productId !== productId));
        setMessage("Removed from wishlist.");
      } else {
        await WishlistService.addToWishlist(productId);
        setWishlist(await WishlistService.getWishlist());
        setMessage("Added to wishlist.");
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || err?.message || "Wishlist update failed.");
    }
  };

  const getProductQuantity = (productId: string) =>
    cart.find((item) => item.id === productId)?.quantity || 0;

  const handleAddToCart = (product: ProductItem) => {
    addItem({
      ...product,
      quantity: 1,
      size: "",
      color: "",
    });
    setMessage(`${product.name} added to cart.`);
  };

  const handleIncrement = (product: ProductItem) => {
    incrementItem({ id: product.id });
  };

  const handleDecrement = (product: ProductItem) => {
    const quantity = getProductQuantity(product.id);
    if (quantity <= 1) {
      removeItem({ id: product.id });
      return;
    }
    decrementItem({ id: product.id });
  };

  if (loading) {
    return <LoadingState label="Loading hot deals..." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner message={error || message} tone={error ? "error" : "success"} />

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.firePill}>
            <Text style={styles.firePillText}>Flash Sale</Text>
          </View>
          <Text style={styles.heroTag}>Daily deal board</Text>
        </View>

        <Text style={styles.heroTitle}>Today&apos;s best deals for pet parents</Text>
        <Text style={styles.heroBody}>
          Limited-time product drops, faster savings, and clean mobile cart controls without the
          noisy marketplace clutter from the web version.
        </Text>

        <View style={styles.statsRow}>
          <StatCard label="All Deals" value={String(summary.total)} accent="#FFD166" />
          <StatCard
            label="Live Now"
            value={String(summary.activeCount)}
            accent="#7EE787"
          />
          <StatCard
            label="Avg. Discount"
            value={`${Math.round(summary.averageDiscount)}%`}
            accent="#FF9F1C"
          />
          <StatCard
            label="Potential Savings"
            value={formatMoney(summary.savings)}
            accent="#90CDF4"
          />
        </View>
      </View>

      {!error && activeDeals.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState label="No active deals right now. Check back later for fresh offers." />
          <Pressable style={styles.secondaryAction} onPress={onContinueShopping}>
            <Text style={styles.secondaryActionText}>Continue Shopping</Text>
          </Pressable>
        </View>
      ) : null}

      {!error && activeDeals.length > 0 ? (
        <View style={styles.list}>
          {activeDeals.map((deal) => {
            const product = deal.product;
            if (!product) return null;

            const quantity = getProductQuantity(product.id);
            const isInWishlist = wishlist.some((item) => item.productId === product.id);
            const imageUrl =
              product.thumbnailImageUrl || product.imageUrls?.[0] || product.imageUrl;
            const stock = Number(product.stock || 0);
            const outOfStock = stock <= 0;
            const timeLeft = getTimeLeft(deal.endDate);
            const categoryName =
              typeof product.category === "string"
                ? product.category
                : product.category?.name || "Pet essentials";
            const subCategoryName =
              typeof product.subCategory === "string"
                ? product.subCategory
                : product.subCategory?.name;

            return (
              <View key={deal.id} style={[styles.card, outOfStock && styles.cardMuted]}>
                <View style={styles.cardHeader}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      {Math.round(Number(deal.discountPercentage || 0))}% OFF
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => toggleWishlist(product.id)}
                    style={styles.wishlistButton}
                  >
                    <Text
                      style={[
                        styles.wishlistIcon,
                        isInWishlist && styles.wishlistIconActive,
                      ]}
                    >
                      ♥
                    </Text>
                  </Pressable>
                </View>

                <Pressable onPress={() => onOpenProduct?.(product)} style={styles.imageWrap}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Text style={styles.imagePlaceholderText}>🐾</Text>
                    </View>
                  )}

                  {outOfStock ? (
                    <View style={styles.stockOverlay}>
                      <Text style={styles.stockOverlayText}>Out of Stock</Text>
                    </View>
                  ) : null}
                </Pressable>

                <View style={styles.content}>
                  <Text numberOfLines={1} style={styles.productName}>
                    {product.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.productMeta}>
                    {[categoryName, subCategoryName].filter(Boolean).join(" • ")}
                  </Text>

                  <View style={styles.priceBlock}>
                    {Number(product.oldPrice || 0) > Number(product.newPrice || 0) ? (
                      <Text style={styles.oldPrice}>{formatMoney(Number(product.oldPrice || 0))}</Text>
                    ) : null}
                    <Text style={styles.newPrice}>{formatMoney(Number(product.newPrice || 0))}</Text>
                  </View>

                  <CountdownBadge timeLeft={timeLeft} />

                  {quantity === 0 ? (
                    <Pressable
                      style={[styles.cartButton, outOfStock && styles.cartButtonDisabled]}
                      disabled={outOfStock}
                      onPress={() => handleAddToCart(product)}
                    >
                      <Text style={styles.cartButtonText}>Add to Cart</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.quantityRow}>
                      <Pressable
                        onPress={() => handleDecrement(product)}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>
                          {quantity === 1 ? "🗑" : "−"}
                        </Text>
                      </Pressable>

                      <View style={styles.quantityValueWrap}>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <Text style={styles.quantityCaption}>in cart</Text>
                      </View>

                      <Pressable
                        onPress={() => handleIncrement(product)}
                        disabled={stock <= quantity}
                        style={[
                          styles.quantityButton,
                          stock <= quantity && styles.quantityButtonDisabled,
                        ]}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.footerRow}>
                    <View style={styles.stockPill}>
                      <Text style={styles.stockPillText}>
                        {outOfStock ? "Unavailable" : `${stock} left`}
                      </Text>
                    </View>

                    <Pressable onPress={() => onOpenProduct?.(product)}>
                      <Text style={styles.viewLink}>View Details</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

function CountdownBadge({
  timeLeft,
}: {
  timeLeft:
    | {
        expired: boolean;
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
      }
    | null;
}) {
  if (!timeLeft) return null;

  if (timeLeft.expired) {
    return (
      <View style={[styles.countdownWrap, styles.countdownExpired]}>
        <Text style={styles.countdownExpiredText}>Expired</Text>
      </View>
    );
  }

  return (
    <View style={styles.countdownWrap}>
      <Text style={styles.countdownLabel}>Ends in</Text>
      <View style={styles.countdownRow}>
        <TimeUnit value={timeLeft.days} label="d" />
        <TimeUnit value={timeLeft.hours} label="h" />
        <TimeUnit value={timeLeft.minutes} label="m" />
        <TimeUnit value={timeLeft.seconds} label="s" />
      </View>
    </View>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.timeUnit}>
      <Text style={styles.timeUnitValue}>{String(value).padStart(2, "0")}</Text>
      <Text style={styles.timeUnitLabel}>{label}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: "#F3F6FB",
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    gap: 18,
    backgroundColor: "#7F1D1D",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  firePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  firePillText: {
    color: "#FEE2E2",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTag: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#FFF7ED",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
  },
  heroBody: {
    color: "#FECACA",
    lineHeight: 22,
    fontSize: 15,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    minWidth: 140,
    flex: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statAccent: {
    width: 30,
    height: 4,
    borderRadius: 999,
  },
  statLabel: {
    color: "#FECACA",
    fontSize: 12,
    fontWeight: "800",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  emptyWrap: {
    gap: 12,
  },
  secondaryAction: {
    alignSelf: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#102A43",
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#102A43",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardMuted: {
    opacity: 0.88,
  },
  cardHeader: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#DC2626",
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  wishlistIcon: {
    color: "#64748B",
    fontSize: 20,
    fontWeight: "800",
  },
  wishlistIconActive: {
    color: "#DC2626",
  },
  imageWrap: {
    backgroundColor: "#FFF7ED",
  },
  image: {
    width: "100%",
    height: 220,
    resizeMode: "contain",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  stockOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.38)",
  },
  stockOverlayText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    backgroundColor: "rgba(15,23,42,0.75)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  productName: {
    color: "#102A43",
    fontSize: 18,
    fontWeight: "800",
  },
  productMeta: {
    color: "#64748B",
    fontSize: 13,
  },
  priceBlock: {
    gap: 4,
  },
  oldPrice: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "700",
  },
  newPrice: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
  },
  countdownWrap: {
    borderRadius: 18,
    padding: 12,
    gap: 8,
    backgroundColor: "#FFF1F2",
  },
  countdownExpired: {
    backgroundColor: "#FEE2E2",
    alignItems: "center",
  },
  countdownExpiredText: {
    color: "#B91C1C",
    fontWeight: "800",
  },
  countdownLabel: {
    color: "#9F1239",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  countdownRow: {
    flexDirection: "row",
    gap: 8,
  },
  timeUnit: {
    minWidth: 50,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: "#1E293B",
  },
  timeUnitValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  timeUnitLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
  cartButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FBBF24",
  },
  cartButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  cartButtonText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 15,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  quantityButtonDisabled: {
    opacity: 0.45,
  },
  quantityButtonText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  quantityValueWrap: {
    alignItems: "center",
    gap: 2,
  },
  quantityValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
  },
  quantityCaption: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  stockPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E0F2FE",
  },
  stockPillText: {
    color: "#075985",
    fontSize: 12,
    fontWeight: "800",
  },
  viewLink: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
});
