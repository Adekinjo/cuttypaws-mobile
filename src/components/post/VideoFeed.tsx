import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FeedService from "../../api/FeedService";
import VideoFeedItem from "./VideoFeedItem";

type VideoPost = {
  id?: string | number;
  media?: Array<{ type?: string; url?: string; streamUrl?: string }>;
  ownerName?: string;
  caption?: string;
  totalReactions?: number;
  likeCount?: number;
  commentCount?: number;
  userReaction?: string | null;
  likedByCurrentUser?: boolean;
};

type NextCursor = {
  cursorCreatedAt?: string | null;
  cursorId?: string | null;
} | null;

export default function VideoFeed({
  onNavigate,
  onOpenComments,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenComments?: (post: VideoPost) => void;
}) {
  const { height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<VideoPost>>(null);
  const [items, setItems] = useState<VideoPost[]>([]);
  const [nextCursor, setNextCursor] = useState<NextCursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");

  const pageHeight = Math.max(300, height - 340);

  const normalizeVideoItems = useCallback((payload: any) => {
    const list = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.posts)
        ? payload.posts
        : Array.isArray(payload?.postList)
          ? payload.postList
          : [];

    return list.filter((item: VideoPost) =>
      Array.isArray(item?.media) ? item.media.some((media) => media?.type === "VIDEO") : false
    );
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await FeedService.getVideoFeed({ limit: 5 });
      const initialItems = normalizeVideoItems(response);

      setItems(initialItems);
      setNextCursor(response?.nextCursor || null);
      setHasMore(Boolean(response?.hasMore));
      setActiveIndex(0);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load video feed.");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [normalizeVideoItems]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;

    try {
      setLoadingMore(true);

      const response = await FeedService.getVideoFeed({
        cursorCreatedAt: nextCursor?.cursorCreatedAt || null,
        cursorId: nextCursor?.cursorId || null,
        limit: 5,
      });

      const newItems = normalizeVideoItems(response);

      setItems((prev) => [...prev, ...newItems]);
      setNextCursor(response?.nextCursor || null);
      setHasMore(Boolean(response?.hasMore));
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, normalizeVideoItems]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (items.length - activeIndex <= 2) {
      loadMore();
    }
  }, [activeIndex, items.length, loadMore]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
  };

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const firstVisible = viewableItems.find((item) => item.index != null);
      if (typeof firstVisible?.index === "number") {
        setActiveIndex(firstVisible.index);
      }
    }
  ).current;

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 75,
    }),
    []
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<VideoPost>) => (
    <View style={[styles.page, { height: pageHeight }]}>
      <VideoFeedItem
        post={item}
        isActive={isFocused && activeIndex === index}
        onVisible={() => setActiveIndex(index)}
        onOpenComments={onOpenComments}
        onNavigate={onNavigate}
      />
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading videos</Text>
          <Text style={styles.centerText}>Preparing a smoother mobile reel for you.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {error ? (
          <View style={styles.messageCard}>
            <Feather name="alert-triangle" size={18} color="#B91C1C" />
            <Text style={styles.messageTitle}>Could not load videos</Text>
            <Text style={styles.messageBody}>{error}</Text>
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="play-box-multiple-outline" size={30} color="#0F766E" />
            </View>
            <Text style={styles.emptyTitle}>No videos yet</Text>
            <Text style={styles.emptyText}>
              Video posts will appear here as soon as creators upload them.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item, index) => `video-post-${item.id || index}`}
            renderItem={renderItem}
            pagingEnabled
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            onEndReachedThreshold={0.3}
            onEndReached={loadMore}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#0F766E" />
                  <Text style={styles.footerText}>Loading more videos...</Text>
                </View>
              ) : !hasMore && items.length > 0 ? (
                <View style={styles.footerLoader}>
                  <Text style={styles.footerText}>You reached the end of the video feed.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  page: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerTitle: {
    marginTop: 14,
    fontSize: 21,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  centerText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#94A3B8",
  },
  messageCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    gap: 6,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
  },
  messageBody: {
    fontSize: 13,
    textAlign: "center",
    color: "#B91C1C",
  },
  emptyCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(94, 234, 212, 0.12)",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#94A3B8",
  },
  footerLoader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: "#94A3B8",
  },
});
