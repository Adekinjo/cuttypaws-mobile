import CategoryListPage from "../../src/components/pages/CategoryListPage";
import TabScaffold from "../../src/components/common/TabScaffold";

export default function CategoriesRoute() {
  return (
    <TabScaffold>
      <CategoryListPage />
    </TabScaffold>
  );
}
