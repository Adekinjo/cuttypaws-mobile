import VideoFeed from "../../src/components/post/VideoFeed";
import TabScaffold from "../../src/components/common/TabScaffold";

export default function VideosRoute() {
  return (
    <TabScaffold backgroundColor="#F4FBF8" compactNav>
      <VideoFeed />
    </TabScaffold>
  );
}
