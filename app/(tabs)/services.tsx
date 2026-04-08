import TabScaffold from "../../src/components/common/TabScaffold";
import ServiceDashboardPage from "../../src/components/service-provider/ServiceDashboardPage";

export default function ServicesRoute() {
  return (
    <TabScaffold backgroundColor="#F8FAFC">
      <ServiceDashboardPage />
    </TabScaffold>
  );
}
