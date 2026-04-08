import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import PublicProfilePage from "../../../src/components/profile/PublicProfilePage";

export default function CustomerProfileRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <TabScaffold backgroundColor="#EEF3F8">
      <PublicProfilePage userId={userId || ""} />
    </TabScaffold>
  );
}
