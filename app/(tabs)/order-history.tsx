import TabScaffold from "../../src/components/common/TabScaffold";
import OrderHistoryPage from "../../src/components/profile/OrderHistoryPage";

export default function OrderHistoryRoute() {
  return (
    <TabScaffold backgroundColor="#F8FAFC">
      <OrderHistoryPage />
    </TabScaffold>
  );
}
