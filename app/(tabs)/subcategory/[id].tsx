import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import ProductSubCategoryPage from "../../../src/components/pages/ProductSubCategory";

export default function ProductSubCategoryRoute() {
  const params = useLocalSearchParams<{ id?: string }>();

  return (
    <TabScaffold>
      <ProductSubCategoryPage subCategoryId={String(params.id || "")} />
    </TabScaffold>
  );
}
