import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import FeedService from "../../api/FeedService";
import PostService from "../../api/PostService";
import { useTheme } from "../context/ThemeContext";
import PostCard from "../post/PostCard";
import ProductRecommendationCard from "../post/ProductRecommendationCard";
import ServiceAdsCard from "../post/ServiceAdsCard";

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
  media?: Array<{ url?: string }>;
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

export default function Home({
  onNavigate,
  onOpenCreatePost,
  onOpenAiHelp,
  onOpenEditPost,
  onOpenPost,
  onOpenProduct,
  onOpenService,
  embedded = false,
}: {
  onNavigate?: (route: string) => void;
  onOpenCreatePost?: () => void;
  onOpenAiHelp?: () => void;
  onOpenEditPost?: (postId: string | number) => void;
  onOpenPost?: (post: FeedPost) => void;
  onOpenProduct?: (product: ProductRecommendation) => void;
  onOpenService?: (serviceAd: ServiceAd) => void;
  embedded?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const isFocused = useIsFocused();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user || null);
    } catch (err) {
      console.error("[HomeMobile] Failed to load current user", err);
      setCurrentUser(null);
    }
  }, []);

  const fallbackToPostsOnly = useCallback(async (reason: string) => {
    console.warn("[HomeMobile] Falling back to posts-only feed", { reason });

    const postsResponse = await PostService.getAllPosts({ limit: 20 });
    const fallbackItems = (postsResponse?.postList || []).map((post: FeedPost, index: number) => ({
      type: "POST" as const,
      post,
      _debugSource: "post-fallback",
      _debugIndex: index,
    }));

    setFeedItems(fallbackItems);
  }, []);

  const fetchFeed = useCallback(
    async (showInitialLoader = false) => {
      try {
        if (showInitialLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await FeedService.getMixedFeed(20);
        const normalizedItems = Array.isArray(response?.items) ? response.items : [];

        if (!normalizedItems.length) {
          await fallbackToPostsOnly("mixed-feed-empty-or-unrecognized");
          return;
        }

        setFeedItems(normalizedItems as FeedItem[]);
      } catch (err: any) {
        console.error("[HomeMobile] Failed to load mixed feed", {
          message: err?.message,
          status: err?.response?.status,
          data: err?.response?.data,
        });

        try {
          await fallbackToPostsOnly(`mixed-feed-error:${err?.message || "unknown"}`);
        } catch (fallbackError: any) {
          console.error("[HomeMobile] Posts-only fallback failed", {
            message: fallbackError?.message,
            status: fallbackError?.status || fallbackError?.response?.status,
            data: fallbackError?.data || fallbackError?.response?.data,
          });

          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load your feed right now."
          );
          setFeedItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fallbackToPostsOnly]
  );

  useEffect(() => {
    loadCurrentUser();
    fetchFeed(true);
  }, [fetchFeed, loadCurrentUser]);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((snapshot) => {
      setCurrentUser(snapshot.user || null);
    });

    return unsubscribe;
  }, []);

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

    onNavigate?.(`edit-post/${postId}`);
  };

  const handleOpenProductRecommendation = (product: ProductRecommendation) => {
    const resolvedProductId = String(product?.id ?? product?.productId ?? "").trim();
    if (!resolvedProductId) {
      return;
    }

    if (onOpenProduct) {
      onOpenProduct({ ...product, id: resolvedProductId });
      return;
    }

    onNavigate?.("product-details", { productId: resolvedProductId } as any);
  };

  const renderFeedItem = (item: FeedItem, index: number) => {
    switch (item.type) {
      case "POST":
        if (!item.post) return null;
        const postId = item.post.id != null ? String(item.post.id) : "";
        return (
          <View key={`post-${item.post.id ?? index}`} style={styles.homePostItem}>
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

      case "SERVICE_AD":
        if (!item.serviceAd) return null;
        return (
          <View key={`service-${item.serviceAd.id ?? item.serviceAd.userId ?? index}`} style={styles.homePostItem}>
            <ServiceAdsCard
              serviceAd={item.serviceAd}
              onPress={() => onOpenService?.(item.serviceAd)}
              onNavigate={onNavigate as any}
            />
          </View>
        );

      case "PRODUCT_RECOMMENDATION":
        if (!item.product) return null;
        return (
          <View key={`product-${item.product.id ?? index}`} style={styles.homePostItem}>
            <ProductRecommendationCard
              product={item.product}
              onPress={() => handleOpenProductRecommendation(item.product)}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
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

  const content = loading || error || feedItems.length === 0 ? (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchFeed(false)}
          tintColor={colors.accentStrong}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeContainer}>
        <View style={styles.homeContent}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accentStrong} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                Getting your feed ready...
              </Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View
              style={[
                styles.homeAlert,
                { backgroundColor: colors.accentSoft, borderColor: colors.danger },
              ]}
            >
              <Text style={[styles.homeAlertText, { color: colors.text }]}>{error}</Text>
              <Pressable
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.card, borderColor: colors.danger },
                  refreshing && styles.disabledButton,
                ]}
                onPress={() => fetchFeed(false)}
                disabled={refreshing}
              >
                <Text style={styles.retryButtonText}>
                  {refreshing ? "Retrying..." : "Try Again"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !error && feedItems.length === 0 ? (
            <View
              style={[
                styles.homeEmptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="image" size={44} color={colors.textSoft} />
              <Text style={[styles.homeEmptyTitle, { color: colors.text }]}>No feed items yet</Text>
              <Text style={[styles.homeEmptyBody, { color: colors.textMuted }]}>
                Start the community by creating the first post.
              </Text>
              <Pressable
                style={[styles.homeCreatePostBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreatePost}
              >
                <Text style={styles.homeCreatePostBtnText}>
                  {currentUser ? "Create First Post" : "Login to Create Post"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !error && feedItems.length > 0 ? (
            <>
              {refreshing ? (
                <View style={styles.refreshingRow}>
                  <ActivityIndicator size="small" color={colors.accentStrong} />
                  <Text style={[styles.refreshingText, { color: colors.textMuted }]}>
                    Refreshing feed...
                  </Text>
                </View>
              ) : null}

              {feedItems.map((item, index) => renderFeedItem(item, index))}
            </>
          ) : null}
        </View>
      </View>
    </ScrollView>
  ) : (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.flatListContent}
      data={feedItems}
      keyExtractor={(item, index) => {
        if (item.type === "POST") return `post-${item.post?.id ?? index}`;
        if (item.type === "SERVICE_AD") return `service-${item.serviceAd?.id ?? item.serviceAd?.userId ?? index}`;
        return `product-${item.product?.id ?? index}`;
      }}
      renderItem={({ item, index }) => renderFeedItem(item, index)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchFeed(false)}
          tintColor={colors.accentStrong}
        />
      }
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        refreshing ? (
          <View style={styles.refreshingRow}>
            <ActivityIndicator size="small" color={colors.accentStrong} />
            <Text style={[styles.refreshingText, { color: colors.textMuted }]}>
              Refreshing feed...
            </Text>
          </View>
        ) : null
      }
      ListFooterComponent={<View style={styles.feedFooterSpace} />}
      extraData={visiblePostIds}
    />
  );

  if (embedded) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {content}
        {currentUser ? (
          <View style={styles.homeFloatingActions}>
            <Pressable
              onPress={handleOpenAiHelp}
              style={[
                styles.homeFloatingAiBtn,
                {
                  backgroundColor: isDark ? "#FFFFFF" : colors.accentStrong,
                  borderColor: isDark ? "rgba(15, 23, 42, 0.18)" : "rgba(255,255,255,0.95)",
                  shadowColor: isDark ? "#020617" : "#111827",
                },
              ]}
              accessibilityLabel="Open AI help"
            >
              <MaterialCommunityIcons
                name="robot-happy-outline"
                size={24}
                color={isDark ? "#102A43" : "#FFFFFF"}
              />
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top"]}>
      {content}
      {currentUser ? (
        <View style={styles.homeFloatingActions}>
          <Pressable
            onPress={handleOpenAiHelp}
            style={[
              styles.homeFloatingAiBtn,
              {
                backgroundColor: isDark ? "#FFFFFF" : colors.accentStrong,
                borderColor: isDark ? "rgba(15, 23, 42, 0.18)" : "rgba(255,255,255,0.95)",
                shadowColor: isDark ? "#020617" : "#111827",
              },
            ]}
            accessibilityLabel="Open AI help"
          >
            <MaterialCommunityIcons
              name="robot-happy-outline"
              size={24}
              color={isDark ? "#102A43" : "#FFFFFF"}
            />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4FBF8",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F4FBF8",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  flatListContent: {
    paddingTop: 4,
    paddingBottom: 120,
    paddingHorizontal: 10,
  },
  homeContainer: {
    minHeight: "100%",
    backgroundColor: "#F4FBF8",
    paddingHorizontal: 2,
  },
  homeContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    minHeight: 520,
    paddingTop: 4,
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  loadingText: {
    marginTop: 10,
    color: "#7B8794",
    fontSize: 14,
  },
  homeAlert: {
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: "rgba(220, 53, 69, 0.1)",
    borderWidth: 1,
    borderColor: "#dc3545",
    padding: 18,
    alignItems: "center",
  },
  homeAlertText: {
    color: "#102A43",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dc3545",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  retryButtonText: {
    color: "#b42318",
    fontWeight: "700",
    fontSize: 13,
  },
  homeEmptyCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2EC",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  homeEmptyTitle: {
    marginTop: 14,
    color: "#102A43",
    fontSize: 20,
    fontWeight: "800",
  },
  homeEmptyBody: {
    marginTop: 8,
    textAlign: "center",
    color: "#7B8794",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  homeCreatePostBtn: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#102A43",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  homeCreatePostBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  homePostItem: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    marginBottom: 8,
  },
  feedFooterSpace: {
    height: 8,
  },
  refreshingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  refreshingText: {
    color: "#7B8794",
    fontSize: 13,
  },
  homeFloatingActions: {
    position: "absolute",
    right: 16,
    bottom: 18,
    zIndex: 1200,
    marginBottom: 60,
  },
  homeFloatingAiBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#102A43",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111827",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
  },
  disabledButton: {
    opacity: 0.55,
  },
});
