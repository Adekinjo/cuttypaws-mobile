import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OrderService from "../../api/OrderService";

type OrderItem = {
  id?: string | number;
  productId?: string | number;
  productName?: string;
  productImageUrl?: string;
  productImage?: string;
  quantity?: number;
  price?: number | string;
  status?: string;
  selectedColor?: string;
  selectedSize?: string;
  createdAt?: string;
  orderDate?: string;
};

type SortBy = "date" | "amount" | "name";
type SortOrder = "asc" | "desc";

const pageSize = 6;
const PRODUCT_FALLBACK =
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=400&fit=crop";

export default function OrderHistoryPage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await OrderService.getAllOrders();
      const list =
        response?.orderItemList ||
        response?.orders ||
        response?.data ||
        (Array.isArray(response) ? response : []);

      const normalized = Array.isArray(list)
        ? [...list].sort(
            (a, b) =>
              new Date(b?.createdAt || b?.orderDate || 0).getTime() -
              new Date(a?.createdAt || a?.orderDate || 0).getTime()
          )
        : [];

      setOrders(normalized);
    } catch (loadError: any) {
      console.error("[OrderHistoryPage] loadOrders failed", loadError);
      setError(loadError?.response?.data?.message || loadError?.message || "Failed to load order history.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery =
        !query ||
        String(order?.productName || "").toLowerCase().includes(query) ||
        String(order?.id || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(order?.status || "").toUpperCase() === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue: string | number | Date = "";
      let bValue: string | number | Date = "";

      switch (sortBy) {
        case "date":
          aValue = new Date(a?.createdAt || a?.orderDate || 0);
          bValue = new Date(b?.createdAt || b?.orderDate || 0);
          break;
        case "amount":
          aValue = (Number(a?.price) || 0) * (Number(a?.quantity) || 0);
          bValue = (Number(b?.price) || 0) * (Number(b?.quantity) || 0);
          break;
        case "name":
          aValue = String(a?.productName || "").toLowerCase();
          bValue = String(b?.productName || "").toLowerCase();
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }

      return aValue < bValue ? 1 : -1;
    });
  }, [filteredOrders, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((order) =>
      ["DELIVERED", "COMPLETED", "SUCCESS"].includes(String(order?.status || "").toUpperCase())
    ).length;
    const pending = orders.filter((order) =>
      ["PENDING", "PROCESSING"].includes(String(order?.status || "").toUpperCase())
    ).length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (Number(order?.price) || 0) * (Number(order?.quantity) || 0),
      0
    );

    return { total, delivered, pending, totalAmount };
  }, [orders]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedOrders.length / pageSize)),
    [sortedOrders.length]
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [safePage, sortedOrders]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortBy("date");
    setSortOrder("desc");
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading your orders...</Text>
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
          <View style={styles.headerLeft}>
            <Pressable style={styles.iconButton} onPress={() => onNavigate?.("back")}>
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Order History</Text>
              <Text style={styles.headerSubtitle}>{stats.total} total orders</Text>
            </View>
          </View>

          <Pressable style={styles.iconButton} onPress={loadOrders}>
            <Feather name="refresh-cw" size={18} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <MetricCard
            icon={<Feather name="package" size={18} color="#F97316" />}
            tint="#FFF7ED"
            value={String(stats.total)}
            label="Total Orders"
          />
          <MetricCard
            icon={<Feather name="check-circle" size={18} color="#16A34A" />}
            tint="#F0FDF4"
            value={String(stats.delivered)}
            label="Delivered"
          />
          <MetricCard
            icon={<Feather name="clock" size={18} color="#D97706" />}
            tint="#FFFBEB"
            value={String(stats.pending)}
            label="Pending"
          />
          <MetricCard
            icon={<Feather name="dollar-sign" size={18} color="#2563EB" />}
            tint="#EFF6FF"
            value={formatCurrency(stats.totalAmount)}
            label="Total Spent"
          />
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.sectionTitle}>Search and filter</Text>

          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color="#64748B" />
            <TextInput
              value={searchQuery}
              onChangeText={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
              placeholder="Search by product name or order ID..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.chipRow}>
            {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
              (status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.filterChip,
                    statusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status === "ALL" ? "All Status" : toTitle(status)}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <View style={styles.sortRow}>
            <View style={styles.sortGroup}>
              {[
                { key: "date", label: "Date" },
                { key: "amount", label: "Amount" },
                { key: "name", label: "Name" },
              ].map((option) => (
                <Pressable
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy(option.key as SortBy)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.key && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.orderToggle}
              onPress={() => setSortOrder((value) => (value === "asc" ? "desc" : "asc"))}
            >
              <Feather
                name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
                size={16}
                color="#0F172A"
              />
              <Text style={styles.orderToggleText}>{sortOrder === "asc" ? "Asc" : "Desc"}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear filters</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconWrap, { backgroundColor: "#FEE2E2" }]}>
              <Feather name="x-circle" size={24} color="#DC2626" />
            </View>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyCopy}>{error}</Text>
            <Pressable style={styles.primaryButton} onPress={loadOrders}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : paginatedOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="package" size={24} color="#0F766E" />
            </View>
            <Text style={styles.emptyTitle}>
              {orders.length === 0 ? "No orders yet" : "No orders found"}
            </Text>
            <Text style={styles.emptyCopy}>
              {orders.length === 0
                ? "You have not placed any orders yet."
                : "Try changing filters or search keywords."}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => onNavigate?.("products")}
            >
              <Text style={styles.primaryButtonText}>
                {orders.length === 0 ? "Start Shopping" : "Browse Products"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.ordersList}>
              {paginatedOrders.map((order) => (
                <View key={String(order.id)} style={styles.orderCard}>
                  <View style={styles.orderImageWrap}>
                    <Image
                      source={{
                        uri: order.productImageUrl || order.productImage || PRODUCT_FALLBACK,
                      }}
                      style={styles.orderImage}
                    />
                    {(order.quantity || 0) > 1 ? (
                      <View style={styles.quantityBadge}>
                        <Text style={styles.quantityBadgeText}>×{order.quantity}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.orderContent}>
                    <View style={styles.orderTopRow}>
                      <View style={styles.orderHeading}>
                        <Text style={styles.orderName}>{order.productName || "Unnamed Product"}</Text>
                        <Text style={styles.orderMeta}>
                          Order #{order.id} • {formatDate(order.createdAt || order.orderDate)}
                        </Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>

                    <View style={styles.detailsGrid}>
                      <MiniDetail label="Quantity" value={String(order.quantity ?? "—")} />
                      <MiniDetail label="Unit Price" value={formatCurrency(order.price)} />
                      <MiniDetail label="Color" value={order.selectedColor || "—"} />
                      <MiniDetail
                        label="Total"
                        value={formatCurrency((Number(order.price) || 0) * (Number(order.quantity) || 0))}
                        emphasis
                      />
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() =>
                          onNavigate?.("product-details", { productId: order.productId })
                        }
                        disabled={!order.productId}
                      >
                        <Feather name="shopping-bag" size={15} color="#0F172A" />
                        <Text style={styles.secondaryButtonText}>View Product</Text>
                      </Pressable>

                      <Pressable
                        style={styles.primaryActionButton}
                        onPress={() => onNavigate?.("order-details", { itemId: order.id })}
                      >
                        <Feather name="eye" size={15} color="#FFFFFF" />
                        <Text style={styles.primaryActionButtonText}>View Details</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {totalPages > 1 ? (
              <View style={styles.paginationCard}>
                <View style={styles.paginationRow}>
                  <Pressable
                    style={[styles.pageButton, safePage === 1 && styles.pageButtonDisabled]}
                    onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage === 1}
                  >
                    <Text style={styles.pageButtonText}>Previous</Text>
                  </Pressable>

                  <Text style={styles.paginationText}>
                    Page {safePage} of {totalPages}
                  </Text>

                  <Pressable
                    style={[
                      styles.pageButton,
                      safePage === totalPages && styles.pageButtonDisabled,
                    ]}
                    onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safePage === totalPages}
                  >
                    <Text style={styles.pageButtonText}>Next</Text>
                  </Pressable>
                </View>

                <Text style={styles.paginationSubtext}>
                  Showing {paginatedOrders.length} of {sortedOrders.length} orders
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  tint,
  value,
  label,
}: {
  icon: ReactNode;
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: tint }]}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MiniDetail({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, emphasis && styles.detailValueEmphasis]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = String(status || "").toUpperCase();
  const color =
    ["DELIVERED", "COMPLETED", "SUCCESS"].includes(normalized)
      ? "#166534"
      : ["PENDING", "PROCESSING"].includes(normalized)
        ? "#A16207"
        : ["SHIPPED", "IN_TRANSIT"].includes(normalized)
          ? "#1D4ED8"
          : ["CANCELLED", "FAILED", "REFUNDED"].includes(normalized)
            ? "#B91C1C"
            : "#475569";

  const bg =
    ["DELIVERED", "COMPLETED", "SUCCESS"].includes(normalized)
      ? "#DCFCE7"
      : ["PENDING", "PROCESSING"].includes(normalized)
        ? "#FEF3C7"
        : ["SHIPPED", "IN_TRANSIT"].includes(normalized)
          ? "#DBEAFE"
          : ["CANCELLED", "FAILED", "REFUNDED"].includes(normalized)
            ? "#FEE2E2"
            : "#E2E8F0";

  const iconName: keyof typeof Feather.glyphMap =
    ["DELIVERED", "COMPLETED", "SUCCESS"].includes(normalized)
      ? "check-circle"
      : ["PENDING", "PROCESSING"].includes(normalized)
        ? "clock"
        : ["SHIPPED", "IN_TRANSIT"].includes(normalized)
          ? "truck"
          : ["CANCELLED", "FAILED", "REFUNDED"].includes(normalized)
            ? "x-circle"
            : "clock";

  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Feather name={iconName} size={12} color={color} />
      <Text style={[styles.statusBadgeText, { color }]}>{toTitle(status || "Unknown")}</Text>
    </View>
  );
}

