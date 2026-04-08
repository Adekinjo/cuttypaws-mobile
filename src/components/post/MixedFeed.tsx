import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
}: {
  currentUser?: CurrentUser | null;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenCreatePost?: () => void;
  onOpenAiHelp?: () => void;
  onOpenEditPost?: (postId: string | number) => void;
  onOpenPost?: (post: FeedPost) => void;
  onOpenProduct?: (product: ProductRecommendation) => void;
  onOpenService?: (serviceAd: ServiceAd) => void;
}) {
  const isFocused = useIsFocused();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(currentUserProp || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

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

  const fallbackToPostsOnly = useCallback(async () => {
    const postsResponse = await PostService.getAllPosts({ limit: 12 });
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
        const response = await FeedService.getMixedFeed(12);
        const normalizedItems = Array.isArray(response?.items) ? response.items : [];

        if (!normalizedItems.length) {
          await fallbackToPostsOnly();
          return;
        }

        setFeedItems(normalizedItems as FeedItem[]);
      } catch (err: any) {
        try {
          await fallbackToPostsOnly();
        } catch {
          setError(err?.message || "Unable to load the mixed feed right now.");
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

  const firstName = useMemo(() => {
    const baseName =
      currentUser?.firstName ||
      currentUser?.name ||
      currentUser?.email?.split("@")[0] ||
      "Pet lover";
    return baseName.split(" ")[0];
  }, [currentUser]);

  const stats = useMemo(() => {
    return feedItems.reduce(
      (summary, item) => {
        if (item.type === "POST") summary.posts += 1;
        if (item.type === "SERVICE_AD") summary.services += 1;
        if (item.type === "PRODUCT_RECOMMENDATION") summary.products += 1;
        return summary;
      },
      { posts: 0, services: 0, products: 0 }
    );
  }, [feedItems]);

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

  const renderFeedItem = (item: FeedItem, index: number) => {
    if (item.type === "POST") {
      if (!item.post) return null;
      const postId = item.post.id != null ? String(item.post.id) : "";

      return (
        <View key={`post-${item.post.id ?? index}`} style={styles.feedItem}>
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
        <View key={`service-${item.serviceAd.id ?? item.serviceAd.userId ?? index}`} style={styles.feedItem}>
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
      <View key={`product-${item.product.id ?? index}`} style={styles.feedItem}>
        <ProductRecommendationCard
          product={item.product}
          onPress={() => onOpenProduct?.(item.product)}
        />
      </View>
    );
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        data={!loading && !error && feedItems.length > 0 ? feedItems : []}
        keyExtractor={(item, index) => {
          if (item.type === "POST") return `post-${item.post?.id ?? index}`;
          if (item.type === "SERVICE_AD") return `service-${item.serviceAd?.id ?? item.serviceAd?.userId ?? index}`;
          return `product-${item.product?.id ?? index}`;
        }}
        renderItem={({ item, index }) => renderFeedItem(item, index)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchFeed(false)} tintColor="#0F766E" />
        }
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={
          <>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="paw" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Mixed feed</Text>
            </View>

            <Pressable style={styles.heroRefreshPill} onPress={() => fetchFeed(false)}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#E0F2FE" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color="#E0F2FE" />
                  <Text style={styles.heroRefreshText}>Refresh</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>Hello, {firstName}</Text>
          <Text style={styles.heroSubtitle}>
            One mobile feed for community posts, trusted services, and product ideas that actually fit the moment.
          </Text>

          <View style={styles.heroStatsRow}>
            <StatChip label="Posts" value={String(stats.posts)} />
            <StatChip label="Services" value={String(stats.services)} />
            <StatChip label="Products" value={String(stats.products)} />
          </View>

          <View style={styles.quickActionRow}>
            <Pressable style={[styles.quickActionCard, styles.quickActionPrimary]} onPress={handleCreatePost}>
              <View style={styles.quickActionIconWrap}>
                <Ionicons name="add-circle" size={20} color="#0F172A" />
              </View>
              <Text style={styles.quickActionTitle}>Create post</Text>
              <Text style={styles.quickActionBody}>Share an update, question, or win from your pet world.</Text>
            </Pressable>

            <Pressable style={[styles.quickActionCard, styles.quickActionSecondary]} onPress={handleOpenAiHelp}>
              <View style={[styles.quickActionIconWrap, styles.quickActionIconDark]}>
                <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#CCFBF1" />
              </View>
              <Text style={[styles.quickActionTitle, styles.quickActionTitleDark]}>AI help</Text>
              <Text style={[styles.quickActionBody, styles.quickActionBodyDark]}>
                Jump into faster pet support and tailored recommendations.
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>Live stream</Text>
            <Text style={styles.sectionTitle}>Community mix</Text>
          </View>
          <View style={styles.sectionPill}>
            <Text style={styles.sectionPillText}>{feedItems.length} items</Text>
          </View>
        </View>

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
            <Pressable style={styles.primaryButton} onPress={() => fetchFeed(false)}>
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

        {!loading && !error && feedItems.length > 0 ? (
          <View style={styles.feedList} />
        ) : null}
          </>
        }
        ListFooterComponent={<View style={styles.feedFooterSpace} />}
      />

      {currentUser ? (
        <View style={styles.floatingActions}>
          <Pressable style={[styles.floatingButton, styles.floatingGhost]} onPress={handleOpenAiHelp}>
            <MaterialCommunityIcons name="robot-happy-outline" size={24} color="#083344" />
          </Pressable>

          <Pressable style={[styles.floatingButton, styles.floatingPrimary]} onPress={handleCreatePost}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={styles.statChipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    gap: 16,
  },
  heroCard: {
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -56,
    right: -32,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.22)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -84,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(59, 130, 246, 0.14)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#CCFBF1",
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  heroRefreshPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(148, 163, 184, 0.18)",
  },
  heroRefreshText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E0F2FE",
  },
  heroTitle: {
    marginTop: 18,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#CBD5E1",
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  statChip: {
    minWidth: 94,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statChipLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#94A3B8",
  },
  statChipValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
  },
  quickActionPrimary: {
    backgroundColor: "#ECFCCB",
  },
  quickActionSecondary: {
    backgroundColor: "rgba(15, 118, 110, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(94, 234, 212, 0.22)",
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BEF264",
  },
  quickActionIconDark: {
    backgroundColor: "#0F172A",
  },
  quickActionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  quickActionTitleDark: {
    color: "#F0FDFA",
  },
  quickActionBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#365314",
  },
  quickActionBodyDark: {
    color: "#CCFBF1",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#0F766E",
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  sectionPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#D1FAE5",
  },
  sectionPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#065F46",
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
  feedList: {
    gap: 16,
  },
  feedItem: {
    width: "100%",
  },
  feedFooterSpace: {
    height: 12,
  },
  floatingActions: {
    position: "absolute",
    right: 18,
    bottom: 24,
    alignItems: "center",
    gap: 12,
  },
  floatingButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  floatingGhost: {
    backgroundColor: "#CCFBF1",
  },
  floatingPrimary: {
    backgroundColor: "#0F766E",
  },
});
