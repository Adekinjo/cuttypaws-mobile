import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ProductService from "../../api/ProductService";
import { Banner, EmptyState, LoadingState } from "../admin/AdminCommon";
import ProductList from "../common/ProductList";

const formatMoney = (value: number) => `₦${value.toFixed(2)}`;

export default function SellersProducts({
  sellerName,
  companyName,
  cartItems = [],
  onAddToCart,
  onIncrement,
  onDecrement,
  onOpenProduct,
  onBack,
}: {
  sellerName?: string;
  companyName?: string;
  cartItems?: Array<{ id: string; quantity: number }>;
  onAddToCart?: (product: any) => void;
  onIncrement?: (product: any) => void;
  onDecrement?: (product: any) => void;
  onOpenProduct?: (product: any) => void;
  onBack?: () => void;
}) {
  const storeName = (sellerName || companyName || "").trim();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setMessage("");

        const response = await ProductService.getAllProduct();
        if (!mounted) return;
        setAllProducts(response?.productList || []);
      } catch (error: any) {
        if (!mounted) return;
        setMessage(error?.message || "Failed to load products.");
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

  const products = useMemo(
    () =>
      allProducts.filter(
        (product) =>
          (product.sellerName || product.companyName || "")
            .trim()
            .toLowerCase() === storeName.toLowerCase()
      ),
    [allProducts, storeName]
  );

  const storeStats = useMemo(() => {
    const productCount = products.length;
    const priceValues = products.map((product) => Number(product?.newPrice || 0));
    const totalValue = priceValues.reduce((sum, value) => sum + value, 0);
    const averagePrice = productCount ? totalValue / productCount : 0;
    const discountCount = products.filter(
      (product) =>
        Number(product?.oldPrice || 0) > 0 &&
        Number(product?.oldPrice || 0) > Number(product?.newPrice || 0)
    ).length;

    return {
      productCount,
      averagePrice,
      discountCount,
    };
  }, [products]);

  if (loading) {
    return <LoadingState label={`Loading ${storeName || "seller"} products...`} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Banner message={message} tone="error" />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Seller Storefront</Text>
          <Text style={styles.heroTitle}>{storeName || "Seller"} Products</Text>
          <Text style={styles.heroBody}>
            Explore this seller’s live catalog, compare prices, save favorites, and add items to
            your cart from a mobile-first storefront.
          </Text>
        </View>

        <View style={styles.heroActionRow}>
          <Pressable style={styles.heroButton} onPress={onBack}>
            <Text style={styles.heroButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Products" value={String(storeStats.productCount)} />
        <StatCard title="Avg. Price" value={formatMoney(storeStats.averagePrice)} />
        <StatCard title="On Discount" value={String(storeStats.discountCount)} />
      </View>

      <View style={styles.sectionIntro}>
        <Text style={styles.sectionTitle}>Available Listings</Text>
        <Text style={styles.sectionText}>
          {storeStats.productCount
            ? `${storeName || "This seller"} currently has ${storeStats.productCount} product${
                storeStats.productCount === 1 ? "" : "s"
              } available.`
            : `No products are currently available for ${storeName || "this seller"}.`}
        </Text>
      </View>

      {!products.length ? (
        <EmptyState label={`No products found for ${storeName || "this seller"}.`} />
      ) : (
        <ProductList
          products={products}
          cartItems={cartItems}
          onAddToCart={onAddToCart}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          onOpenProduct={onOpenProduct}
        />
      )}
    </ScrollView>
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
  screen: {
    padding: 16,
    gap: 16,
    backgroundColor: "#F5F7FB",
  },
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
    flexDirection: "row",
    gap: 10,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroButtonText: {
    color: "#1D4ED8",
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
  sectionIntro: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#102A43",
  },
  sectionText: {
    color: "#64748B",
    lineHeight: 20,
  },
});
