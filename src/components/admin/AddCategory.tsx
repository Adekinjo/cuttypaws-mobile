import { Image, Text } from "react-native";
import { useState } from "react";
import { AdminButton, AdminCard, AdminScreen, Banner, Field } from "./AdminCommon";
import CategoryService from "../../api/CategoryService";

type ImageFile = { uri: string; name: string; type: string };

export default function AddCategory({
  selectedImage,
  onPickImage,
  onSuccess,
  onBack,
}: {
  selectedImage?: ImageFile | null;
  onPickImage?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}) {
  const [categoryName, setCategoryName] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([""]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateSubCategory = (index: number, value: string) => {
    setSubCategories((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const addSubCategory = () => setSubCategories((prev) => [...prev, ""]);

  const removeSubCategory = (index: number) =>
    setSubCategories((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const body = {
        name: categoryName.trim(),
        subCategories: subCategories
          .filter((name) => name.trim())
          .map((name) => ({ name: name.trim() })),
      };

      await CategoryService.createCategory(body, selectedImage || null);
      setMessage("Category created successfully");
      onSuccess?.();
    } catch (error: any) {
      setMessage(error?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminScreen
      title="Add Category"
      subtitle="Create a new category"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner message={message} tone={message.includes("success") ? "success" : "error"} />
      <AdminCard>
        <Field label="Category Name" value={categoryName} onChangeText={setCategoryName} />
        {subCategories.map((value, index) => (
          <Field
            key={index}
            label={`Subcategory ${index + 1}`}
            value={value}
            onChangeText={(text) => updateSubCategory(index, text)}
          />
        ))}
        <AdminButton label="Add Subcategory" variant="secondary" onPress={addSubCategory} />
        {subCategories.length > 1 ? (
          <AdminButton
            label="Remove Last Subcategory"
            variant="danger"
            onPress={() => removeSubCategory(subCategories.length - 1)}
          />
        ) : null}
        <AdminButton label="Pick Image" variant="secondary" onPress={onPickImage} />
        {selectedImage?.uri ? (
          <>
            <Image
              source={{ uri: selectedImage.uri }}
              style={{ width: "100%", height: 180, borderRadius: 12 }}
            />
            <Text>{selectedImage.name}</Text>
          </>
        ) : null}
        <AdminButton label={loading ? "Saving..." : "Create Category"} onPress={handleSubmit} disabled={loading} />
      </AdminCard>
    </AdminScreen>
  );
}
