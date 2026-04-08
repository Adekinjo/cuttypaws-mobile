import { Feather } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import CategoryService from "../../api/CategoryService";
import LatestProducts from "../common/LatestProducts";
import { useTheme } from "../context/ThemeContext";
import { Banner, EmptyState, LoadingState } from "../admin/AdminCommon";

type CategoryItem = {
  id: string | number;
  name: string;
  imageUrl?: string;
  subCategories?: any[];
};

export default function CategoryListPage({
  onOpenCategory,
  onOpenSubCategories,
  onNavigate,
}: {
  onOpenCategory?: (categoryId: string | number) => void;
  onOpenSubCategories?: (categoryId: string | number) => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await CategoryService.getAllCategories();
      setCategories(response?.categoryList || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const [openCategoryId, setOpenCategoryId] = useState<string | number | null>(null);

  const visibleCategories = useMemo(() => categories.slice(0, 6), [categories]);

  const handleCategoryClick = (category: CategoryItem) => {
    onOpenCategory?.(category.id);
    onNavigate?.("category-product", {
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  const handleSubCategoryClick = (subCategory: any) => {
    const subCategoryId =
      subCategory?.id || subCategory?.subCategoryId || subCategory?.sub_category_id || null;
    if (!subCategoryId) return;
    onNavigate?.("products-sub-category", { subCategoryId });
  };

  if (loading) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState label="Loading categories..." />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <Banner message={error} tone="error" />
        <View style={[styles.centerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.centerTitle, { color: colors.text }]}>Could not load categories</Text>
          <Text style={[styles.centerText, { color: colors.textMuted }]}>
            Try fetching the category list again.
          </Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={loadCategories}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Categories</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Explore our product groups organized for faster discovery.
        </Text>
      </View>

      {categories.length === 0 ? (
        <EmptyState label="No categories available at the moment." />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {visibleCategories.map((category) => {
              const isOpen = openCategoryId === category.id;
              const subCategories = Array.isArray(category.subCategories)
                ? category.subCategories
                : [];

              return (
                <View
                  key={String(category.id)}
                  style={styles.categoryColumn}
                >
                  <Pressable
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: isOpen ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleCategoryClick(category)}
                  >
                    <View
                      style={[
                        styles.imageWrap,
                        {
                          backgroundColor: colors.backgroundMuted,
                          borderBottomColor: colors.borderSoft,
                        },
                      ]}
                    >
                      {category.imageUrl ? (
                        <Image source={{ uri: category.imageUrl }} style={styles.image} />
                      ) : (
                        <View
                          style={[
                            styles.image,
                            styles.imageFallback,
                            { backgroundColor: colors.backgroundMuted },
                          ]}
                        >
                          <Text style={[styles.imageFallbackText, { color: colors.textSoft }]}>
                            No Image
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                    {category.name}
                  </Text>

                  <Pressable
                    style={[
                      styles.dropdownToggle,
                      {
                        backgroundColor: colors.card,
                        borderColor: isOpen ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() =>
                      setOpenCategoryId((prev) => (prev === category.id ? null : category.id))
                    }
                  >
                    <Text style={[styles.dropdownToggleText, { color: colors.text }]}>
                      {isOpen ? "Hide" : "Filter"}
                    </Text>
                    <Feather
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>

                  {isOpen && subCategories.length ? (
                    <View
                      style={[
                        styles.dropdown,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      {subCategories.map((subCategory: any, index: number) => (
                        <Pressable
                          key={String(
                            subCategory?.id || subCategory?.subCategoryId || `${category.id}-${index}`
                          )}
                          style={[
                            styles.dropdownItem,
                            index < subCategories.length - 1 && {
                              borderBottomColor: colors.borderSoft,
                            },
                          ]}
                          onPress={() => handleSubCategoryClick(subCategory)}
                        >
                          <Text style={[styles.dropdownText, { color: colors.text }]}>
                            {subCategory?.name || subCategory?.subCategoryName || "Subcategory"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : isOpen ? (
                    <View
                      style={[
                        styles.dropdown,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.dropdownEmptyText, { color: colors.textMuted }]}>
                        No subcategories available.
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <LatestProducts
            onOpenProduct={(product) =>
              onNavigate?.("product-details", {
                productId: product?.id,
              })
            }
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: "#EEF3F8",
  },
  sectionHeader: {
    gap: 3,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  sectionSubtitle: {
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    paddingRight: 20,
  },
  categoryColumn: {
    width: 132,
    minWidth: 132,
    alignItems: "center",
    gap: 4,
  },
  categoryCard: {
    width: 104,
    height: 104,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
  },
  imageWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  imageFallbackText: {
    color: "#64748B",
    fontWeight: "700",
  },
  cardTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  dropdownToggle: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dropdownToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  dropdownEmptyText: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  centerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  centerTitle: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  centerText: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
