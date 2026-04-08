import { Alert } from "react-native";
import { useEffect, useMemo, useState } from "react";
import DealService from "../../api/DealService";
import { AdminButton, AdminCard, AdminScreen, EmptyState, Field, LoadingState, Row } from "./AdminCommon";

export default function AdminDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productId, setProductId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDeals = async () => {
    try {
      const response = await DealService.getActiveDeals();
      setDeals(response.dealList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const filteredDeals = useMemo(
    () =>
      deals.filter(
        (deal) =>
          String(deal.product?.id || "").includes(searchTerm) ||
          String(deal.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [deals, searchTerm]
  );

  const submit = async () => {
    const dealDto = {
      product: { id: productId },
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      discountPercentage: parseFloat(discountPercentage),
    };

    if (editingDealId) {
      await DealService.updateDeal(editingDealId, dealDto);
    } else {
      await DealService.createDeal(dealDto);
    }
    setEditingDealId(null);
    setProductId("");
    setStartDate("");
    setEndDate("");
    setDiscountPercentage("");
    loadDeals();
  };

  return (
    <AdminScreen title="Deals" subtitle="Create and manage deals">
      <AdminCard>
        <Field label="Search" value={searchTerm} onChangeText={setSearchTerm} />
        <Field label="Product ID" value={productId} onChangeText={setProductId} keyboardType="numeric" />
        <Field label="Start Date ISO/Input" value={startDate} onChangeText={setStartDate} />
        <Field label="End Date ISO/Input" value={endDate} onChangeText={setEndDate} />
        <Field label="Discount %" value={discountPercentage} onChangeText={setDiscountPercentage} keyboardType="numeric" />
        <AdminButton label={editingDealId ? "Update Deal" : "Create Deal"} onPress={submit} />
      </AdminCard>
      {loading ? <LoadingState label="Loading deals..." /> : null}
      {!loading && filteredDeals.length === 0 ? <EmptyState label="No deals found." /> : null}
      {!loading &&
        filteredDeals.map((deal) => (
          <AdminCard key={deal.id}>
            <Row label="Product" value={deal.product?.name} />
            <Row label="Discount" value={`${deal.discountPercentage}%`} />
            <Row label="Status" value={deal.active ? "Active" : "Inactive"} />
            <AdminButton
              label="Edit"
              variant="secondary"
              onPress={() => {
                setEditingDealId(deal.id);
                setProductId(String(deal.product?.id || ""));
                setStartDate(deal.startDate || "");
                setEndDate(deal.endDate || "");
                setDiscountPercentage(String(deal.discountPercentage || ""));
              }}
            />
            <AdminButton
              label={deal.active ? "Deactivate" : "Activate"}
              variant="secondary"
              onPress={async () => {
                await DealService.toggleDealStatus(deal.id, !deal.active);
                loadDeals();
              }}
            />
            <AdminButton
              label="Delete"
              variant="danger"
              onPress={() =>
                Alert.alert("Delete deal", "Delete this deal?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await DealService.deleteDeal(deal.id);
                      loadDeals();
                    },
                  },
                ])
              }
            />
          </AdminCard>
        ))}
    </AdminScreen>
  );
}
