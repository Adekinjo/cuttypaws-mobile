import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import OrderDetails from "../../../src/components/profile/OrderDetails";

export default function OrderDetailsRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const itemId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <TabScaffold backgroundColor="#F8FAFC">
      <OrderDetails itemId={itemId || ""} />
    </TabScaffold>
  );
}
