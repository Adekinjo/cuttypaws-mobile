import TabScaffold from "../../src/components/common/TabScaffold";
import SellerDashboard from "../../src/components/company/SellerDashboard";

export default function SellerRoute() {
  return (
    <TabScaffold backgroundColor="#F8FAFC">
      <SellerDashboard />
    </TabScaffold>
  );
}
