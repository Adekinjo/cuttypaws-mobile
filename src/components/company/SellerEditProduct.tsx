import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import CategoryService from "../../api/CategoryService";
import ProductService from "../../api/ProductService";
import {
  AdminButton,
  AdminCard,
  AdminScreen,
  Banner,
  Field,
  LoadingState,
} from "../admin/AdminCommon";

type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

type ProductRecord = {
  id?: string;
  name?: string;
  description?: string;
  stock?: string | number;
  oldPrice?: string | number;
  newPrice?: string | number;
  categoryId?: string | number;
  subCategoryId?: string | number;
  sizes?: string[] | string;
  colors?: string[] | string;
  imageUrls?: string[];
};

export default function SellerEditProduct({
  productId,
  selectedImages = [],
  onPickImages,
  onBack,
  onSuccess,
}: {
  productId: string;
  selectedImages?: ImageFile[];
  onPickImages?: () => void;
  onBack?: () => void;
  onSuccess?: (product?: any) => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [categoryResponse, productResponse] = await Promise.all([
          CategoryService.getAllCategories(),
          ProductService.getProductById(productId),
        ]);

        if (cancelled) return;

        const product: ProductRecord = productResponse?.product || {};
        setCategories(categoryResponse?.categoryList || []);
        setName(product.name || "");
        setDescription(product.description || "");
        setStock(String(product.stock ?? ""));
        setOldPrice(String(product.oldPrice ?? ""));
        setNewPrice(String(product.newPrice ?? ""));
        setCategoryId(product.categoryId ? String(product.categoryId) : "");
        setSubCategoryId(product.subCategoryId ? String(product.subCategoryId) : "");
        setExistingImages(Array.isArray(product.imageUrls) ? product.imageUrls : []);
        setSizes(
          Array.isArray(product.sizes) ? product.sizes.join(", ") : String(product.sizes || "")
        );
        setColors(
          Array.isArray(product.colors)
            ? product.colors.join(", ")
            : String(product.colors || "")
        );
      } catch (error: any) {
        if (!cancelled) {
          setMessage(error?.message || "Failed to load product details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    let cancelled = false;

    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId("");
      return;
    }

    const loadSubCategories = async () => {
      try {
        const response = await CategoryService.getCategoryById(categoryId);
        if (cancelled) return;
        setSubCategories(response?.category?.subCategories || []);
      } catch (error: any) {
        if (!cancelled) {
          setMessage(error?.message || "Failed to fetch subcategories.");
        }
      }
    };

    loadSubCategories();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const selectedCategoryName = useMemo(
    () => categories.find((item) => String(item.id) === String(categoryId))?.name || "",
    [categories, categoryId]
  );

  const selectedSubCategoryName = useMemo(
    () =>
      subCategories.find((item) => String(item.id) === String(subCategoryId))?.name || "",
    [subCategories, subCategoryId]
  );

  const parsedSizeList = useMemo(
    () =>
      sizes
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [sizes]
  );

  const parsedColorList = useMemo(
    () =>
      colors
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [colors]
  );

  const buildFormData = () => {
    const formData = new FormData();

    selectedImages.forEach((image) => {
      formData.append("images", image as unknown as Blob);
    });

    formData.append("name", name.trim());
    formData.append("stock", stock.trim() || "0");
    formData.append("categoryId", categoryId);
    formData.append("subCategoryId", subCategoryId);
    formData.append("description", description.trim());
    formData.append("oldPrice", oldPrice.trim() || "0");
    formData.append("newPrice", newPrice.trim());

    parsedSizeList.forEach((value) => formData.append("sizes", value));
    parsedColorList.forEach((value) => formData.append("colors", value));

    return formData;
  };

  const handleSubmit = async () => {
    setMessage("");

    if (!name.trim() || !description.trim() || !newPrice.trim() || !categoryId) {
      setMessage("Please fill out all required fields.");
      return;
    }

    try {
      setSaving(true);
      const response = await ProductService.updateProduct(productId, buildFormData());
      setMessage(response?.message || "Product updated successfully!");
      onSuccess?.(response?.product ?? response);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  const heroMetric = selectedImages.length
    ? `${selectedImages.length} new image${selectedImages.length === 1 ? "" : "s"} selected`
    : `${existingImages.length} live image${existingImages.length === 1 ? "" : "s"} on listing`;

  if (loading) {
    return (
      <AdminScreen
        title="Edit Product"
        subtitle="Update your listing details"
        action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
      >
        <LoadingState label="Loading product..." />
      </AdminScreen>
    );
  }

  return (
    <AdminScreen
      title="Edit Product"
      subtitle="Refine your product details, pricing, and media"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Seller Workspace</Text>
          <Text style={styles.heroTitle}>{name || "Product listing"}</Text>
          <Text style={styles.heroBody}>
            Keep your listing accurate. Price, stock, category placement, and media are all
            updated from this screen.
          </Text>
        </View>
        <View style={styles.heroMetrics}>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Current price</Text>
            <Text style={styles.metricValue}>${newPrice || "0"}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricLabel}>Media status</Text>
            <Text style={styles.metricValueSmall}>{heroMetric}</Text>
          </View>
        </View>
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Listing Images</Text>
        <Text style={styles.helperText}>
          Existing images stay on the product unless the backend replaces them when new files are
          uploaded. Pick new images only when you want to refresh the gallery.
        </Text>
        <AdminButton
          label={selectedImages.length ? "Replace Selected Images" : "Pick New Images"}
          variant="secondary"
          onPress={onPickImages}
        />

        {selectedImages.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>New Images Ready to Upload</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imageRow}>
                {selectedImages.map((image, index) => (
                  <Image
                    key={`${image.uri}-${index}`}
                    source={{ uri: image.uri }}
                    style={styles.previewImage}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {existingImages.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Current Live Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imageRow}>
                {existingImages.map((imageUrl, index) => (
                  <Image
                    key={`${imageUrl}-${index}`}
                    source={{ uri: imageUrl }}
                    style={styles.previewImage}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.helperText}>No existing product images were found.</Text>
        )}
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Category Placement</Text>
        <Text style={styles.helperText}>
          {selectedCategoryName ? `Category: ${selectedCategoryName}` : "Choose a category"}
        </Text>
        <View style={styles.chipWrap}>
          {categories.map((category) => {
            const selected = String(category.id) === String(categoryId);
            return (
              <Pressable
                key={category.id}
                onPress={() => {
                  setCategoryId(String(category.id));
                  setSubCategoryId("");
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AdminCard>

      {categoryId ? (
        <AdminCard>
          <Text style={styles.sectionTitle}>Subcategory</Text>
          <Text style={styles.helperText}>
            {selectedSubCategoryName
              ? `Subcategory: ${selectedSubCategoryName}`
              : "Choose a subcategory"}
          </Text>
          <View style={styles.chipWrap}>
            {subCategories.map((subCategory) => {
              const selected = String(subCategory.id) === String(subCategoryId);
              return (
                <Pressable
                  key={subCategory.id}
                  onPress={() => setSubCategoryId(String(subCategory.id))}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {subCategory.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </AdminCard>
      ) : null}

      <AdminCard>
        <Text style={styles.sectionTitle}>Core Details</Text>
        <Field
          label="Product Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
        />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the product clearly"
          multiline
        />
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Field
              label="Stock"
              value={stock}
              onChangeText={setStock}
              placeholder="Qty in stock"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.column}>
            <Field
              label="New Price"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder="Current selling price"
              keyboardType="numeric"
            />
          </View>
        </View>
        <Field
          label="Old Price"
          value={oldPrice}
          onChangeText={setOldPrice}
          placeholder="Optional previous price"
          keyboardType="numeric"
        />
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Options</Text>
        <Field
          label="Sizes"
          value={sizes}
          onChangeText={setSizes}
          placeholder="Comma-separated sizes e.g. S, M, L"
        />
        {parsedSizeList.length > 0 ? (
          <View style={styles.tokenWrap}>
            {parsedSizeList.map((value) => (
              <View key={value} style={styles.token}>
                <Text style={styles.tokenText}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <Field
          label="Colors"
          value={colors}
          onChangeText={setColors}
          placeholder="Comma-separated colors e.g. Red, Blue"
        />
        {parsedColorList.length > 0 ? (
          <View style={styles.tokenWrap}>
            {parsedColorList.map((value) => (
              <View key={value} style={[styles.token, styles.tokenAccent]}>
                <Text style={styles.tokenText}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </AdminCard>

      <AdminCard>
        <View style={styles.submitRow}>
          <View style={styles.submitTextBlock}>
            <Text style={styles.submitTitle}>Save listing changes</Text>
            <Text style={styles.helperText}>
              Review your pricing, category, and media choices before pushing the update live.
            </Text>
          </View>
          <AdminButton
            label={saving ? "Updating Product..." : "Update Product"}
            onPress={handleSubmit}
            disabled={saving}
          />
        </View>
      </AdminCard>
    </AdminScreen>
  );
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
    color: "#7DD3FC",
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
  heroMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricPill: {
    flex: 1,
    minWidth: 140,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
  },
  metricValueSmall: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
  helperText: {
    color: "#64748B",
    lineHeight: 20,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  imageRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 2,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  chipSelected: {
    backgroundColor: "#2563EB",
  },
  chipText: {
    color: "#102A43",
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  tokenWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  token: {
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tokenAccent: {
    backgroundColor: "#DCFCE7",
  },
  tokenText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  submitRow: {
    gap: 12,
  },
  submitTextBlock: {
    gap: 4,
  },
  submitTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
});
