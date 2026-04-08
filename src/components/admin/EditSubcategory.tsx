import { useEffect, useState } from "react";
import CategoryService from "../../api/CategoryService";
import { AdminButton, AdminCard, AdminScreen, Banner, Field } from "./AdminCommon";

type ImageFile = { uri: string; name: string; type: string };

export default function EditSubcategory({
  subCategoryId,
  selectedImage,
  onPickImage,
  onSuccess,
  onBack,
}: {
  subCategoryId: string;
  selectedImage?: ImageFile | null;
  onPickImage?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const response = await CategoryService.getSubCategoryById(subCategoryId);
      setName(response.subCategory?.name || "");
    })();
  }, [subCategoryId]);

  const save = async () => {
    try {
      await CategoryService.updateSubCategory(subCategoryId, { name }, selectedImage || null);
      setMessage("Subcategory updated successfully");
      onSuccess?.();
    } catch (error: any) {
      setMessage(error?.message || "Failed to update subcategory");
    }
  };

  return (
    <AdminScreen
      title="Edit Subcategory"
      subtitle="Update subcategory details"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner message={message} tone={message.includes("success") ? "success" : "error"} />
      <AdminCard>
        <Field label="Name" value={name} onChangeText={setName} />
        <AdminButton label="Pick Image" variant="secondary" onPress={onPickImage} />
        <AdminButton label="Save Subcategory" onPress={save} />
      </AdminCard>
    </AdminScreen>
  );
}
