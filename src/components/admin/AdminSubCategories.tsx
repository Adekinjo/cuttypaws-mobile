import { Alert, Text, TextInput, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import CategoryService from "../../api/CategoryService";
import {
  AdminButton,
  AdminCard,
  AdminScreen,
  EmptyState,
  LoadingState,
  Row,
  adminStyles,
} from "./AdminCommon";

export default function AdminSubCategories({
  onBack,
  onEditSubCategory,
}: {
  onBack?: () => void;
  onEditSubCategory?: (id: string) => void;
}) {
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubCategories = async () => {
    try {
      const response = await CategoryService.getAllSubCategories();
      setSubCategories(response.subCategoryList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, []);

  const filtered = useMemo(
    () =>
      subCategories.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, subCategories]
  );

  return (
    <AdminScreen
      title="Subcategory Management"
      subtitle="Manage product subcategories"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <TextInput
        style={adminStyles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search subcategories..."
      />
      {loading ? <LoadingState label="Loading subcategories..." /> : null}
      {!loading && filtered.length === 0 ? <EmptyState label="No subcategories found." /> : null}
      {!loading &&
        filtered.map((subCategory) => (
          <AdminCard key={subCategory.id}>
            <Row label="Name" value={subCategory.name} />
            <Row
              label="Category"
              value={subCategory.categoryName || subCategory.categoryId}
            />
            <Text>ID: {subCategory.id}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <AdminButton
                label="Edit"
                onPress={() => onEditSubCategory?.(subCategory.id)}
              />
              <AdminButton
                label="Delete"
                variant="danger"
                onPress={() =>
                  Alert.alert("Delete subcategory", `Delete "${subCategory.name}"?`, [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        await CategoryService.deleteSubCategory(subCategory.id);
                        fetchSubCategories();
                      },
                    },
                  ])
                }
              />
            </View>
          </AdminCard>
        ))}
    </AdminScreen>
  );
}
