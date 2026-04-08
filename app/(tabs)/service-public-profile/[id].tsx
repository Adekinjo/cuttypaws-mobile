import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import ServicePublicProfilePage from "../../../src/components/service-provider/ServicePublicProfilePage";

export default function ServicePublicProfileRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <TabScaffold backgroundColor="#EEF3F8">
      <ServicePublicProfilePage userId={userId || ""} />
    </TabScaffold>
  );
}
