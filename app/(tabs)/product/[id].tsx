import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import ProductDetailsPage from "../../../src/components/pages/ProductDetailsPage";

export default function ProductDetailsRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <TabScaffold>
      <ProductDetailsPage productId={productId || ""} />
    </TabScaffold>
  );
}
