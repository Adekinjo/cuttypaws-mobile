import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import ProductService from "../../api/ProductService";
import ProductList from "../common/ProductList";
import LoadingSpinner from "../common/LoadingSpinner";

type SellerProduct = {
  id: string;
  name: string;
  oldPrice?: number;
  newPrice?: number;
  imageUrls?: string[];
  sellerName?: string;
  companyName?: string;
  category?: string;
  subCategory?: string;
};

export default function Seller({
  sellerName,
  cartItems = [],
  maxItems = 10,
  onAddToCart,
  onIncrement,
  onDecrement,
  onOpenProduct,
  onViewAll,
}: {
  sellerName: string;
  cartItems?: Array<{ id: string; quantity: number }>;
  maxItems?: number;
  onAddToCart?: (product: SellerProduct) => void;
  onIncrement?: (product: SellerProduct) => void;
  onDecrement?: (product: SellerProduct) => void;
  onOpenProduct?: (product: SellerProduct) => void;
  onViewAll?: (sellerName: string) => void;
}) {
  const [allProducts, setAllProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchSellerProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await ProductService.getAllProduct();
        if (!mounted) return;

        setAllProducts(response?.productList || []);
      } catch (error: any) {
        if (!mounted) return;
        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to fetch products"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSellerProducts();

    return () => {
      mounted = false;
    };
  }, [sellerName]);

  const sellerProducts = useMemo(() => {
    const normalizedSeller = sellerName.trim().toLowerCase();

    return allProducts.filter((product) => {
      const productSeller = (product.sellerName || product.companyName || "")
        .trim()
        .toLowerCase();

      return productSeller === normalizedSeller;
    });
  }, [allProducts, sellerName]);

  const previewProducts = useMemo(
    () => sellerProducts.slice(0, maxItems),
    [maxItems, sellerProducts]
  );

  if (loading) {
    return (
      <View style={styles.section}>
        <LoadingSpinner label={`Loading ${sellerName} products...`} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>{sellerName} Products</Text>
        </View>
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (sellerProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{sellerName} Products</Text>
          <Text style={styles.subtitle}>
            Featured items from this seller
          </Text>
        </View>

        <Pressable
          onPress={() => onViewAll?.(sellerName)}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        <View style={styles.productRail}>
          <ProductList
            products={previewProducts}
            cartItems={cartItems}
            onAddToCart={onAddToCart}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            onOpenProduct={onOpenProduct}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#102A43",
  },
  subtitle: {
    color: "#5C6F82",
    fontSize: 14,
  },
  viewAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewAllText: {
    color: "#102A43",
    fontWeight: "700",
  },
  horizontalList: {
    paddingRight: 6,
  },
  productRail: {
    minWidth: 720,
  },
  messageCard: {
    backgroundColor: "#FDECEC",
    borderRadius: 14,
    padding: 14,
  },
  errorText: {
    color: "#B42318",
    fontWeight: "600",
  },
});
