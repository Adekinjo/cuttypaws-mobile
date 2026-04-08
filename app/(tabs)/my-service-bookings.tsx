import TabScaffold from "../../src/components/common/TabScaffold";
import MyServiceBookings from "../../src/components/profile/MyServiceBookings";

export default function MyServiceBookingsRoute() {
  return (
    <TabScaffold backgroundColor="#F8FAFC">
      <MyServiceBookings />
    </TabScaffold>
  );
}
