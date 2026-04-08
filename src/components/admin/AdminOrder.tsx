import { useEffect, useMemo, useState } from "react";
import OrderService from "../../api/OrderService";
import { AdminButton, AdminCard, AdminScreen, EmptyState, Field, LoadingState, Row } from "./AdminCommon";

const statuses = ["", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

export default function AdminOrder({
  onOpenOrder,
}: {
  onOpenOrder?: (itemId: string) => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = status
        ? await OrderService.getAllOrderItemsByStatus(status)
        : await OrderService.getAllOrders();
      setOrders(response.orderItemList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.price || 0), 0),
    [orders]
  );

  return (
    <AdminScreen title="Orders" subtitle="Manage customer orders">
      <AdminCard>
        <Field label="Filter Status" value={status} onChangeText={setStatus} placeholder={statuses.join(", ")} />
        <Row label="Total Orders" value={orders.length} />
        <Row label="Revenue" value={`₦${revenue.toFixed(2)}`} />
      </AdminCard>
      {loading ? <LoadingState label="Loading orders..." /> : null}
      {!loading && orders.length === 0 ? <EmptyState label="No orders found." /> : null}
      {!loading &&
        orders.map((order) => (
          <AdminCard key={order.id}>
            <Row label="Order ID" value={order.id} />
            <Row label="Customer" value={order.user?.name} />
            <Row label="Status" value={order.status} />
            <Row label="Amount" value={`₦${Number(order.price || 0).toFixed(2)}`} />
            <AdminButton label="View Details" onPress={() => onOpenOrder?.(order.id)} />
          </AdminCard>
        ))}
    </AdminScreen>
  );
}
