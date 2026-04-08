import { useLocalSearchParams } from "expo-router";

import TabScaffold from "../../../src/components/common/TabScaffold";
import PostDetailsPage from "../../../src/components/post/PostDetailsPage";

export default function PostDetailsRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <TabScaffold backgroundColor="#F8FAFC">
      <PostDetailsPage postId={postId || ""} />
    </TabScaffold>
  );
}
