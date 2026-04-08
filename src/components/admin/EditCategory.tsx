import { useEffect, useState } from "react";
import CategoryService from "../../api/CategoryService";
import { AdminButton, AdminCard, AdminScreen, Banner, Field } from "./AdminCommon";

type ImageFile = { uri: string; name: string; type: string };

export default function EditCategory({
  categoryId,
  selectedImage,
  onPickImage,
  onSuccess,
  onBack,
}: {
  categoryId: string;
  selectedImage?: ImageFile | null;
  onPickImage?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}) {
  const [name, setName] = useState("");
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const response = await CategoryService.getCategoryById(categoryId);
      const category = response.category;
      setName(category?.name || "");
      setSubCategories(category?.subCategories || []);
    })();
  }, [categoryId]);

  const save = async () => {
    try {
      await CategoryService.updateCategory(
        categoryId,
        {
          name,
          subCategories: subCategories.map((subCat) => ({
            id: subCat.id,
            name: subCat.name,
          })),
        },
        selectedImage || null
      );
      setMessage("Category updated successfully");
      onSuccess?.();
    } catch (error: any) {
      setMessage(error?.message || "Failed to update category");
    }
  };

  return (
    <AdminScreen
      title="Edit Category"
      subtitle="Update category details"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner message={message} tone={message.includes("success") ? "success" : "error"} />
      <AdminCard>
        <Field label="Category Name" value={name} onChangeText={setName} />
        {subCategories.map((subCat, index) => (
          <Field
            key={subCat.id || index}
            label={`Subcategory ${index + 1}`}
            value={subCat.name || ""}
            onChangeText={(value) =>
              setSubCategories((prev) =>
                prev.map((item, i) => (i === index ? { ...item, name: value } : item))
              )
            }
          />
        ))}
        <Field
          label="New Subcategory"
          value={newSubCategory}
          onChangeText={setNewSubCategory}
        />
        <AdminButton
          label="Add Subcategory"
          variant="secondary"
          onPress={() => {
            if (!newSubCategory.trim()) return;
            setSubCategories((prev) => [...prev, { id: `${Date.now()}`, name: newSubCategory }]);
            setNewSubCategory("");
          }}
        />
        <AdminButton label="Pick Image" variant="secondary" onPress={onPickImage} />
        <AdminButton label="Save Category" onPress={save} />
      </AdminCard>
    </AdminScreen>
  );
}
