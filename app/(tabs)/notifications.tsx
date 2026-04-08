import TabScaffold from "../../src/components/common/TabScaffold";
import NotificationPage from "../../src/components/post/NotificationPage";

export default function NotificationsRoute() {
  return (
    <TabScaffold backgroundColor="#F4F7F5">
      <NotificationPage embedded />
    </TabScaffold>
  );
}
