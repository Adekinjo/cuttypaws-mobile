import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OrderService from "../../api/OrderService";

type Address = {
  street?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
};

type UserInfo = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: Address;
};

type OrderItem = {
  id?: string | number;
  productId?: string | number;
  productName?: string;
  productImageUrl?: string;
  productSku?: string;
  selectedColor?: string;
  selectedSize?: string;
  quantity?: number;
  price?: number | string;
  status?: string;
  createdAt?: string;
  user?: UserInfo;
};

const PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop";

const statusConfig: Record<
  string,
  {
    color: string;
    label: string;
  }
> = {
  PENDING: { color: "#F59E0B", label: "Pending" },
  CONFIRMED: { color: "#3B82F6", label: "Confirmed" },
  SHIPPED: { color: "#8B5CF6", label: "Shipped" },
  DELIVERED: { color: "#22C55E", label: "Delivered" },
  CANCELLED: { color: "#EF4444", label: "Cancelled" },
  RETURNED: { color: "#6366F1", label: "Returned" },
  UNKNOWN: { color: "#64748B", label: "Unknown" },
};

export default function OrderDetails({
  itemId,
  onNavigate,
}: {
  itemId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setMessage("");

        const response = await OrderService.getOrderItemById(itemId);
        const item =
          response?.orderItem ||
          response?.data?.orderItem ||
          response?.orderItemList?.[0] ||
          response?.data?.orderItemList?.[0] ||
          response?.data?.[0] ||
          null;

        if (!item) {
          throw new Error("No data received from the API");
        }

        if (!mounted) return;
        setOrderItem(item);
      } catch (error: any) {
        if (!mounted) return;
        setMessage(error?.response?.data?.message || error?.message || "Failed to load order details");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (itemId) fetchOrderDetails();

    return () => {
      mounted = false;
    };
  }, [itemId]);

  const normalizedStatus = String(orderItem?.status || "UNKNOWN").toUpperCase();
  const currentStatus = statusConfig[normalizedStatus] || statusConfig.UNKNOWN;
  const totalPrice = useMemo(() => {
    return (Number(orderItem?.price) || 0) * (Number(orderItem?.quantity) || 0);
  }, [orderItem?.price, orderItem?.quantity]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderItem) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={[styles.stateIcon, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-circle" size={22} color="#DC2626" />
          </View>
          <Text style={styles.centerTitle}>Order details unavailable</Text>
          <Text style={styles.centerCopy}>
            {message || "Failed to load order details. Please try again later."}
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => onNavigate?.("back")}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <Text style={styles.headerSubtitle}>Review product, shipping, and support info</Text>
          </View>
        </View>

        {message ? (
          <View style={styles.banner}>
            <Feather name="info" size={16} color="#991B1B" />
            <Text style={styles.bannerText}>{message}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Order #{orderItem.id}</Text>
              <Text style={styles.heroTitle}>{orderItem.productName || "Product"}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: `${currentStatus.color}20` }]}>
              <Feather name="package" size={12} color={currentStatus.color} />
              <Text style={[styles.statusPillText, { color: currentStatus.color }]}>
                {currentStatus.label}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDate}>{formatDate(orderItem.createdAt)}</Text>

          <View style={styles.heroMetrics}>
            <HeroMetric
              label="Quantity"
              value={String(orderItem.quantity ?? "—")}
              tint="#FFF7ED"
              icon={<Ionicons name="cube-outline" size={16} color="#EA580C" />}
            />
            <HeroMetric
              label="Total"
              value={formatCurrency(totalPrice)}
              tint="#EFF6FF"
              icon={<Feather name="dollar-sign" size={16} color="#2563EB" />}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Feather name="box" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Product Details</Text>
          </View>

          <View style={styles.productRow}>
            <Image
              source={{ uri: orderItem.productImageUrl || PRODUCT_FALLBACK }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{orderItem.productName || "Unnamed product"}</Text>
              <InfoLine icon="pricetag-outline" label={`SKU: ${orderItem.productSku || "N/A"}`} />
              <InfoLine
                icon="color-palette-outline"
                label={`Color: ${orderItem.selectedColor || "N/A"}`}
              />
              <InfoLine icon="resize-outline" label={`Size: ${orderItem.selectedSize || "N/A"}`} />
              <InfoLine
                icon="cash-outline"
                label={`Price: ${formatCurrency(totalPrice)}`}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Status Timeline</Text>
          </View>

          <View style={styles.timelineList}>
            {Object.entries(statusConfig).map(([statusKey, config]) => {
              const isActive = normalizedStatus === statusKey;
              return (
                <View
                  key={statusKey}
                  style={[styles.timelineRow, isActive && styles.timelineRowActive]}
                >
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        { backgroundColor: config.color },
                      ]}
                    >
                      <Text style={styles.timelineIconText}>{config.label[0]}</Text>
                    </View>
                    <Text style={styles.timelineLabel}>{config.label}</Text>
                  </View>

                  {isActive ? (
                    <Text style={styles.timelineDate}>{formatShortDate(orderItem.createdAt)}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Customer Details</Text>
          </View>

          <View style={styles.infoStack}>
            <InfoLine icon="person-outline" label={orderItem.user?.name || "N/A"} />
            <InfoLine icon="mail-outline" label={orderItem.user?.email || "N/A"} />
            <InfoLine icon="call-outline" label={orderItem.user?.phoneNumber || "N/A"} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Feather name="truck" size={18} color="#0F172A" />
            <Text style={styles.sectionTitle}>Shipping Details</Text>
          </View>

          {orderItem.user?.address ? (
            <View style={styles.infoStack}>
              <InfoLine
                icon="location-outline"
                label={orderItem.user.address.street || "N/A"}
              />
              <InfoLine
                icon="business-outline"
                label={`${orderItem.user.address.city || "N/A"}, ${
                  orderItem.user.address.state || "N/A"
                }`}
              />
              <InfoLine
                icon="navigate-outline"
                label={`${orderItem.user.address.zipcode || "N/A"}, ${
                  orderItem.user.address.country || "N/A"
                }`}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>No shipping address provided.</Text>
          )}
        </View>

        <View style={styles.supportCard}>
          <View style={styles.supportIconWrap}>
            <MaterialCommunityIcons name="headset" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>Need help with this order?</Text>
            <Text style={styles.supportText}>
              Reach customer support for delivery updates, changes, or issue resolution.
            </Text>
          </View>
          <Pressable
            style={styles.supportButton}
            onPress={() => onNavigate?.("customer-support")}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroMetric({
  label,
  value,
  tint,
  icon,
}: {
  label: string;
  value: string;
  tint: string;
  icon: ReactNode;
}) {
  return (
    <View style={[styles.heroMetricCard, { backgroundColor: tint }]}>
      <View style={styles.heroMetricIcon}>{icon}</View>
      <Text style={styles.heroMetricValue}>{value}</Text>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

function InfoLine({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.infoLine}>
      <Ionicons name={icon} size={16} color="#64748B" />
      <Text style={styles.infoLineText}>{label}</Text>
    </View>
  );
}

function formatCurrency(amount?: number | string) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(date?: string) {
  if (!date) return "Date unavailable";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Date unavailable";
  }
}

function formatShortDate(date?: string) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  centerCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: "#FEE2E2",
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#991B1B",
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    backgroundColor: "#0F172A",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#99F6E4",
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroDate: {
    marginTop: 8,
    fontSize: 13,
    color: "#CBD5E1",
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  heroMetricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
  },
  heroMetricIcon: {
    marginBottom: 8,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  heroMetricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
  },
  card: {
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  productRow: {
    gap: 14,
  },
  productImage: {
    width: "100%",
    height: 220,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  productInfo: {
    gap: 10,
  },
  productName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  timelineList: {
    gap: 10,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timelineRowActive: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timelineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineIconText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  timelineDate: {
    fontSize: 12,
    color: "#64748B",
  },
  infoStack: {
    gap: 12,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLineText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#0F172A",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },
  supportCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#0F766E",
  },
  supportIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  supportCopy: {
    gap: 6,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  supportText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#E6FFFB",
  },
  supportButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F766E",
  },
});
