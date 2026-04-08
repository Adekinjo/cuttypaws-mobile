import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AuthService from "../../api/AuthService";
import ProductService from "../../api/ProductService";
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

const formatMoney = (value: number) => `₦${value.toFixed(2)}`;

export default function SellerProduct({
  onAddProduct,
  onEditProduct,
}: {
  onAddProduct?: () => void;
  onEditProduct?: (productId: string) => void;
}) {
  const [sellerName, setSellerName] = useState("Seller");
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
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

      const response = await AuthService.getLoggedInInfo();
      const user = response?.user || {};
      const currentSellerId = user.id ? String(user.id) : null;

      setSellerName(user.companyName || user.name || "Seller");
      setSellerId(currentSellerId);

      const productsResponse = await ProductService.getAllProduct();
      const productList = (productsResponse?.productList || []).filter((product: any) => {
        if (!currentSellerId) return false;
        return (
          String(product?.userId || "") === currentSellerId ||
          String(product?.sellerId || "") === currentSellerId ||
          String(product?.ownerId || "") === currentSellerId
        );
      });

      setAllProducts(productList);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Unable to fetch products.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const totalProducts = allProducts.length;
    const inStock = allProducts.filter((product) => Number(product?.stock || 0) > 0).length;
    const lowStock = allProducts.filter((product) => {
      const stock = Number(product?.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;
    const inventoryValue = allProducts.reduce(
      (sum, product) =>
        sum + Number(product?.newPrice || 0) * Number(product?.stock || 0),
      0
    );

    return {
      totalProducts,
      inStock,
      lowStock,
      inventoryValue,
    };
  }, [allProducts]);

  const totalPages = Math.max(1, Math.ceil(allProducts.length / itemsPerPage));
  const products = useMemo(
    () => allProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [allProducts, page]
  );

  const confirmDelete = (productId: string, name?: string) => {
    Alert.alert(
      "Delete product",
      `Remove ${name || "this product"} from your inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await ProductService.deleteProduct(productId);
              setMessage("Product deleted successfully.");
              load(true);
            } catch (error: any) {
              setMessage(
                error?.response?.data?.message || error?.message || "Unable to delete product."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingState label="Loading seller products..." />;
  }

  return (
    <AdminScreen
      title={`${sellerName} Products`}
      subtitle="Manage listings, track stock, and keep your catalog sharp"
      action={<AdminButton label="Add Product" onPress={onAddProduct} />}
    >
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Inventory Control</Text>
          <Text style={styles.heroTitle}>Your seller catalog on mobile</Text>
          <Text style={styles.heroBody}>
            Review stock, pricing, and product readiness from one screen. Edit listings fast and
            remove weak items before they hurt store quality.
          </Text>
        </View>
        <View style={styles.heroActions}>
          <QuickAction
            title="Refresh Catalog"
            caption={refreshing ? "Refreshing now..." : "Reload latest inventory"}
            onPress={() => load(true)}
          />
          <QuickAction
            title="Create Listing"
            caption="Add another product"
            onPress={onAddProduct}
          />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Products" value={String(stats.totalProducts)} />
        <StatCard title="In Stock" value={String(stats.inStock)} />
        <StatCard title="Low Stock" value={String(stats.lowStock)} />
        <StatCard title="Inventory Value" value={formatMoney(stats.inventoryValue)} />
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Inventory Summary</Text>
        <Row label="Seller ID" value={sellerId || "N/A"} />
        <Row label="Catalog size" value={stats.totalProducts} />
        <Row label="Current page" value={`${page} / ${totalPages}`} />
        <Row
          label="Priority"
          value={stats.lowStock > 0 ? "Restock low inventory items" : "Catalog looks healthy"}
        />
      </AdminCard>

      {!products.length ? (
        <EmptyState label="No products found." />
      ) : (
        products.map((product) => {
          const stock = Number(product?.stock || 0);
          const imageUrl = product?.imageUrls?.[0] || product?.imageUrl || null;
          const sizes = Array.isArray(product?.sizes) ? product.sizes.join(", ") : product?.sizes;
          const colors = Array.isArray(product?.colors)
            ? product.colors.join(", ")
            : product?.colors;

          return (
            <AdminCard key={product.id}>
              <View style={styles.productHeader}>
                <View style={styles.productInfoBlock}>
                  <Text style={styles.productName}>{product?.name || "Unnamed product"}</Text>
                  <Text style={styles.productMeta}>
                    {product?.categoryName || "Uncategorized"}
                    {product?.subCategoryName ? ` • ${product.subCategoryName}` : ""}
                  </Text>
                  <View style={[styles.stockBadge, stockBadgeStyle(stock)]}>
                    <Text style={styles.stockBadgeText}>
                      {stock === 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock"}
                    </Text>
                  </View>
                </View>

                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.imageFallbackText}>No Image</Text>
                  </View>
                )}
              </View>

              <Row label="Price" value={formatMoney(Number(product?.newPrice || 0))} />
              <Row label="Old Price" value={formatMoney(Number(product?.oldPrice || 0))} />
              <Row label="Stock" value={stock} />
              <Row
                label="Description"
                value={product?.description ? String(product.description).slice(0, 90) : "N/A"}
              />
              <Row label="Sizes" value={sizes || "N/A"} />
              <Row label="Colors" value={colors || "N/A"} />

              <View style={styles.actionRow}>
                <AdminButton label="Edit Product" onPress={() => onEditProduct?.(product.id)} />
                <AdminButton
                  label="Delete Product"
                  variant="danger"
                  onPress={() => confirmDelete(String(product.id), product?.name)}
                />
              </View>
            </AdminCard>
          );
        })
      )}

      {allProducts.length ? (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
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

function stockBadgeStyle(stock: number) {
  if (stock === 0) return styles.stockBadgeDanger;
  if (stock <= 5) return styles.stockBadgeWarning;
  return styles.stockBadgeSuccess;
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
    color: "#67E8F9",
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
  heroActions: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  productInfoBlock: {
    flex: 1,
    gap: 6,
  },
  productName: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
  },
  productMeta: {
    color: "#64748B",
    lineHeight: 20,
  },
  productImage: {
    width: 104,
    height: 104,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  imageFallback: {
    width: 104,
    height: 104,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  imageFallbackText: {
    color: "#64748B",
    fontWeight: "700",
  },
  stockBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  stockBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  stockBadgeSuccess: {
    backgroundColor: "#059669",
  },
  stockBadgeWarning: {
    backgroundColor: "#D97706",
  },
  stockBadgeDanger: {
    backgroundColor: "#DC2626",
  },
  actionRow: {
    gap: 10,
    paddingTop: 8,
  },
});
