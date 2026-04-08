import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AuthService from "../../api/AuthService";
import OrderService from "../../api/OrderService";
import ProductService from "../../api/ProductService";
import {
  AdminButton,
  AdminCard,
  AdminScreen,
  EmptyState,
  LoadingState,
  Row,
} from "../admin/AdminCommon";

type SellerInfo = {
  id?: string;
  companyName?: string;
  email?: string;
  regDate?: string;
  role?: string;
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

export default function SellerDashboard({
  onManageProducts,
  onOpenOrderDetails,
}: {
  onManageProducts?: () => void;
  onOpenOrderDetails?: (orderId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<SellerInfo>({
    companyName: "N/A",
    email: "N/A",
    regDate: "N/A",
  });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const userInfoRes = await AuthService.getLoggedInInfo();
        const userInfo = userInfoRes?.user || {};

        if (!mounted) return;

        setSellerData({
          id: userInfo.id,
          companyName: userInfo.companyName || "N/A",
          email: userInfo.email || "N/A",
          regDate: userInfo.regDate || userInfo.createdAt || "N/A",
          role: userInfo.role,
        });

        const [productsRes, ordersRes] = await Promise.all([
          ProductService.getAllProduct(),
          OrderService.getAllOrders(),
        ]);

        const companyId = userInfo.id;
        const productList = (productsRes?.productList || []).filter((product: any) => {
          if (!companyId) return false;
          return (
            product.userId === companyId ||
            product.sellerId === companyId ||
            product.ownerId === companyId
          );
        });

        const orderItems = (ordersRes?.orderItemList || []).filter((order: any) => {
          if (!companyId) return false;
          return (
            order?.sellerId === companyId ||
            order?.product?.sellerId === companyId ||
            order?.product?.userId === companyId ||
            order?.product?.ownerId === companyId
          );
        });

        if (!mounted) return;

        setProducts(productList);
        setOrders(orderItems);
      } catch (error: any) {
        if (!mounted) return;
        setError(error?.response?.data?.message || error?.message || "Unable to load seller dashboard");
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

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((item) => item.status === "PENDING").length;
    const totalRevenue = orders.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    return {
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
    };
  }, [orders, products]);

  const salesSummary = useMemo(() => {
    const monthlySales: Record<string, number> = {};

    orders.forEach((order) => {
      const date = order?.createdAt ? new Date(order.createdAt) : null;
      const month = date
        ? date.toLocaleString("default", { month: "short" })
        : "Unknown";
      const amount = Number(order?.price || 0) * Number(order?.quantity || 0);
      monthlySales[month] = (monthlySales[month] || 0) + amount;
    });

    return Object.entries(monthlySales).map(([month, total]) => ({
      month,
      total,
    }));
  }, [orders]);

  const orderStatusSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((order) => {
      const status = order?.status || "UNKNOWN";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, total]) => ({
      status,
      total,
    }));
  }, [orders]);

  const recentProducts = useMemo(() => products.slice(0, 5), [products]);
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  if (loading) {
    return <LoadingState label="Loading seller dashboard..." />;
  }

  return (
    <AdminScreen
      title={`${sellerData.companyName || "Seller"} Dashboard`}
      subtitle="Store overview, sales activity, products, and orders"
      action={<AdminButton label="Manage Products" onPress={onManageProducts} />}
    >
      {!!error && (
        <AdminCard>
          <Text style={styles.errorText}>{error}</Text>
        </AdminCard>
      )}

      <View style={styles.statsGrid}>
        <StatCard title="Total Products" value={String(stats.totalProducts)} />
        <StatCard title="Total Orders" value={String(stats.totalOrders)} />
        <StatCard title="Pending Orders" value={String(stats.pendingOrders)} />
        <StatCard title="Total Revenue" value={formatMoney(stats.totalRevenue)} />
      </View>

      <View style={styles.twoColumnGroup}>
        <AdminCard>
          <Text style={styles.sectionTitle}>Sales Analytics</Text>
          {salesSummary.length ? (
            salesSummary.map((item) => (
              <Row key={item.month} label={item.month} value={formatMoney(item.total)} />
            ))
          ) : (
            <EmptyState label="No sales data available" />
          )}
        </AdminCard>

        <AdminCard>
          <Text style={styles.sectionTitle}>Order Status</Text>
          {orderStatusSummary.length ? (
            orderStatusSummary.map((item) => (
              <Row key={item.status} label={item.status} value={item.total} />
            ))
          ) : (
            <EmptyState label="No order status data available" />
          )}
        </AdminCard>
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Recent Products</Text>
        {recentProducts.length ? (
          recentProducts.map((product) => (
            <View key={product.id} style={styles.listItem}>
              <Row label="Product Name" value={product.name || "N/A"} />
              <Row
                label="Price"
                value={product.newPrice != null ? formatMoney(Number(product.newPrice)) : "N/A"}
              />
              <Row label="Stock" value={product.stock || 0} />
              <View style={styles.stockWrap}>
                <Text
                  style={[
                    styles.stockBadge,
                    product.stock > 0 ? styles.stockBadgeActive : styles.stockBadgeMuted,
                  ]}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyState label="No products available" />
        )}
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.length ? (
          recentOrders.map((order) => (
            <View key={order.id} style={styles.listItem}>
              <Row label="Order ID" value={order.id || "N/A"} />
              <Row label="Customer" value={order.user?.name || "N/A"} />
              <Row label="Date" value={formatDate(order.createdAt)} />
              <Row
                label="Amount"
                value={formatMoney(
                  Number(order.price || 0) * Number(order.quantity || 0)
                )}
              />
              <Row label="Status" value={order.status || "N/A"} />
              <Pressable
                style={styles.detailsButton}
                onPress={() => order?.id && onOpenOrderDetails?.(String(order.id))}
              >
                <Text style={styles.detailsButtonText}>Details</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <EmptyState label="No orders available" />
        )}
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Seller Information</Text>
        <Row label="Business Name" value={sellerData.companyName} />
        <Row label="Email" value={sellerData.email} />
        <Row label="Registration Date" value={formatDate(sellerData.regDate)} />
      </AdminCard>
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

const styles = StyleSheet.create({
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  statTitle: {
    color: "#486581",
    fontWeight: "700",
  },
  statValue: {
    color: "#102A43",
    fontWeight: "900",
    fontSize: 24,
  },
  twoColumnGroup: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
    marginBottom: 4,
  },
  listItem: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 12,
    marginTop: 12,
    gap: 6,
  },
  stockWrap: {
    alignItems: "flex-start",
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: "700",
    overflow: "hidden",
  },
  stockBadgeActive: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },
  stockBadgeMuted: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
  },
  detailsButton: {
    alignSelf: "flex-start",
    backgroundColor: "#102A43",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    color: "#B42318",
    fontWeight: "600",
  },
});
