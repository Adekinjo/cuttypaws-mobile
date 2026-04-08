import ProfilePage from "../../src/components/profile/ProfilePage";
import TabScaffold from "../../src/components/common/TabScaffold";

export default function ProfileRoute() {
  return (
    <TabScaffold backgroundColor="#EEF3F8">
      <ProfilePage embedded />
    </TabScaffold>
  );
}