function toTitle(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
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
    gap: 12,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: "47.8%",
    borderRadius: 24,
    padding: 16,
  },
  metricIcon: {
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  filterCard: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },
  searchWrap: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#0F172A",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  sortGroup: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  sortOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sortOptionActive: {
    backgroundColor: "#ECFEFF",
    borderColor: "#99F6E4",
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  sortOptionTextActive: {
    color: "#0F766E",
  },
  orderToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  clearButton: {
    alignSelf: "flex-start",
    marginTop: 14,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyCopy: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 16,
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
  ordersList: {
    gap: 14,
  },
  orderCard: {
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderImageWrap: {
    position: "relative",
    width: "100%",
    height: 180,
    backgroundColor: "#E2E8F0",
  },
  orderImage: {
    width: "100%",
    height: "100%",
  },
  quantityBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(15,23,42,0.82)",
  },
  quantityBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  orderContent: {
    padding: 16,
  },
  orderTopRow: {
    gap: 10,
  },
  orderHeading: {
    gap: 4,
  },
  orderName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  orderMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  detailBox: {
    width: "47.8%",
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#F8FAFC",
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  detailValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  detailValueEmphasis: {
    color: "#0F766E",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: "#F1F5F9",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: "#0F172A",
  },
  primaryActionButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paginationCard: {
    borderRadius: 22,
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pageButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  paginationText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  paginationSubtext: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
});
