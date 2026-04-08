import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import OrderService from "../../api/OrderService";
import {
  AdminButton,
  AdminCard,
  AdminScreen,
  Banner,
  EmptyState,
  LoadingState,
  Row,
} from "./AdminCommon";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

const STATUS_COLORS: Record<(typeof ORDER_STATUSES)[number], string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#3B82F6",
  SHIPPED: "#8B5CF6",
  DELIVERED: "#22C55E",
  CANCELLED: "#EF4444",
  RETURNED: "#6366F1",
};

const PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop";

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (value: number) => `₦${value.toFixed(2)}`;

const getContrastColor = (hexColor: string) => {
  const normalized = hexColor.replace("#", "");
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#0F172A" : "#FFFFFF";
};

const statusBadgeStyle = (status?: string) => {
  const color =
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#64748B";
  return {
    backgroundColor: color,
    color: getContrastColor(color),
  };
};

export default function AdminOrderDetails({
  itemId,
}: {
  itemId: string;
}) {
  const [orderItem, setOrderItem] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrderItemById(itemId);
      const item =
        response?.orderItem ||
        response?.orderItemList?.[0] ||
        response?.data?.orderItem ||
        response?.data?.orderItemList?.[0] ||
        null;

      setOrderItem(item);
      setSelectedStatus(item?.status || "");
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load order details."
      );
      setOrderItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [itemId]);

  const orderTotal = useMemo(() => {
    return (
      Number(orderItem?.price || 0) * Number(orderItem?.quantity || 0)
    );
  }, [orderItem?.price, orderItem?.quantity]);

  const handleSubmitStatusChange = async () => {
    if (!orderItem?.id || !selectedStatus || selectedStatus === orderItem?.status) {
      return;
    }

    try {
      setUpdating(true);
      setMessage("");
      await OrderService.updateOrderitemStatus(orderItem.id, selectedStatus);
      setMessage("Order status updated successfully!");
      await loadOrderDetails();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update status"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminScreen title="Order Details" subtitle={`Order item ${itemId}`}>
        <LoadingState label="Loading order details..." />
      </AdminScreen>
    );
  }

  if (!orderItem) {
    return (
      <AdminScreen title="Order Details" subtitle={`Order item ${itemId}`}>
        <Banner message={message} tone="error" />
        <EmptyState label="No order details found." />
      </AdminScreen>
    );
  }

  const badge = statusBadgeStyle(orderItem?.status);
  const productImage =
    orderItem?.productImageUrl ||
    orderItem?.product?.imageUrls?.[0] ||
    PRODUCT_FALLBACK;
  const address = orderItem?.user?.address || {};

  return (
    <AdminScreen
      title="Order Details"
      subtitle={`Admin control for order item ${itemId}`}
    >
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Admin Order Control</Text>
            <Text style={styles.heroTitle}>Review and update fulfillment</Text>
            <Text style={styles.heroBody}>
              Check the product setup, track the order journey, and update the status from one
              mobile-first admin view.
            </Text>
          </View>
          <View style={[styles.currentStatusBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.currentStatusText, { color: badge.color }]}>
              {orderItem?.status || "UNKNOWN"}
            </Text>
          </View>
        </View>

        <View style={styles.heroMetrics}>
          <MetricCard
            icon={<Feather name="shopping-bag" size={16} color="#1D4ED8" />}
            label="Order Item"
            value={String(orderItem?.id || "N/A")}
          />
          <MetricCard
            icon={<Feather name="hash" size={16} color="#0F766E" />}
            label="Quantity"
            value={String(orderItem?.quantity || 0)}
          />
          <MetricCard
            icon={<Ionicons name="cash-outline" size={16} color="#EA580C" />}
            label="Total"
            value={formatMoney(orderTotal)}
          />
        </View>
      </View>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="package-variant-closed" size={18} color="#0F172A" />
          <Text style={styles.sectionTitle}>Product Information</Text>
        </View>

        <View style={styles.productRow}>
          <Image source={{ uri: productImage }} style={styles.productImage} />
          <View style={styles.productCopy}>
            <Text style={styles.productName}>{orderItem?.productName || "Product item"}</Text>
            <Text style={styles.productSubtext}>Ordered on {formatDate(orderItem?.createdAt)}</Text>
          </View>
        </View>

        <Row label="Color" value={orderItem?.selectedColor || "N/A"} />
        <Row label="Size" value={orderItem?.selectedSize || "N/A"} />
        <Row label="Unit Price" value={formatMoney(Number(orderItem?.price || 0))} />
        <Row label="Quantity" value={orderItem?.quantity || 0} />
        <Row label="Total Price" value={formatMoney(orderTotal)} />
      </AdminCard>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <Feather name="map" size={18} color="#0F172A" />
          <Text style={styles.sectionTitle}>Order Journey</Text>
        </View>

        <View style={styles.timeline}>
          {ORDER_STATUSES.map((status, index) => {
            const active = orderItem?.status === status;
            const statusTone = statusBadgeStyle(status);

            return (
              <View key={status} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineMarker,
                    { backgroundColor: statusTone.backgroundColor },
                  ]}
                >
                  <Text style={[styles.timelineMarkerText, { color: statusTone.color }]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.timelineCopy}>
                  <Text style={[styles.timelineStatus, active && styles.timelineStatusActive]}>
                    {status}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {active
                      ? formatDate(orderItem?.updatedAt || orderItem?.createdAt)
                      : " "}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </AdminCard>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <Feather name="refresh-cw" size={18} color="#0F172A" />
          <Text style={styles.sectionTitle}>Update Status</Text>
        </View>

        <Text style={styles.helperText}>
          Choose the next stage in the order flow, then confirm the update.
        </Text>

        <View style={styles.chipWrap}>
          {ORDER_STATUSES.map((status) => {
            const selected = selectedStatus === status;
            const statusTone = statusBadgeStyle(status);

            return (
              <Pressable
                key={status}
                style={[
                  styles.statusChip,
                  selected && {
                    backgroundColor: statusTone.backgroundColor,
                    borderColor: statusTone.backgroundColor,
                  },
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    selected && { color: statusTone.color },
                  ]}
                >
                  {status}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AdminButton
          label={updating ? "Updating..." : "Confirm Update"}
          onPress={handleSubmitStatusChange}
          disabled={
            updating ||
            !selectedStatus ||
            selectedStatus === orderItem?.status
          }
        />
      </AdminCard>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={18} color="#0F172A" />
          <Text style={styles.sectionTitle}>Customer Details</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile label="Name" value={orderItem?.user?.name || "N/A"} />
          <InfoTile label="Email" value={orderItem?.user?.email || "N/A"} />
          <InfoTile label="Phone" value={orderItem?.user?.phoneNumber || "N/A"} />
          <InfoTile label="Status" value={orderItem?.status || "N/A"} />
        </View>
      </AdminCard>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <Feather name="map-pin" size={18} color="#0F172A" />
          <Text style={styles.sectionTitle}>Shipping Address</Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoTile label="Street" value={address?.street || "N/A"} />
          <InfoTile label="City" value={address?.city || "N/A"} />
          <InfoTile label="State" value={address?.state || "N/A"} />
          <InfoTile label="Zip Code" value={address?.zipcode || "N/A"} />
          <InfoTile label="Country" value={address?.country || "N/A"} />
        </View>
      </AdminCard>
    </AdminScreen>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIconWrap}>{icon}</View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#0F172A",
    padding: 20,
    gap: 18,
  },
  heroGlow: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#1E3A8A",
    opacity: 0.25,
  },
  heroHeader: {
    gap: 14,
  },
  heroCopy: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#7DD3FC",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#CBD5E1",
  },
  currentStatusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 92,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 8,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#93C5FD",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    color: "#0F172A",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },
  productImage: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  productCopy: {
    flex: 1,
    gap: 5,
  },
  productName: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    color: "#0F172A",
  },
  productSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  timeline: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineMarkerText: {
    fontSize: 13,
    fontWeight: "900",
  },
  timelineCopy: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  timelineStatusActive: {
    color: "#0F172A",
  },
  timelineDate: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoTile: {
    width: "47%",
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#0F172A",
  },
});
