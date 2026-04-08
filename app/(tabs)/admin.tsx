import TabScaffold from "../../src/components/common/TabScaffold";
import AdminPage from "../../src/components/admin/AdminPage";
import { useTheme } from "../../src/components/context/ThemeContext";

export default function AdminRoute() {
  const { colors } = useTheme();

  return (
    <TabScaffold backgroundColor={colors.background}>
      <AdminPage />
    </TabScaffold>
  );
}
