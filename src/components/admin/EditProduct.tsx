import { useEffect, useState } from "react";
import ProductService from "../../api/ProductService";
import { AdminButton, AdminCard, AdminScreen, Banner, Field } from "./AdminCommon";

export default function EditProduct({
  productId,
  onBack,
  onSubmit,
}: {
  productId: string;
  onBack?: () => void;
  onSubmit?: (product: any) => Promise<FormData>;
}) {
  const [product, setProduct] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    ProductService.getProductById(productId).then((res) => setProduct(res.product));
  }, [productId]);

  const save = async () => {
    if (!onSubmit) return;
    try {
      const payload = await onSubmit(product);
      await ProductService.updateProduct(productId, payload);
      setMessage("Product updated successfully");
    } catch (error: any) {
      setMessage(error?.message || "Failed to update product");
    }
  };

  return (
    <AdminScreen
      title="Edit Product"
      subtitle="Update product"
      action={<AdminButton label="Back" variant="secondary" onPress={onBack} />}
    >
      <Banner message={message} tone={message.includes("success") ? "success" : "error"} />
      <AdminCard>
        <Field label="Name" value={product?.name || ""} onChangeText={(value) => setProduct((prev: any) => ({ ...prev, name: value }))} />
        <Field label="Description" value={product?.description || ""} onChangeText={(value) => setProduct((prev: any) => ({ ...prev, description: value }))} multiline />
        <Field label="Price" value={String(product?.newPrice || "")} onChangeText={(value) => setProduct((prev: any) => ({ ...prev, newPrice: value }))} keyboardType="numeric" />
        <AdminButton label="Save Product" onPress={save} />
      </AdminCard>
    </AdminScreen>
  );
}
