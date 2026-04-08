import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryService from "../../api/CategoryService";
import Footer from "../common/Footer";
import RecentView from "./RecentView";
import SubCategoryHeroBanner from "../category/SubCategoryHeroBanner";
import SubCategoryCard from "../category/SubCategoryCard";
import SubCategoryEmptyState from "../category/SubCategoryEmptyState";

type CategoryItem = {
  id: string | number;
  name?: string;
  imageUrl?: string;
};

type SubCategoryItem = {
  id: string | number;
  name?: string;
  imageUrl?: string;
};

export default function SubCategoryListPage({
  categoryId,
  onNavigate,
  onOpenSubCategory,
}: {
  categoryId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenSubCategory?: (subCategoryId: string | number) => void;
}) {
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [category, setCategory] = useState<CategoryItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubCategories = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const categoryResponse = await CategoryService.getCategoryById(categoryId);
      setCategory(categoryResponse?.category || null);

      const subCategoryResponse = await CategoryService.getSubCategoriesByCategory(categoryId);
      setSubCategories(subCategoryResponse?.subCategoryList || []);
    } catch (fetchError: any) {
      console.error("Error fetching subcategories:", fetchError);
      setError(
        fetchError?.response?.data?.message ||
          fetchError?.message ||
          "Unable to fetch subcategories."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, [categoryId]);

  const summary = useMemo(
    () => ({
      totalSubCategories: subCategories.length,
      hasBanner: Boolean(category?.imageUrl),
    }),
    [category, subCategories]
  );

  const handleSubCategoryClick = (subCategoryId: string | number) => {
    onOpenSubCategory?.(subCategoryId);
    onNavigate?.("products-sub-category", { subCategoryId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Loading subcategories...</Text>
          <Text style={styles.centerText}>Preparing the category details and available sections.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={styles.errorIconWrap}>
            <Feather name="alert-triangle" size={22} color="#991B1B" />
          </View>
          <Text style={styles.centerTitle}>Could not load subcategories</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => fetchSubCategories()}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSubCategories(true)}
            tintColor="#0F766E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="shape-outline" size={16} color="#0F172A" />
            <Text style={styles.heroBadgeText}>Subcategories</Text>
          </View>

          <Text style={styles.heroTitle}>{category?.name || "Category"}</Text>
          <Text style={styles.heroSubtitle}>
            Explore our curated subcategories and jump directly into the part of the catalog that
            fits what you need.
          </Text>

          <View style={styles.heroStatRow}>
            <StatPill label="Subcategories" value={String(summary.totalSubCategories)} />
            <StatPill label="Banner image" value={summary.hasBanner ? "Available" : "Hidden"} />
          </View>
        </View>

        <SubCategoryHeroBanner
          categoryName={category?.name || "Category"}
          subtitle={`Explore our wide range of ${(category?.name || "pet").toLowerCase()} subcategories.`}
          imageUrl={category?.imageUrl}
          totalSubCategories={summary.totalSubCategories}
          onBack={() => onNavigate?.("categories")}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Subcategories</Text>
          <Text style={styles.sectionSubtitle}>Choose a subcategory to explore products.</Text>
        </View>

        {subCategories.length === 0 ? (
          <SubCategoryEmptyState
            title="No Subcategories Found"
            description="There are no subcategories available for this category yet."
            onBack={() => onNavigate?.("categories")}
          />
        ) : (
          <View style={styles.grid}>
            {subCategories.map((subCategory) => (
              <SubCategoryCard
                key={String(subCategory.id)}
                title={subCategory.name || "Subcategory"}
                imageUrl={subCategory.imageUrl}
                subtitle={`ID: ${subCategory.id}`}
                onPress={() => handleSubCategoryClick(subCategory.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.backWrap}>
          <Pressable style={styles.secondaryButton} onPress={() => onNavigate?.("categories")}>
            <Feather name="arrow-left" size={16} color="#102A43" />
            <Text style={styles.secondaryButtonText}>Back to All Categories</Text>
          </Pressable>
        </View>

        <RecentView onNavigate={onNavigate} />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF3F8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#EEF3F8",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    gap: 16,
    backgroundColor: "#102A43",
  },
  heroGlowOne: {
    position: "absolute",
    top: -28,
    right: -12,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.18)",
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
    color: "#D9E2EC",
    lineHeight: 22,
    fontSize: 15,
  },
  heroStatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statPill: {
    minWidth: 118,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
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
  sectionHeader: {
    gap: 4,
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
  grid: {
    gap: 12,
  },
  backWrap: {
    alignItems: "center",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  secondaryButtonText: {
    color: "#102A43",
    fontWeight: "900",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: "#EEF3F8",
  },
  centerTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  centerText: {
    color: "#486581",
    lineHeight: 22,
    textAlign: "center",
  },
  errorIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  primaryButton: {
    minWidth: 160,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
