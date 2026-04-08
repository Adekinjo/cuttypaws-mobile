import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AuthService from "../../api/AuthService";
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
import Pagination from "../common/Pagination";

const ORDER_STATUSES = [
  "",
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

export default function SellerOrder({
  onOpenOrder,
}: {
  onOpenOrder?: (itemId: string) => void;
}) {
  const [sellerName, setSellerName] = useState("Seller");
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const load = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setMessage("");

      const userResponse = await AuthService.getLoggedInInfo();
      const user = userResponse?.user || {};
      const currentSellerId = user.id ? String(user.id) : null;

      setSellerId(currentSellerId);
      setSellerName(user.companyName || user.name || "Seller");

      const orderResponse = await OrderService.getAllOrders();
      const orderList = (orderResponse?.orderItemList || []).filter((order: any) => {
        if (!currentSellerId) return false;
        return (
          String(order?.sellerId || "") === currentSellerId ||
          String(order?.product?.sellerId || "") === currentSellerId ||
          String(order?.product?.userId || "") === currentSellerId ||
          String(order?.product?.ownerId || "") === currentSellerId
        );
      });

      setAllOrders(orderList);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Unable to fetch seller orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return allOrders;
    return allOrders.filter((order) => order?.status === statusFilter);
  }, [allOrders, statusFilter]);

  const orderStats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter((order) => order?.status === "PENDING").length;
    const deliveredOrders = filteredOrders.filter(
      (order) => order?.status === "DELIVERED"
    ).length;
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + Number(order?.price || 0) * Number(order?.quantity || 0),
      0
    );

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
    };
  }, [filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(
    () => filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [filteredOrders, page]
  );

  const activeFilterLabel = statusFilter || "ALL";

  if (loading) {
    return <LoadingState label="Loading seller orders..." />;
  }

  return (
    <AdminScreen
      title={`${sellerName} Orders`}
      subtitle="Track every order tied to your products"
      action={
        <AdminButton
          label={refreshing ? "Refreshing..." : "Refresh"}
          variant="secondary"
          onPress={() => load(true)}
          disabled={refreshing}
        />
      }
    >
      <Banner message={message} tone="error" />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Seller Orders</Text>
          <Text style={styles.heroTitle}>Operations at a glance</Text>
          <Text style={styles.heroBody}>
            Filter by status, review order value, and open item details for fulfillment actions.
          </Text>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Visible orders</Text>
            <Text style={styles.metricValue}>{orderStats.totalOrders}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Active filter</Text>
            <Text style={styles.metricValueSmall}>{activeFilterLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Orders" value={String(orderStats.totalOrders)} />
        <StatCard title="Pending" value={String(orderStats.pendingOrders)} />
        <StatCard title="Delivered" value={String(orderStats.deliveredOrders)} />
        <StatCard title="Revenue" value={formatMoney(orderStats.totalRevenue)} />
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Filter by Status</Text>
        <Text style={styles.helperText}>
          Narrow the order list to the stage you need to work on right now.
        </Text>
        <View style={styles.filterWrap}>
          {ORDER_STATUSES.map((status) => {
            const selected = statusFilter === status;
            const label = status || "ALL";
            return (
              <Pressable
                key={label}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Seller Summary</Text>
        <Row label="Seller ID" value={sellerId || "N/A"} />
        <Row label="Status filter" value={activeFilterLabel} />
        <Row label="Pages" value={totalPages} />
      </AdminCard>

      {!filteredOrders.length ? (
        <EmptyState label="No orders found for the current filter." />
      ) : (
        paginatedOrders.map((order) => {
          const amount = Number(order?.price || 0) * Number(order?.quantity || 0);
          const customer =
            order?.user?.name ||
            order?.customerName ||
            order?.buyerName ||
            order?.email ||
            "Customer";

          return (
            <AdminCard key={order.id}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderText}>
                  <Text style={styles.orderTitle}>{order?.productName || "Product order"}</Text>
                  <Text style={styles.orderSubtitle}>Order #{order?.id || "N/A"}</Text>
                </View>
                <View style={[styles.statusBadge, statusBadgeStyle(order?.status)]}>
                  <Text style={styles.statusBadgeText}>{order?.status || "UNKNOWN"}</Text>
                </View>
              </View>

              <Row label="Customer" value={customer} />
              <Row label="Quantity" value={order?.quantity ?? 0} />
              <Row label="Unit price" value={formatMoney(Number(order?.price || 0))} />
              <Row label="Total price" value={formatMoney(amount)} />
              <Row label="Date ordered" value={formatDate(order?.createdAt)} />

              <View style={styles.actionRow}>
                <AdminButton
                  label="View Details"
                  onPress={() => order?.id && onOpenOrder?.(String(order.id))}
                />
              </View>
            </AdminCard>
          );
        })
      )}

      {filteredOrders.length ? (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </AdminScreen>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
    backgroundColor: "#102A43",
  },
  heroTextBlock: {
    gap: 8,
  },
  eyebrow: {
    color: "#86EFAC",
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
    color: "#D9E2EC",
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
    color: "#9FB3C8",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  statTitle: {
    color: "#486581",
    fontSize: 13,
    fontWeight: "700",
  },
  statValue: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
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
    backgroundColor: "#0F766E",
  },
  filterChipText: {
    color: "#102A43",
    fontWeight: "800",
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  orderHeaderText: {
    flex: 1,
    gap: 4,
  },
  orderTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
  },
  orderSubtitle: {
    color: "#64748B",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
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
  actionRow: {
    paddingTop: 8,
  },
});
