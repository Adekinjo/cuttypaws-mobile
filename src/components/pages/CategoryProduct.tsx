import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import ProductService from "../../api/ProductService";
import Pagination from "../common/Pagination";
import ProductList from "../common/ProductList";
import { Banner, EmptyState, LoadingState } from "../admin/AdminCommon";

type ProductItem = {
  id: string;
  name: string;
  oldPrice?: number;
  newPrice?: number;
  imageUrls?: string[];
  imageUrl?: string;
  category?: string | { name?: string };
  subCategory?: string | { name?: string };
  createdAt?: string;
};

export default function CategoryProduct({
  categoryId,
  categoryName,
  cartItems = [],
  onAddToCart,
  onIncrement,
  onDecrement,
  onOpenProduct,
}: {
  categoryId: string;
  categoryName?: string;
  cartItems?: Array<{ id: string; quantity: number }>;
  onAddToCart?: (product: any) => void;
  onIncrement?: (product: any) => void;
  onDecrement?: (product: any) => void;
  onOpenProduct?: (product: any) => void;
}) {
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await ProductService.getAllProductByCategoryId(categoryId);
        if (!mounted) return;
        setAllProducts(response?.productList || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to fetch products by category"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [categoryId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId]);

  const totalPages = Math.max(1, Math.ceil(allProducts.length / itemsPerPage));

  const products = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allProducts.slice(startIndex, endIndex);
  }, [allProducts, currentPage]);

  const summary = useMemo(() => {
    const discounted = allProducts.filter(
      (product) =>
        Number(product?.oldPrice || 0) > 0 &&
        Number(product?.oldPrice || 0) > Number(product?.newPrice || 0)
    ).length;

    const averagePrice = allProducts.length
      ? allProducts.reduce((sum, product) => sum + Number(product?.newPrice || 0), 0) /
        allProducts.length
      : 0;

    return {
      count: allProducts.length,
      discounted,
      averagePrice,
    };
  }, [allProducts]);

  if (loading) {
    return <LoadingState label="Loading category products..." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner message={error} tone="error" />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Category Products</Text>
          <Text style={styles.heroTitle}>
            {categoryName || "Category"} picks in one place
          </Text>
          <Text style={styles.heroBody}>
            Browse items grouped by category, compare prices faster, and move through the catalog
            with a tighter mobile shopping flow.
          </Text>
        </View>

        <View style={styles.statRow}>
          <StatCard label="Products" value={String(summary.count)} />
          <StatCard label="Discounted" value={String(summary.discounted)} />
          <StatCard label="Avg. Price" value={`₦${summary.averagePrice.toFixed(2)}`} />
        </View>
      </View>

      {!error && allProducts.length === 0 ? (
        <EmptyState label="No products found in this category." />
      ) : null}

      {!error && allProducts.length > 0 ? (
        <>
          <ProductList
            products={products}
            cartItems={cartItems}
            onAddToCart={onAddToCart}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onOpenProduct={onOpenProduct}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : null}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: "#EEF3F8",
  },
  heroCard: {
    backgroundColor: "#102A43",
    borderRadius: 24,
    padding: 20,
    gap: 18,
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
    lineHeight: 34,
  },
  heroBody: {
    color: "#D9E2EC",
    lineHeight: 22,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 110,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  statLabel: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "800",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
});
