import { Alert, Pressable, Text } from "react-native";
import { useEffect, useMemo, useState } from "react";
import ProductService from "../../api/ProductService";
import { AdminButton, AdminCard, AdminScreen, EmptyState, LoadingState, Row } from "./AdminCommon";

export default function AdminProduct({
  onAdd,
  onEdit,
}: {
  onAdd?: () => void;
  onEdit?: (productId: string) => void;
}) {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const fetchProducts = async () => {
    try {
      const response = await ProductService.getAllProduct();
      setAllProducts(response.productList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const products = useMemo(
    () => allProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage),
    [allProducts, page]
  );

  const totalPages = Math.max(1, Math.ceil(allProducts.length / itemsPerPage));

  return (
    <AdminScreen
      title="Products"
      subtitle="Manage store products"
      action={<AdminButton label="Add Product" onPress={onAdd} />}
    >
      {loading ? <LoadingState label="Loading products..." /> : null}
      {!loading && products.length === 0 ? <EmptyState label="No products found." /> : null}
      {!loading &&
        products.map((product) => (
          <AdminCard key={product.id}>
            <Row label="Name" value={product.name} />
            <Row label="Price" value={product.newPrice} />
            <Row label="Stock" value={product.stock} />
            <Pressable onPress={() => onEdit?.(product.id)}>
              <Text>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert("Delete product", `Delete "${product.name}"?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await ProductService.deleteProduct(product.id);
                      fetchProducts();
                    },
                  },
                ])
              }
            >
              <Text style={{ color: "#D64545" }}>Delete</Text>
            </Pressable>
          </AdminCard>
        ))}
      {!loading && (
        <AdminCard>
          <Row label="Page" value={`${page} / ${totalPages}`} />
          <AdminButton
            label="Previous"
            variant="secondary"
            onPress={() => setPage((prev) => Math.max(1, prev - 1))}
          />
          <AdminButton
            label="Next"
            variant="secondary"
            onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </AdminCard>
      )}
    </AdminScreen>
  );
}
