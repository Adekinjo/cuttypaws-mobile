import { Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import FeedService from "../../api/FeedService";
import PostService from "../../api/PostService";
import PostCard from "./PostCard";
import ProductRecommendationCard from "./ProductRecommendationCard";
import ServiceAdsCard from "./ServiceAdsCard";

type CurrentUser = {
  id?: string | number | null;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
};

type FeedPost = {
  id?: string | number;
  ownerId?: string | number;
  caption?: string;
  media?: { url?: string }[];
};

type ServiceAd = {
  id?: string | number;
  userId?: string | number;
  businessName?: string;
  description?: string;
  coverImageUrl?: string;
};

type ProductRecommendation = {
  id?: string | number;
  productId?: string | number;
  productName?: string;
  name?: string;
  price?: number | string;
  thumbnailImageUrl?: string;
};

type FeedItem =
  | {
      type: "POST";
      post: FeedPost;
      _debugIndex?: number;
      _debugSource?: string;
    }
  | {
      type: "SERVICE_AD";
      serviceAd: ServiceAd;
      _debugIndex?: number;
      _debugSource?: string;
    }
  | {
      type: "PRODUCT_RECOMMENDATION";
      product: ProductRecommendation;
      _debugIndex?: number;
      _debugSource?: string;
    };

export default function MixedFeed({
  currentUser: currentUserProp,
  onNavigate,
  onOpenCreatePost,
  onOpenAiHelp,
  onOpenEditPost,
  onOpenPost,
  onOpenProduct,
  onOpenService,
  embedded = false,
}: {
  currentUser?: CurrentUser | null;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenCreatePost?: () => void;
  onOpenAiHelp?: () => void;
  onOpenEditPost?: (postId: string | number) => void;
  onOpenPost?: (post: FeedPost) => void;
  onOpenProduct?: (product: ProductRecommendation) => void;
  onOpenService?: (serviceAd: ServiceAd) => void;
  embedded?: boolean;
}) {
  const isFocused = useIsFocused();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(currentUserProp || null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  const [hasMore, setHasMore] = useState(false);
  const [nextCursorCreatedAt, setNextCursorCreatedAt] = useState<string | null>(null);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);

  const activeRequestRef = useRef(0);

  const getItemKey = useCallback((item: FeedItem, index?: number) => {
    if (item.type === "POST") return `POST-${item.post?.id ?? index ?? "x"}`;
    if (item.type === "SERVICE_AD") return `SERVICE_AD-${item.serviceAd?.id ?? item.serviceAd?.userId ?? index ?? "x"}`;
    return `PRODUCT-${item.product?.id ?? index ?? "x"}`;
  }, []);

  const mergeUniqueItems = useCallback((oldItems: FeedItem[], newItems: FeedItem[]) => {
    const seen = new Set<string>();
    return [...oldItems, ...newItems].filter((item, index) => {
      const key = getItemKey(item, index);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [getItemKey]);

  const loadCurrentUser = useCallback(async () => {
    if (currentUserProp) {
      setCurrentUser(currentUserProp);
      return;
    }

    try {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user || null);
    } catch {
      setCurrentUser(null);
    }
  }, [currentUserProp]);

  const fallbackToPostsOnly = useCallback(async (append = false) => {
    const postsResponse = await PostService.getAllPosts({ limit: 12 });
    const fallbackItems = (postsResponse?.postList || []).map((post: FeedPost, index: number) => ({
      type: "POST" as const,
      post,
      _debugSource: "post-fallback",
      _debugIndex: index,
    }));

    setFeedItems((prev) => (append ? mergeUniqueItems(prev, fallbackItems) : fallbackItems));
    setHasMore(false);
    setNextCursorCreatedAt(null);
    setNextCursorId(null);
  }, [mergeUniqueItems]);

  const loadFeed = useCallback(
    async ({
      showInitialLoader = false,
      append = false,
      cursorCreatedAt = null,
      cursorId = null,
    }: {
      showInitialLoader?: boolean;
      append?: boolean;
      cursorCreatedAt?: string | null;
      cursorId?: number | null;
    } = {}) => {
      const requestId = Date.now();
      activeRequestRef.current = requestId;

      try {
        if (showInitialLoader) {
          setLoading(true);
        } else if (append) {
          setLoadingMore(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await FeedService.getMixedFeed({
          cursorCreatedAt,
          cursorId,
          limit: 12,
        });

        const normalizedItems = Array.isArray(response?.items) ? response.items : [];

        if (!normalizedItems.length && !append) {
          await fallbackToPostsOnly(false);
          return;
        }

        if (activeRequestRef.current !== requestId) return;

        setFeedItems((prev) =>
          append ? mergeUniqueItems(prev, normalizedItems as FeedItem[]) : (normalizedItems as FeedItem[])
        );

        setHasMore(Boolean(response?.hasMore));
        setNextCursorCreatedAt(response?.nextCursorCreatedAt || null);
        setNextCursorId(
          response?.nextCursorId != null ? Number(response.nextCursorId) : null
        );
      } catch (err: any) {
        if (append) {
          console.error("[MixedFeedMobile] Failed to load more mixed feed", err);
          return;
        }

        try {
          await fallbackToPostsOnly(false);
        } catch {
          setError(err?.message || "Unable to load the mixed feed right now.");
          setFeedItems([]);
          setHasMore(false);
          setNextCursorCreatedAt(null);
          setNextCursorId(null);
        }
      } finally {
        if (activeRequestRef.current === requestId) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fallbackToPostsOnly, mergeUniqueItems]
  );

  useEffect(() => {
    loadCurrentUser();
    loadFeed({ showInitialLoader: true });
  }, [loadFeed, loadCurrentUser]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursorCreatedAt || nextCursorId == null) return;

    await loadFeed({
      append: true,
      cursorCreatedAt: nextCursorCreatedAt,
      cursorId: nextCursorId,
    });
  }, [hasMore, loadingMore, nextCursorCreatedAt, nextCursorId, loadFeed]);

  const handleCreatePost = () => {
    if (!currentUser) {
      onNavigate?.("login");
      return;
    }

    if (onOpenCreatePost) {
      onOpenCreatePost();
      return;
    }

    onNavigate?.("create-post");
  };

  const handleOpenAiHelp = () => {
    if (!currentUser) {
      onNavigate?.("login");
      return;
    }

    if (onOpenAiHelp) {
      onOpenAiHelp();
      return;
    }

    onNavigate?.("ai-help");
  };

  const handleDeletePost = (postId: string | number) => {
    setFeedItems((prevItems) =>
      prevItems.filter((item) => !(item.type === "POST" && item.post?.id === postId))
    );
  };

  const handleEditPost = (postId: string | number) => {
    if (onOpenEditPost) {
      onOpenEditPost(postId);
      return;
    }

    onNavigate?.("edit-post", { postId });
  };

  const handleOpenProductRecommendation = (product: ProductRecommendation) => {
    const resolvedProductId = String(product?.id ?? product?.productId ?? "").trim();
    if (!resolvedProductId) {
      return;
    }

    const normalizedProduct = { ...product, id: resolvedProductId };

    if (onOpenProduct) {
      onOpenProduct(normalizedProduct);
      return;
    }

    onNavigate?.("product-details", { productId: resolvedProductId });
  };

  const renderFeedItem = ({ item, index }: { item: FeedItem; index: number }) => {
    if (item.type === "POST") {
      if (!item.post) return null;
      const postId = item.post.id != null ? String(item.post.id) : "";

      return (
        <View style={styles.feedItem}>
          <PostCard
            post={item.post}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
            onPress={() => onOpenPost?.(item.post)}
            onNavigate={onNavigate}
            isOwner={Boolean(currentUser && item.post?.ownerId === currentUser?.id)}
            currentUser={currentUser}
            isActive={Boolean(isFocused && postId && visiblePostIds.includes(postId))}
          />
        </View>
      );
    }

    if (item.type === "SERVICE_AD") {
      if (!item.serviceAd) return null;

      return (
        <View style={styles.feedItem}>
          <ServiceAdsCard
            serviceAd={item.serviceAd}
            onPress={() => onOpenService?.(item.serviceAd)}
            onNavigate={onNavigate}
          />
        </View>
      );
    }

    if (!item.product) return null;

    return (
      <View style={styles.feedItem}>
        <ProductRecommendationCard
          product={item.product}
          onPress={() => handleOpenProductRecommendation(item.product)}
        />
      </View>
    );
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const nextVisiblePostIds = viewableItems
        .map((entry) => {
          const item = entry.item as FeedItem;
          return item?.type === "POST" && item.post?.id != null ? String(item.post.id) : null;
        })
        .filter((value): value is string => Boolean(value));

      setVisiblePostIds(nextVisiblePostIds);
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const content = (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        data={!loading && !error && feedItems.length > 0 ? feedItems : []}
        keyExtractor={(item, index) => getItemKey(item, index)}
        renderItem={renderFeedItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFeed({ showInitialLoader: false })}
            tintColor="#0F766E"
          />
        }
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {loading ? (
              <View style={styles.centerStateCard}>
                <ActivityIndicator size="large" color="#0F766E" />
                <Text style={styles.centerStateTitle}>Getting your feed ready</Text>
                <Text style={styles.centerStateBody}>
                  Pulling posts, service ads, and product recommendations into one cleaner mobile stream.
                </Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.messageCard}>
                <View style={styles.messageIconError}>
                  <Feather name="alert-triangle" size={18} color="#B91C1C" />
                </View>
                <Text style={styles.messageTitle}>Could not load mixed feed</Text>
                <Text style={styles.messageBody}>{error}</Text>
                <Pressable style={styles.primaryButton} onPress={() => loadFeed({ showInitialLoader: false })}>
                  <Text style={styles.primaryButtonText}>{refreshing ? "Retrying..." : "Try Again"}</Text>
                </Pressable>
              </View>
            ) : null}

            {!loading && !error && feedItems.length === 0 ? (
              <View style={styles.messageCard}>
                <View style={styles.messageIconEmpty}>
                  <Feather name="image" size={18} color="#0F766E" />
                </View>
                <Text style={styles.messageTitle}>No feed items yet</Text>
                <Text style={styles.messageBody}>
                  Start the activity by publishing a post or open AI help while the feed fills up.
                </Text>
                <View style={styles.emptyActionRow}>
                  <Pressable style={styles.primaryButton} onPress={handleCreatePost}>
                    <Text style={styles.primaryButtonText}>
                      {currentUser ? "Create First Post" : "Login to Create Post"}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={handleOpenAiHelp}>
                    <Text style={styles.secondaryButtonText}>Open AI Help</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            {loadingMore ? (
              <View style={styles.loadingMoreWrap}>
                <ActivityIndicator size="small" color="#0F766E" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null}
            <View style={styles.feedFooterSpace} />
          </>
        }
      />
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{content}</View>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  embeddedRoot: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 0,
  },
  centerStateCard: {
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 34,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  centerStateTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },
  centerStateBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#64748B",
  },
  messageCard: {
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 30,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageIconError: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  messageIconEmpty: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  messageTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  messageBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#64748B",
  },
  emptyActionRow: {
    width: "100%",
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    minWidth: 150,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#0F766E",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  secondaryButton: {
    minWidth: 150,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
  },
  feedItem: {
    width: "100%",
    marginBottom: 0,
  },
  loadingMoreWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  feedFooterSpace: {
    height: 24,
  },
});
