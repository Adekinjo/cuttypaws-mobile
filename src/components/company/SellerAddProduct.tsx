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
} from "../admin/AdminCommon";

type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

export default function SellerAddProduct({
  selectedImages = [],
  onPickImages,
  onBack,
  onSuccess,
}: {
  selectedImages?: ImageFile[];
  onPickImages?: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await CategoryService.getAllCategories();
        setCategories(res.categoryList || []);
      } catch (error: any) {
        setMessage(error?.message || "Failed to fetch categories. Please try again.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId("");
      return;
    }

    (async () => {
      try {
        const res = await CategoryService.getCategoryById(categoryId);
        setSubCategories(res?.category?.subCategories || []);
      } catch (error: any) {
        setMessage(error?.message || "Failed to fetch subcategories. Please try again.");
      }
    })();
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

  const buildFormData = () => {
    const formData = new FormData();

    selectedImages.forEach((image) => {
      formData.append("images", image as unknown as Blob);
    });

    formData.append("name", name);
    formData.append("stock", stock || "0");
    formData.append("categoryId", categoryId);
    formData.append("subCategoryId", subCategoryId);
    formData.append("description", description);
    formData.append("oldPrice", oldPrice || "0");
    formData.append("newPrice", newPrice);

    sizes
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => formData.append("sizes", value));

    colors
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => formData.append("colors", value));

    return formData;
  };

  const handleSubmit = async () => {
    setMessage("");

    if (!name || !description || !newPrice || !categoryId || selectedImages.length === 0) {
      setMessage("Please fill out all required fields and upload at least one image.");
      return;
    }

    try {
      setLoading(true);
      const response = await ProductService.addProduct(buildFormData());
      if (response?.status === 200 || response?.message) {
        setMessage("Product created successfully!");
        onSuccess?.();
      }
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Unable to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminScreen
      title="Add Product"
      subtitle="Create a new seller product"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <AdminCard>
        <Text style={styles.sectionTitle}>Images</Text>
        <AdminButton
          label={selectedImages.length ? "Change Images" : "Pick Images"}
          variant="secondary"
          onPress={onPickImages}
        />
        {selectedImages.length > 0 ? (
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
        ) : (
          <Text style={styles.helperText}>Upload one or more product images.</Text>
        )}
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Category</Text>
        <Text style={styles.helperText}>
          {selectedCategoryName ? `Selected: ${selectedCategoryName}` : "Select a category"}
        </Text>
        <View style={styles.chipWrap}>
          {categories.map((category) => {
            const selected = String(category.id) === String(categoryId);
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(String(category.id))}
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
              ? `Selected: ${selectedSubCategoryName}`
              : "Select a subcategory"}
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
        <Field label="Product Name" value={name} onChangeText={setName} placeholder="Enter product name" />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter product description"
          multiline
        />
        <Field
          label="Stock"
          value={stock}
          onChangeText={setStock}
          placeholder="Enter quantity in stock"
          keyboardType="numeric"
        />
        <Field
          label="Old Price"
          value={oldPrice}
          onChangeText={setOldPrice}
          placeholder="Optional old price"
          keyboardType="numeric"
        />
        <Field
          label="New Price"
          value={newPrice}
          onChangeText={setNewPrice}
          placeholder="Enter new price"
          keyboardType="numeric"
        />
        <Field
          label="Sizes"
          value={sizes}
          onChangeText={setSizes}
          placeholder="Comma-separated sizes e.g. S,M,L"
        />
        <Field
          label="Colors"
          value={colors}
          onChangeText={setColors}
          placeholder="Comma-separated colors e.g. Red,Blue"
        />
        <AdminButton
          label={loading ? "Adding Product..." : "Add Product"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </AdminCard>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
  helperText: {
    color: "#64748B",
    lineHeight: 20,
  },
  imageRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
  },
  previewImage: {
    width: 110,
    height: 110,
    borderRadius: 14,
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
    color: "#fff",
  },
});
