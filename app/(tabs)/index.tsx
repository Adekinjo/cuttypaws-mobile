import TabScaffold from "../../src/components/common/TabScaffold";
import Home from "../../src/components/pages/Home";

export default function TabsHomePage() {
  return (
    <TabScaffold>
      <Home embedded />
    </TabScaffold>
  );
}
