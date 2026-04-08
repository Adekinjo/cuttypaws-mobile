import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Footer from "../common/Footer";
import RecentlyViewedCard from "../product/RecentlyViewedCard";
import RecentlyViewedEmptyState from "../product/RecentlyViewedEmptyState";
import { getRecentlyViewed } from "../../utils/recentlyViewed";

type ProductItem = {
  id: string | number;
  name?: string;
  newPrice?: number;
  oldPrice?: number;
  imageUrls?: string[];
  category?: string | { name?: string };
  subCategory?: string | { name?: string };
};

const formatPrice = (price?: number) => {
  if (!price) return "Price not available";
  return `$${Number(price).toFixed(2)}`;
};

export default function RecentView({
  onNavigate,
  onOpenProduct,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenProduct?: (product: ProductItem) => void;
}) {
  const [recentlyViewed, setRecentlyViewed] = useState<ProductItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecentlyViewed = async () => {
    try {
      const viewedProducts = await getRecentlyViewed();
      setRecentlyViewed(Array.isArray(viewedProducts) ? viewedProducts : []);
    } catch (error) {
      console.error("Failed to load recently viewed products:", error);
      setRecentlyViewed([]);
    }
  };

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const summary = useMemo(() => {
    const discounted = recentlyViewed.filter(
      (product) =>
        Number(product.oldPrice || 0) > 0 &&
        Number(product.oldPrice || 0) > Number(product.newPrice || 0)
    ).length;

    return {
      total: recentlyViewed.length,
      discounted,
    };
  }, [recentlyViewed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecentlyViewed();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0F766E" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="history" size={16} color="#0F172A" />
            <Text style={styles.heroBadgeText}>Recently viewed</Text>
          </View>

          <Text style={styles.heroTitle}>Pick up where you left off</Text>
          <Text style={styles.heroSubtitle}>
            Your recently opened products stay here so you can compare, revisit, and continue
            shopping without searching again.
          </Text>

          <View style={styles.heroStatRow}>
            <StatPill label="Viewed" value={String(summary.total)} />
            <StatPill label="Discounts" value={String(summary.discounted)} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Quick Return</Text>
              <Text style={styles.sectionTitle}>Recently Viewed Products</Text>
            </View>

            <Pressable style={styles.refreshButton} onPress={handleRefresh}>
              <Feather name="refresh-cw" size={16} color="#0F766E" />
            </Pressable>
          </View>

          <Text style={styles.sectionSubtitle}>
            Open any item again to continue browsing from the same product path.
          </Text>
        </View>

        {recentlyViewed.length === 0 ? (
          <RecentlyViewedEmptyState
            title="No recently viewed products yet"
            description="Products you open will appear here so you can return to them faster."
            onBrowseProducts={() => onNavigate?.("home")}
          />
        ) : (
          <View style={styles.grid}>
            {recentlyViewed.map((product) => (
              <RecentlyViewedCard
                key={String(product.id)}
                product={product}
                title={product.name || "Product"}
                imageUrl={product.imageUrls?.[0]}
                subtitle={formatPrice(product.newPrice)}
                meta={
                  Number(product.oldPrice || 0) > Number(product.newPrice || 0)
                    ? `Was ${formatPrice(product.oldPrice)}`
                    : undefined
                }
                onPress={() => onOpenProduct?.(product)}
              />
            ))}
          </View>
        )}

        {recentlyViewed.length > 0 ? (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>Why this section helps</Text>
            <View style={styles.insightList}>
              <InsightRow text="Jump back into product comparison without repeating search." />
              <InsightRow text="Keep track of items you viewed across pricing and category exploration." />
              <InsightRow text="Move faster between details pages, cart, and discovery flows." />
            </View>
          </View>
        ) : null}

        <Footer onNavigate={(route) => onNavigate?.(route)} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function InsightRow({ text }: { text: string }) {
  return (
    <View style={styles.insightRow}>
      <View style={styles.insightDot} />
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#F5FAF8",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    gap: 16,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -30,
    right: -12,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -42,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(45,212,191,0.14)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#CCFBF1",
  },
  heroBadgeText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    lineHeight: 22,
    fontSize: 15,
  },
  heroStatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statPill: {
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  statLabel: {
    color: "#99F6E4",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionEyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#64748B",
    lineHeight: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  grid: {
    gap: 12,
  },
  insightCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    backgroundColor: "#0F766E",
  },
  insightTitle: {
    color: "#ECFEFF",
    fontSize: 22,
    fontWeight: "900",
  },
  insightList: {
    gap: 12,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  insightDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: "#99F6E4",
  },
  insightText: {
    flex: 1,
    color: "#CCFBF1",
    lineHeight: 21,
  },
});
