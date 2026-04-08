import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AuthService from "../../api/AuthService";
import OrderService from "../../api/OrderService";
import ProductService from "../../api/ProductService";
import { AdminButton, AdminCard, AdminScreen, Banner, LoadingState, Row } from "../admin/AdminCommon";

type SellerActionKey =
  | "dashboard"
  | "products"
  | "orders"
  | "add-product"
  | "seller-profile";

type SellerInfo = {
  id?: string;
  name?: string;
  companyName?: string;
  email?: string;
  role?: string;
  regDate?: string;
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (value: number) => `₦${value.toFixed(2)}`;

export default function SellerPage({
  onNavigate,
}: {
  onNavigate?: (route: SellerActionKey) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [seller, setSeller] = useState<SellerInfo>({});
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setMessage("");

        const sellerResponse = await AuthService.getLoggedInInfo();
        const user = sellerResponse?.user || {};

        if (!mounted) return;

        setSeller({
          id: user.id,
          name: user.name,
          companyName: user.companyName,
          email: user.email,
          role: user.role,
          regDate: user.regDate || user.createdAt,
        });

        const [productsResponse, ordersResponse] = await Promise.all([
          ProductService.getAllProduct(),
          OrderService.getAllOrders(),
        ]);

        const sellerId = String(user.id || "");
        const productList = (productsResponse?.productList || []).filter((product: any) => {
          if (!sellerId) return false;
          return (
            String(product?.userId || "") === sellerId ||
            String(product?.sellerId || "") === sellerId ||
            String(product?.ownerId || "") === sellerId
          );
        });

        const orderList = (ordersResponse?.orderItemList || []).filter((order: any) => {
          if (!sellerId) return false;
          return (
            String(order?.sellerId || "") === sellerId ||
            String(order?.product?.sellerId || "") === sellerId ||
            String(order?.product?.userId || "") === sellerId ||
            String(order?.product?.ownerId || "") === sellerId
          );
        });

        if (!mounted) return;

        setProducts(productList);
        setOrders(orderList);
      } catch (error: any) {
        if (!mounted) return;
        setMessage(error?.response?.data?.message || error?.message || "Unable to load seller hub.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order?.status === "PENDING").length;
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order?.price || 0) * Number(order?.quantity || 0),
      0
    );

    return { totalProducts, totalOrders, pendingOrders, revenue };
  }, [orders, products]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product?.stock || 0) <= 5).slice(0, 3),
    [products]
  );

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);

  if (loading) {
    return <LoadingState label="Loading seller hub..." />;
  }

  return (
    <AdminScreen
      title={seller.companyName || "Seller Hub"}
      subtitle="Manage products, orders, and store performance"
      action={<AdminButton label="Open Dashboard" onPress={() => onNavigate?.("dashboard")} />}
    >
      <Banner message={message} tone="error" />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Seller Home</Text>
          <Text style={styles.heroTitle}>
            {seller.companyName || seller.name || "Your store"} operations, one place
          </Text>
          <Text style={styles.heroBody}>
            This is the mobile command center for your marketplace business. Jump into inventory,
            order handling, and new listings without digging through screens.
          </Text>
        </View>

        <View style={styles.heroActionRow}>
          <QuickAction
            title="Manage Products"
            caption="Edit listings and stock"
            onPress={() => onNavigate?.("products")}
          />
          <QuickAction
            title="Manage Orders"
            caption="Track fulfillment"
            onPress={() => onNavigate?.("orders")}
          />
          <QuickAction
            title="Add Product"
            caption="Create a new listing"
            onPress={() => onNavigate?.("add-product")}
          />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Products" value={String(stats.totalProducts)} />
        <StatCard title="Orders" value={String(stats.totalOrders)} />
        <StatCard title="Pending" value={String(stats.pendingOrders)} />
        <StatCard title="Revenue" value={formatMoney(stats.revenue)} />
      </View>

      <View style={styles.sectionGrid}>
        <AdminCard>
          <Text style={styles.sectionTitle}>Business Profile</Text>
          <Row label="Store" value={seller.companyName || "N/A"} />
          <Row label="Owner" value={seller.name || "N/A"} />
          <Row label="Email" value={seller.email || "N/A"} />
          <Row label="Role" value={seller.role || "N/A"} />
          <Row label="Joined" value={formatDate(seller.regDate)} />
        </AdminCard>

        <AdminCard>
          <Text style={styles.sectionTitle}>Operations Snapshot</Text>
          <Row label="Live listings" value={stats.totalProducts} />
          <Row label="Orders to process" value={stats.pendingOrders} />
          <Row label="Completed revenue" value={formatMoney(stats.revenue)} />
          <Row
            label="Priority"
            value={stats.pendingOrders > 0 ? "Review pending orders" : "Inventory upkeep"}
          />
        </AdminCard>
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Management Actions</Text>
        <View style={styles.managementGrid}>
          <ManagementTile
            title="Dashboard"
            text="Review sales and performance"
            onPress={() => onNavigate?.("dashboard")}
          />
          <ManagementTile
            title="Products"
            text="Update pricing and stock"
            onPress={() => onNavigate?.("products")}
          />
          <ManagementTile
            title="Orders"
            text="Handle customer purchases"
            onPress={() => onNavigate?.("orders")}
          />
          <ManagementTile
            title="New Listing"
            text="Launch another product"
            onPress={() => onNavigate?.("add-product")}
          />
        </View>
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Low Stock Watch</Text>
        {lowStockProducts.length ? (
          lowStockProducts.map((product) => (
            <View key={product.id} style={styles.listRow}>
              <View style={styles.listRowText}>
                <Text style={styles.listTitle}>{product.name || "Unnamed product"}</Text>
                <Text style={styles.listMeta}>
                  {formatMoney(Number(product.newPrice || 0))} • Stock {product.stock ?? 0}
                </Text>
              </View>
              <View
                style={[
                  styles.pill,
                  Number(product.stock || 0) === 0 ? styles.pillDanger : styles.pillWarning,
                ]}
              >
                <Text style={styles.pillText}>
                  {Number(product.stock || 0) === 0 ? "Out" : "Low"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No low-stock products right now.</Text>
        )}
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.length ? (
          recentOrders.map((order) => (
            <View key={order.id} style={styles.listRow}>
              <View style={styles.listRowText}>
                <Text style={styles.listTitle}>{order.productName || "Product order"}</Text>
                <Text style={styles.listMeta}>
                  {order.user?.name || "Customer"} • {formatDate(order.createdAt)}
                </Text>
              </View>
              <View style={[styles.pill, statusPillStyle(order.status)]}>
                <Text style={styles.pillText}>{order.status || "UNKNOWN"}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent orders yet.</Text>
        )}
      </AdminCard>
    </AdminScreen>
  );
}

function QuickAction({
  title,
  caption,
  onPress,
}: {
  title: string;
  caption: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionCaption}>{caption}</Text>
    </Pressable>
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

function ManagementTile({
  title,
  text,
  onPress,
}: {
  title: string;
  text: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.managementTile} onPress={onPress}>
      <Text style={styles.managementTitle}>{title}</Text>
      <Text style={styles.managementText}>{text}</Text>
    </Pressable>
  );
}

function statusPillStyle(status?: string) {
  switch (status) {
    case "PENDING":
      return styles.pillWarning;
    case "DELIVERED":
      return styles.pillSuccess;
    case "CANCELLED":
    case "RETURNED":
      return styles.pillDanger;
    default:
      return styles.pillNeutral;
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
    color: "#93C5FD",
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
  heroActionRow: {
    gap: 10,
  },
  quickAction: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  quickActionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  quickActionCaption: {
    color: "#BCCCDC",
    lineHeight: 19,
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
  sectionGrid: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
  managementGrid: {
    gap: 10,
  },
  managementTile: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 4,
  },
  managementTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  managementText: {
    color: "#64748B",
    lineHeight: 19,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  listRowText: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  listMeta: {
    color: "#64748B",
    lineHeight: 18,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  pillWarning: {
    backgroundColor: "#D97706",
  },
  pillDanger: {
    backgroundColor: "#DC2626",
  },
  pillSuccess: {
    backgroundColor: "#059669",
  },
  pillNeutral: {
    backgroundColor: "#64748B",
  },
  emptyText: {
    color: "#64748B",
  },
});
