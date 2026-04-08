import { useEffect, useMemo, useState } from "react";
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
} from "../admin/AdminCommon";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (value: number) => `₦${value.toFixed(2)}`;

export default function SellerOrderDetails({
  itemId,
  onBack,
}: {
  itemId: string;
  onBack?: () => void;
}) {
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getOrderItemById(itemId);
      setOrderItems(response?.orderItemList || []);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Unable to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [itemId]);

  const summary = useMemo(() => {
    const totalItems = orderItems.length;
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
      0
    );
    const activeStatus = orderItems[0]?.status || "N/A";

    return {
      totalItems,
      totalAmount,
      activeStatus,
    };
  }, [orderItems]);

  const handleStatusUpdate = async (orderItemId: string, currentStatus: string) => {
    const nextStatus = selectedStatus[orderItemId] || currentStatus;

    if (!nextStatus) {
      setMessage("Select a status before updating.");
      return;
    }

    try {
      setUpdatingId(orderItemId);
      setMessage("");
      await OrderService.updateOrderitemStatus(orderItemId, nextStatus);
      setMessage("Order status updated successfully!");
      await load();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <AdminScreen
        title="Order Details"
        subtitle={`Order item ${itemId}`}
        action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
      >
        <LoadingState label="Loading seller order details..." />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen
      title="Order Details"
      subtitle={`Seller view for order item ${itemId}`}
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Seller Fulfillment</Text>
          <Text style={styles.heroTitle}>Order control center</Text>
          <Text style={styles.heroBody}>
            Review customer details, product configuration, delivery address, and update the order
            state from one screen.
          </Text>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Items</Text>
            <Text style={styles.metricValue}>{summary.totalItems}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Order value</Text>
            <Text style={styles.metricValue}>{formatMoney(summary.totalAmount)}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Current status</Text>
            <Text style={styles.metricValueSmall}>{summary.activeStatus}</Text>
          </View>
        </View>
      </View>

      {!orderItems.length ? (
        <EmptyState label="No order details found." />
      ) : (
        orderItems.map((orderItem) => {
          const totalPrice = Number(orderItem?.price || 0) * Number(orderItem?.quantity || 0);
          const currentStatus = orderItem?.status || "";
          const pendingStatus = selectedStatus[orderItem.id] || currentStatus;
          const address = orderItem?.user?.address || {};
          const productImage = orderItem?.productImageUrl || orderItem?.product?.imageUrls?.[0];

          return (
            <View key={orderItem.id} style={styles.stack}>
              <AdminCard>
                <View style={styles.productHeader}>
                  <View style={styles.productInfoBlock}>
                    <Text style={styles.sectionTitle}>Product Information</Text>
                    <Text style={styles.productName}>{orderItem?.productName || "Product item"}</Text>
                    <View style={[styles.statusBadge, statusBadgeStyle(currentStatus)]}>
                      <Text style={styles.statusBadgeText}>{currentStatus || "UNKNOWN"}</Text>
                    </View>
                  </View>
                  {productImage ? (
                    <Image source={{ uri: productImage }} style={styles.productImage} />
                  ) : (
                    <View style={styles.imageFallback}>
                      <Text style={styles.imageFallbackText}>No Image</Text>
                    </View>
                  )}
                </View>

                <Row label="Order Item ID" value={orderItem?.id} />
                <Row label="Selected Color" value={orderItem?.selectedColor || "N/A"} />
                <Row label="Selected Size" value={orderItem?.selectedSize || "N/A"} />
                <Row label="Quantity" value={orderItem?.quantity ?? 0} />
                <Row label="Unit Price" value={formatMoney(Number(orderItem?.price || 0))} />
                <Row label="Total Price" value={formatMoney(totalPrice)} />
              </AdminCard>

              <AdminCard>
                <Text style={styles.sectionTitle}>Order Journey</Text>
                <View style={styles.timeline}>
                  {ORDER_STATUSES.map((status, index) => {
                    const active = currentStatus === status;
                    return (
                      <View key={status} style={styles.timelineItem}>
                        <View style={[styles.timelineMarker, statusBadgeStyle(status)]}>
                          <Text style={styles.timelineMarkerText}>{index + 1}</Text>
                        </View>
                        <View style={styles.timelineTextBlock}>
                          <Text style={[styles.timelineStatus, active && styles.timelineStatusActive]}>
                            {status}
                          </Text>
                          <Text style={styles.timelineDate}>
                            {active ? formatDate(orderItem?.updatedAt || orderItem?.createdAt) : " "}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </AdminCard>

              <AdminCard>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <Row label="Name" value={orderItem?.user?.name || "N/A"} />
                <Row label="Email" value={orderItem?.user?.email || "N/A"} />
                <Row label="Phone" value={orderItem?.user?.phoneNumber || "N/A"} />
                <Row label="Role" value={orderItem?.user?.role || "N/A"} />
              </AdminCard>

              <AdminCard>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <Row label="Country" value={address?.country || "N/A"} />
                <Row label="State" value={address?.state || "N/A"} />
                <Row label="City" value={address?.city || "N/A"} />
                <Row label="Street" value={address?.street || "N/A"} />
                <Row label="Zip Code" value={address?.zipcode || "N/A"} />
              </AdminCard>

              <AdminCard>
                <Text style={styles.sectionTitle}>Update Status</Text>
                <Text style={styles.helperText}>
                  Select the next step in the fulfillment flow, then push the update.
                </Text>
                <View style={styles.filterWrap}>
                  {ORDER_STATUSES.map((status) => {
                    const selected = pendingStatus === status;
                    return (
                      <Pressable
                        key={status}
                        style={[styles.filterChip, selected && styles.filterChipSelected]}
                        onPress={() =>
                          setSelectedStatus((prev) => ({ ...prev, [orderItem.id]: status }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selected && styles.filterChipTextSelected,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.actionRow}>
                  <AdminButton
                    label={
                      updatingId === orderItem.id ? "Updating Status..." : "Update Status"
                    }
                    onPress={() => handleStatusUpdate(orderItem.id, currentStatus)}
                    disabled={updatingId === orderItem.id}
                  />
                </View>
              </AdminCard>
            </View>
          );
        })
      )}
    </AdminScreen>
  );
}

function statusBadgeStyle(status?: string) {
  switch (status) {
    case "PENDING":
      return styles.statusPending;
    case "CONFIRMED":
      return styles.statusConfirmed;
    case "SHIPPED":
      return styles.statusShipped;
    case "DELIVERED":
      return styles.statusDelivered;
    case "CANCELLED":
    case "RETURNED":
      return styles.statusCancelled;
    default:
      return styles.statusUnknown;
  }
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 18,
    backgroundColor: "#0F172A",
  },
  heroTextBlock: {
    gap: 8,
  },
  eyebrow: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
  },
  heroBody: {
    color: "#CBD5E1",
    lineHeight: 22,
  },
  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricPill: {
    flex: 1,
    minWidth: 140,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  metricValueSmall: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  stack: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  productInfoBlock: {
    flex: 1,
    gap: 8,
  },
  productName: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
  },
  productImage: {
    width: 112,
    height: 112,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  imageFallback: {
    width: 112,
    height: 112,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  imageFallbackText: {
    color: "#64748B",
    fontWeight: "700",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  timeline: {
    gap: 10,
  },
  timelineItem: {
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
    color: "#FFFFFF",
    fontWeight: "900",
  },
  timelineTextBlock: {
    flex: 1,
    gap: 2,
  },
  timelineStatus: {
    color: "#334E68",
    fontWeight: "700",
  },
  timelineStatusActive: {
    color: "#102A43",
    fontWeight: "900",
  },
  timelineDate: {
    color: "#64748B",
    fontSize: 12,
  },
  helperText: {
    color: "#64748B",
    lineHeight: 20,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  filterChipSelected: {
    backgroundColor: "#2563EB",
  },
  filterChipText: {
    color: "#102A43",
    fontWeight: "800",
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
  },
  actionRow: {
    paddingTop: 8,
  },
  statusPending: {
    backgroundColor: "#D97706",
  },
  statusConfirmed: {
    backgroundColor: "#2563EB",
  },
  statusShipped: {
    backgroundColor: "#7C3AED",
  },
  statusDelivered: {
    backgroundColor: "#059669",
  },
  statusCancelled: {
    backgroundColor: "#DC2626",
  },
  statusUnknown: {
    backgroundColor: "#64748B",
  },
});
