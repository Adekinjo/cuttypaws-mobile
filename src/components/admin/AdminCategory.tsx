import { Alert, Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import CategoryService from "../../api/CategoryService";
import { AdminButton, AdminCard, AdminScreen, EmptyState, LoadingState, Row } from "./AdminCommon";

export default function AdminCategory({
  onAddCategory,
  onEditCategory,
  onEditSubCategory,
}: {
  onAddCategory?: () => void;
  onEditCategory?: (id: string) => void;
  onEditSubCategory?: (id: string) => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await CategoryService.getAllCategories();
      setCategories(response.categoryList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const confirmDeleteCategory = (id: string, name: string) =>
    Alert.alert("Delete category", `Delete "${name}" and its subcategories?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await CategoryService.deleteCategory(id);
          fetchCategories();
        },
      },
    ]);

  const confirmDeleteSubCategory = (id: string, name: string) =>
    Alert.alert("Delete subcategory", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await CategoryService.deleteSubCategory(id);
          fetchCategories();
        },
      },
    ]);

  return (
    <AdminScreen
      title="Category Management"
      subtitle="Manage categories and subcategories"
      action={<AdminButton label="Add Category" onPress={onAddCategory} />}
    >
      {loading ? <LoadingState label="Loading categories..." /> : null}
      {!loading && categories.length === 0 ? <EmptyState label="No categories found." /> : null}
      {!loading &&
        categories.map((category) => (
          <AdminCard key={category.id}>
            <Pressable onPress={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}>
              <Row label="Category" value={category.name} />
              <Row
                label="Subcategories"
                value={category.subCategories?.length || 0}
              />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <AdminButton label="Edit" onPress={() => onEditCategory?.(category.id)} />
              <AdminButton
                label="Delete"
                variant="danger"
                onPress={() => confirmDeleteCategory(category.id, category.name)}
              />
            </View>
            {expandedCategory === category.id &&
              (category.subCategories || []).map((subCategory: any) => (
                <View key={subCategory.id} style={{ gap: 8, paddingTop: 8 }}>
                  <Text>{subCategory.name}</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <AdminButton
                      label="Edit Subcategory"
                      variant="secondary"
                      onPress={() => onEditSubCategory?.(subCategory.id)}
                    />
                    <AdminButton
                      label="Delete"
                      variant="danger"
                      onPress={() =>
                        confirmDeleteSubCategory(subCategory.id, subCategory.name)
                      }
                    />
                  </View>
                </View>
              ))}
          </AdminCard>
        ))}
    </AdminScreen>
  );
}
