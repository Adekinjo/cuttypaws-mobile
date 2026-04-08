import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import CategoryProduct from "../../../src/components/pages/CategoryProduct";

export default function CategoryProductRoute() {
  const params = useLocalSearchParams<{ id?: string; categoryName?: string }>();

  return (
    <TabScaffold>
      <CategoryProduct
        categoryId={String(params.id || "")}
        categoryName={params.categoryName ? String(params.categoryName) : undefined}
      />
    </TabScaffold>
  );
}
