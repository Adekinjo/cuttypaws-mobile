import { useEffect, useState } from "react";
import CategoryService from "../../api/CategoryService";
import ProductService from "../../api/ProductService";
import { AdminButton, AdminCard, AdminScreen, Banner, Field } from "./AdminCommon";

export default function AddProduct({
  formData,
  setFormData,
  onSuccess,
  onBack,
}: {
  formData: FormData;
  setFormData: (builder: () => FormData) => void;
  onSuccess?: () => void;
  onBack?: () => void;
}) {
  const [categories, setCategories] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    CategoryService.getAllCategories().then((res) =>
      setCategories(res.categoryList || [])
    );
  }, []);

  const submit = async () => {
    try {
      await ProductService.addProduct(formData);
      setMessage("Product created successfully");
      onSuccess?.();
    } catch (error: any) {
      setMessage(error?.message || "Failed to create product");
    }
  };

  return (
    <AdminScreen
      title="Add Product"
      subtitle="Create a product from prepared form data"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner message={message} tone={message.includes("success") ? "success" : "error"} />
      <AdminCard>
        <Field label="Categories Loaded" value={String(categories.length)} onChangeText={() => {}} />
        <AdminButton label="Submit Product" onPress={submit} />
      </AdminCard>
    </AdminScreen>
  );
}
