import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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

import keyValueStorage from "../../utils/keyValueStorage";

const PAYMENT_SUCCESS_KEY = "paymentSuccessOrder";
const PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop";

type SuccessItem = {
  id?: string;
  name?: string;
  imageUrl?: string | null;
  quantity?: number;
  price?: number | string;
  size?: string | null;
  color?: string | null;
};

type SuccessOrder = {
  orderId?: string | number | null;
  reference?: string;
  paymentId?: string;
  totalPrice?: number;
  items?: SuccessItem[];
};

export default function PaymentSuccessPage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<SuccessOrder | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadSuccessOrder = async () => {
      try {
        const raw = await keyValueStorage.getItem(PAYMENT_SUCCESS_KEY);
        const parsed = raw ? (JSON.parse(raw) as SuccessOrder) : null;

        if (!parsed?.orderId) {
          throw new Error("Order details were not found for this payment.");
        }

        if (!active) return;
        setOrder(parsed);
        setMessage("Order created successfully.");
      } catch (error: any) {
        if (!active) return;
        setMessage(error?.message || "Unable to load order details.");
        setOrder(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSuccessOrder();

    return () => {
      active = false;
    };
  }, []);

  const itemCount = useMemo(
    () =>
      (order?.items || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      ),
    [order]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading order summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={[styles.statusIconWrap, styles.statusIconFailed]}>
            <Feather name="alert-circle" size={30} color="#991B1B" />
          </View>
          <Text style={styles.centerTitle}>Payment successful</Text>
          <Text style={styles.centerCopy}>
            {message || "We could not load the order summary for this payment."}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => onNavigate?.("order-history")}
          >
            <Text style={styles.primaryButtonText}>View Your Orders</Text>
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
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons
              name="receipt-text-check-outline"
              size={16}
              color="#0F172A"
            />
            <Text style={styles.heroBadgeText}>Payment success</Text>
          </View>

          <View style={styles.heroTitleRow}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={28}
              color="#CCFBF1"
            />
            <Text style={styles.heroTitle}>Order created successfully</Text>
          </View>

          <Text style={styles.heroSubtitle}>
            Your payment was completed and your order has been created successfully.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.statusIconWrap, styles.statusIconSuccess]}>
            <Feather name="check" size={30} color="#065F46" />
          </View>

          <Text style={styles.summaryTitle}>Order confirmed</Text>
          <Text style={styles.summaryMessage}>
            Keep this reference for support and tracking if needed.
          </Text>

          <View style={styles.metaGrid}>
            <MetaCard
              label="Order ID"
              value={String(order.orderId || "Unavailable")}
              icon="shopping-bag"
            />
            <MetaCard
              label="Reference"
              value={order.reference || "Unavailable"}
              icon="hash"
            />
            <MetaCard
              label="Items"
              value={String(itemCount || 0)}
              icon="package"
            />
            <MetaCard
              label="Total"
              value={formatCurrency(Number(order.totalPrice || 0))}
              icon="dollar-sign"
            />
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Order details</Text>

          {(order.items || []).map((item, index) => (
            <View key={`${item.id || item.name || "item"}-${index}`} style={styles.itemRow}>
              <Image
                source={{ uri: item.imageUrl || PRODUCT_FALLBACK }}
                style={styles.itemImage}
              />

              <View style={styles.itemCopy}>
                <Text style={styles.itemName}>{item.name || "Product"}</Text>
                <Text style={styles.itemMeta}>
                  Qty: {Number(item.quantity || 0)} • {formatCurrency(Number(item.price || 0))}
                </Text>
                {item.size || item.color ? (
                  <Text style={styles.itemMeta}>
                    {item.size ? `Size: ${item.size}` : ""}
                    {item.size && item.color ? " • " : ""}
                    {item.color ? `Color: ${item.color}` : ""}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionColumn}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => onNavigate?.("home")}
          >
            <Text style={styles.primaryButtonText}>Go to Home Page</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => onNavigate?.("order-history")}
          >
            <Text style={styles.secondaryButtonText}>View Your Orders</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.metaCard}>
      <View style={styles.metaTop}>
        <Feather name={icon} size={14} color="#1D4ED8" />
        <Text style={styles.metaLabel}>{label}</Text>
      </View>
      <Text style={styles.metaValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  centerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  centerCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  heroCard: {
    borderRadius: 28,
    backgroundColor: "#0F172A",
    padding: 22,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroTitleRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroTitle: {
    flex: 1,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#CBD5E1",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  statusIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconSuccess: {
    backgroundColor: "#DCFCE7",
  },
  statusIconFailed: {
    backgroundColor: "#FEE2E2",
  },
  summaryTitle: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    color: "#166534",
    textAlign: "center",
  },
  summaryMessage: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    textAlign: "center",
  },
  metaGrid: {
    marginTop: 18,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaCard: {
    width: "47%",
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailsCard: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  itemRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  itemCopy: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: "#0F172A",
  },
  itemMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  actionColumn: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "800",
  },
});
