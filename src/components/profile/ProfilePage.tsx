import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import FollowService from "../../api/FollowService";
import OrderService from "../../api/OrderService";
import PetService from "../../api/PetService";
import PostService from "../../api/PostService";
import WishlistService from "../../api/WishlistService";
import AppVideo from "../common/AppVideo";
import { useTheme } from "../context/ThemeContext";

type UserInfo = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  bio?: string;
  regDate?: string;
  createdAt?: string;
  profileImageUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  address?:
    | {
        city?: string;
        state?: string;
        country?: string;
        street?: string;
      }
    | string;
};

type PetRecord = {
  id?: string | number;
  userId?: string | number;
  ownerId?: string | number;
  name?: string;
  breed?: string;
  type?: string;
  age?: string | number;
  gender?: string;
  description?: string;
  imageUrls?: string[];
};

type PostGridItem = {
  id?: string | number;
  image?: string | null;
  media?: Array<{
    type?: string;
    url?: string | null;
    thumbnailUrl?: string | null;
  }>;
  likes?: number;
  comments?: number;
};

type WishlistItem = {
  id?: string | number;
  productId?: string | number;
  name?: string;
  productName?: string;
  price?: number | string;
  newPrice?: number | string;
  imageUrl?: string;
  thumbnailImageUrl?: string;
};

type OrderItem = {
  id?: string | number;
  orderItemId?: string | number;
  status?: string;
  quantity?: number;
  price?: number | string;
  totalPrice?: number | string;
  productName?: string;
  product?: {
    id?: string | number;
    name?: string;
    thumbnailImageUrl?: string;
  };
};

type ActiveTab = "posts" | "pets" | "saved";

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80";

export default function ProfilePage({
  onNavigate,
  embedded = false,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  embedded?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [posts, setPosts] = useState<PostGridItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("posts");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
  });

  const loadAll = useCallback(async () => {
    try {
      setError("");

      const userResponse = await AuthService.getLoggedInInfo();
      const user = userResponse?.user || null;
      const petsFromUserInfo = Array.isArray(userResponse?.petList) ? userResponse.petList : [];
      const wishlistFromUserInfo = Array.isArray(userResponse?.wishlist)
        ? userResponse.wishlist
        : [];
      const ordersFromUserInfo = Array.isArray(userResponse?.orderItemList)
        ? userResponse.orderItemList
        : [];

      setUserInfo(user);
      setPets(petsFromUserInfo);
      setWishlist(wishlistFromUserInfo);
      setOrders(ordersFromUserInfo);

      await Promise.all([
        fetchMyPosts(),
        user?.id ? fetchFollowStats(String(user.id)) : Promise.resolve(),
        petsFromUserInfo.length === 0 && user?.id
          ? fetchMyPets(String(user.id))
          : Promise.resolve(),
        wishlistFromUserInfo.length === 0 ? hydrateWishlistFallback() : Promise.resolve(),
        ordersFromUserInfo.length === 0 ? hydrateOrdersFallback() : Promise.resolve(),
      ]);
    } catch (loadError: any) {
      console.error("[ProfilePage] loadAll failed", loadError);
      setError(loadError?.message || "Failed to load profile.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        setLoading(true);
        await loadAll();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [loadAll]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 2800);
    return () => clearTimeout(timer);
  }, [success]);

  const handle = useMemo(
    () => toHandle(userInfo?.name || [userInfo?.firstName, userInfo?.lastName].filter(Boolean).join(" ")),
    [userInfo?.firstName, userInfo?.lastName, userInfo?.name]
  );
  const joinedLabel = useMemo(
    () => formatJoined(userInfo?.regDate || userInfo?.createdAt),
    [userInfo?.createdAt, userInfo?.regDate]
  );
  const locationLabel = useMemo(() => formatLocation(userInfo?.address), [userInfo?.address]);
  const displayName = useMemo(() => {
    const fullName =
      userInfo?.name || [userInfo?.firstName, userInfo?.lastName].filter(Boolean).join(" ");
    return fullName || userInfo?.email?.split("@")[0] || "Your Profile";
  }, [userInfo?.email, userInfo?.firstName, userInfo?.lastName, userInfo?.name]);
  const avatarUrl = userInfo?.profileImageUrl || userInfo?.imageUrl || AVATAR_FALLBACK;
  const coverUrl = userInfo?.coverImageUrl || userInfo?.coverUrl || COVER_FALLBACK;
  const savedCount = wishlist.length + orders.length;

  async function fetchMyPosts() {
    try {
      setPostsLoading(true);
      const response = await PostService.getMyPosts();
      const rawPosts = response?.postList || response?.data || response || [];
      const transformed = Array.isArray(rawPosts)
        ? rawPosts.map((post: any) => ({
            id: post?.id,
            image:
              post?.imageUrls?.[0] ||
              post?.media?.find((item: any) =>
                String(item?.type || item?.mediaType || "").toUpperCase().includes("IMAGE")
              )?.url ||
              null,
            media: Array.isArray(post?.media)
              ? post.media
                  .map((item: any) => ({
                    type: String(item?.type || item?.mediaType || "").toUpperCase(),
                    url: item?.url || item?.mediaUrl || null,
                    thumbnailUrl: item?.thumbnailUrl || null,
                  }))
                  .filter((item: any) => item.url)
              : [],
            likes: post?.likeCount || 0,
            comments: post?.totalComments || post?.commentCount || 0,
          }))
        : [];

      setPosts(transformed);
      setFollowStats((prev) => ({ ...prev, postsCount: transformed.length }));
    } catch (postsError) {
      console.error("[ProfilePage] fetchMyPosts failed", postsError);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }

  async function fetchMyPets(userId: string) {
    try {
      const response = await PetService.getMyPets();
      const list = normalizePetList(response);
      if (list.length > 0) {
        setPets(list);
        return;
      }
    } catch (petError: any) {
      const status = petError?.response?.status || petError?.status;

      // Some backend states return 500/404 here even though falling back to the
      // public pet list is the correct next step. Avoid surfacing that as a red dev error.
      if (status !== 404 && status !== 500) {
        console.warn("[ProfilePage] getMyPets fallback triggered", petError?.message || petError);
      }
    }

    try {
      const fallbackResponse = await PetService.getAllPets();
      const allPets = normalizePetList(fallbackResponse);
      const ownedPets = allPets.filter(
        (pet) => String(getPetOwnerId(pet)) === String(userId)
      );
      setPets(ownedPets);
    } catch (fallbackError: any) {
      const status = fallbackError?.response?.status || fallbackError?.status;
      setPets([]);

      if (status !== 404) {
        console.warn(
          "[ProfilePage] getAllPets fallback failed",
          fallbackError?.message || fallbackError
        );
      }
    }
  }

  async function hydrateWishlistFallback() {
    try {
      const response = await WishlistService.getWishlist();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.wishlist)
          ? response.wishlist
          : [];
      setWishlist(list);
    } catch (wishlistError) {
      console.error("[ProfilePage] wishlist fallback failed", wishlistError);
    }
  }

  async function hydrateOrdersFallback() {
    try {
      const response = await OrderService.getMyOrderHistory(0, 6);
      const list = Array.isArray(response?.orderItemList)
        ? response.orderItemList
        : Array.isArray(response?.content)
          ? response.content
          : [];
      setOrders(list);
    } catch (orderError: any) {
      const status = orderError?.response?.status;
      setOrders([]);

      // Some account types are not allowed to access order history on this route.
      // Treat 403/404 as "no orders available" instead of a runtime failure.
      if (status === 403 || status === 404) {
        return;
      }

      console.error("[ProfilePage] order fallback failed", orderError);
    }
  }

  async function fetchFollowStats(userId: string) {
    try {
      const response = await FollowService.getFollowStats(userId);
      const stats = response?.followStats || {};
      setFollowStats((prev) => ({
        ...prev,
        followersCount: stats?.followersCount || 0,
        followingCount: stats?.followingCount || 0,
      }));
    } catch (followError) {
      console.error("[ProfilePage] follow stats failed", followError);
    }
  }

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  async function pickAndUploadImage(kind: "profile" | "cover") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Photo permission is required to update your profile images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: kind === "cover" ? [16, 9] : [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      name: asset.fileName || `${kind}-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    } as any;

    const formData = new FormData();
    formData.append("file", file);

    try {
      if (kind === "cover") {
        setUploadingCover(true);
        await AuthService.updateCoverPicture(formData);
        setSuccess("Cover image updated.");
      } else {
        setUploadingAvatar(true);
        await AuthService.updateUserProfilePicture(formData);
        setSuccess("Profile photo updated.");
      }

      await loadAll();
    } catch (uploadError: any) {
      console.error("[ProfilePage] image upload failed", uploadError);
      setError(uploadError?.message || "Image upload failed.");
    } finally {
      setUploadingCover(false);
      setUploadingAvatar(false);
    }
  }

  function confirmLogout() {
    Alert.alert("Log out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await AuthService.logout();
          onNavigate?.("login");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[embedded ? styles.embeddedSafeArea : styles.safeArea, { backgroundColor: colors.background }]}
        edges={embedded ? [] : ["top"]}
      >
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={[styles.centerTitle, { color: colors.text }]}>Loading your profile...</Text>
          <Text style={[styles.centerCopy, { color: colors.textMuted }]}>
            Pulling in posts, pets, saved products, and account stats.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userInfo) {
    return (
      <SafeAreaView
        style={[embedded ? styles.embeddedSafeArea : styles.safeArea, { backgroundColor: colors.background }]}
        edges={embedded ? [] : ["top"]}
      >
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <View style={[styles.errorIcon, { backgroundColor: isDark ? "rgba(248,113,113,0.16)" : "#FEE2E2" }]}>
            <Feather name="alert-circle" size={22} color="#991B1B" />
          </View>
          <Text style={[styles.centerTitle, { color: colors.text }]}>Profile unavailable</Text>
          <Text style={[styles.centerCopy, { color: colors.textMuted }]}>
            {error || "We could not load your account details right now."}
          </Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={() => onNavigate?.("login")}>
            <Text style={styles.primaryButtonText}>Back to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[embedded ? styles.embeddedSafeArea : styles.safeArea, { backgroundColor: colors.background }]}
      edges={embedded ? [] : ["top"]}
    >
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          <View
            style={[
              styles.coverOverlay,
              { backgroundColor: isDark ? "rgba(7,17,26,0.34)" : "rgba(248, 241, 236, 0.35)" },
            ]}
          />

          <View style={styles.topBar}>
            <Pressable
              style={[styles.topBarButton, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}
              onPress={() => onNavigate?.("home")}
            >
              <Feather name="arrow-left" size={18} color={colors.textMuted} />
            </Pressable>
            <View style={styles.topBarActions}>
              <Pressable
                style={[styles.topBarButton, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}
                onPress={() => onNavigate?.("settings-profile", { from: "profile" })}
              >
                <Feather name="settings" size={18} color={colors.textMuted} />
              </Pressable>
              <Pressable
                style={[styles.topBarButton, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}
                onPress={() => setShowQuickMenu(true)}
              >
                <Feather name="menu" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.coverEditButton, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}
            onPress={() => pickAndUploadImage("cover")}
            disabled={uploadingCover}
          >
          {uploadingCover ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="camera" size={15} color={colors.textMuted} />
              <Text style={styles.coverEditText}>Edit cover</Text>
            </>
          )}
          </Pressable>

          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              <Pressable
                style={styles.avatarEditButton}
                onPress={() => pickAndUploadImage("profile")}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="camera" size={14} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            <View style={styles.identityCopy}>
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, { color: colors.text }]}>{displayName}</Text>
                <View style={styles.handlePill}>
                  <Text style={[styles.handleText, { color: colors.textMuted }]}>{handle}</Text>
                </View>
              </View>
              <Text style={[styles.bioText, { color: colors.textMuted }]}>
                {userInfo.bio || ""}
              </Text>

              <View style={styles.metaRow}>
                <MetaPill icon="map-pin" label={locationLabel} colors={colors} />
                <MetaPill icon="calendar" label={joinedLabel} colors={colors} />
              </View>
            </View>
          </View>
        </View>

        {error ? <Banner tone="error" text={error} colors={colors} isDark={isDark} /> : null}
        {success ? <Banner tone="success" text={success} colors={colors} isDark={isDark} /> : null}

        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatCard
            label="Posts"
            value={followStats.postsCount}
            colors={colors}
          />
          <Pressable
            style={styles.statCard}
            onPress={() => onNavigate?.("followers", { userId: userInfo.id })}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>{followStats.followersCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Followers</Text>
          </Pressable>
          <Pressable
            style={styles.statCard}
            onPress={() => onNavigate?.("following", { userId: userInfo.id })}
          >
            <Text style={[styles.statValue, { color: colors.text }]}>{followStats.followingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Following</Text>
          </Pressable>
        </View>

        <View style={[styles.tabsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tabsRow}>
            <TabButton
              label="Posts"
              active={activeTab === "posts"}
              onPress={() => setActiveTab("posts")}
              colors={colors}
            />
            <TabButton
              label="Pets"
              active={activeTab === "pets"}
              onPress={() => setActiveTab("pets")}
              colors={colors}
            />
            <TabButton
              label="Saved"
              active={activeTab === "saved"}
              onPress={() => setActiveTab("saved")}
              colors={colors}
            />
          </View>

          {activeTab === "posts" ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your posts</Text>
                <Pressable onPress={() => onNavigate?.("create-post")}>
                  <Text style={[styles.sectionLink, { color: colors.success }]}>Create new</Text>
                </Pressable>
              </View>

              {postsLoading ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={colors.success} />
                  <Text style={[styles.inlineLoaderText, { color: colors.textMuted }]}>Loading posts...</Text>
                </View>
              ) : posts.length ? (
                <View style={styles.postGrid}>
                  {posts.map((post) => {
                    const firstMedia = post.media?.[0];
                    const imageUrl = post.image || firstMedia?.thumbnailUrl || firstMedia?.url;
                    const isVideo = String(firstMedia?.type || "").includes("VIDEO");
                    const previewUrl = firstMedia?.thumbnailUrl || post.image || null;

                    return (
                      <Pressable
                        key={String(post.id)}
                        style={styles.postCard}
                        onPress={() => onNavigate?.("post-details", { postId: post.id })}
                      >
                        {isVideo && previewUrl ? (
                          <Image source={{ uri: previewUrl }} style={styles.postImage} />
                        ) : isVideo && firstMedia?.url ? (
                          <AppVideo
                            uri={firstMedia.url}
                            style={styles.postImage}
                            contentFit="cover"
                            shouldPlay={false}
                            isMuted
                            nativeControls={false}
                            posterUri={previewUrl}
                          />
                        ) : imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.postImage} />
                        ) : (
                          <View style={[styles.postFallback, { backgroundColor: colors.border }]}>
                            <Feather name="image" size={22} color={colors.textSoft} />
                          </View>
                        )}

                        <View style={styles.postOverlay}>
                          {isVideo ? (
                            <View style={styles.videoBadge}>
                              <Feather name="play" size={12} color="#FFFFFF" />
                            </View>
                          ) : null}

                          <View style={styles.postMetrics}>
                            <View style={styles.postMetric}>
                              <Feather name="heart" size={12} color="#FFFFFF" />
                              <Text style={styles.postMetricText}>{post.likes || 0}</Text>
                            </View>
                            <View style={styles.postMetric}>
                              <Feather name="message-circle" size={12} color="#FFFFFF" />
                              <Text style={styles.postMetricText}>{post.comments || 0}</Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <EmptyCard
                  icon="image"
                  title="No posts yet"
                  copy="Share pet moments, product finds, or service highlights to bring this profile to life."
                  actionLabel="Create a post"
                  onPress={() => onNavigate?.("create-post")}
                  colors={colors}
                />
              )}
            </View>
          ) : null}

          {activeTab === "pets" ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your pets</Text>
                <Pressable onPress={() => onNavigate?.("add-pet")}>
                  <Text style={[styles.sectionLink, { color: colors.success }]}>Add pet</Text>
                </Pressable>
              </View>

              {pets.length ? (
                pets.map((pet) => (
                  <View key={String(pet.id)} style={[styles.petCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                    <Image
                      source={{
                        uri: pet.imageUrls?.[0] || AVATAR_FALLBACK,
                      }}
                      style={styles.petImage}
                    />
                    <View style={styles.petContent}>
                      <Text style={[styles.petName, { color: colors.text }]}>{pet.name || "Unnamed pet"}</Text>
                      <Text style={[styles.petMeta, { color: colors.success }]}>
                        {[pet.type, pet.breed, pet.gender].filter(Boolean).join(" • ") || "Pet profile"}
                      </Text>
                      <Text style={[styles.petDescription, { color: colors.textMuted }]} numberOfLines={2}>
                        {pet.description || "Add more details about this pet to complete the profile."}
                      </Text>
                      <View style={styles.petActions}>
                        <Pressable
                          style={[styles.petActionPrimary, { backgroundColor: colors.text }]}
                          onPress={() => onNavigate?.("pet-details", { petId: pet.id })}
                        >
                          <Text style={styles.petActionPrimaryText}>View</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.petActionSecondary, { backgroundColor: colors.border }]}
                          onPress={() => onNavigate?.("edit-pet", { petId: pet.id })}
                        >
                          <Text style={[styles.petActionSecondaryText, { color: colors.text }]}>Edit</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyCard
                  icon="heart"
                  title="No pet profiles yet"
                  copy="Create pet profiles with photos, health details, and personality traits."
                  actionLabel="Add your first pet"
                  onPress={() => onNavigate?.("add-pet")}
                  colors={colors}
                />
              )}
            </View>
          ) : null}

          {activeTab === "saved" ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved picks</Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Wishlist and recent orders</Text>
              </View>

              {wishlist.length ? (
                <View style={styles.savedSection}>
                  <Text style={[styles.savedHeading, { color: colors.text }]}>Wishlist</Text>
                  {wishlist.slice(0, 6).map((item) => (
                    <Pressable
                      key={String(item.id || item.productId)}
                      style={[styles.savedCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}
                      onPress={() =>
                        onNavigate?.("product-details", {
                          productId: item.productId || item.id,
                        })
                      }
                    >
                      <Image
                        source={{ uri: item.thumbnailImageUrl || item.imageUrl || COVER_FALLBACK }}
                        style={styles.savedImage}
                      />
                      <View style={styles.savedContent}>
                        <Text style={[styles.savedTitle, { color: colors.text }]}>
                          {item.productName || item.name || "Saved product"}
                        </Text>
                        <Text style={[styles.savedPrice, { color: colors.success }]}>
                          {formatCurrency(item.newPrice ?? item.price)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {orders.length ? (
                <View style={styles.savedSection}>
                  <Text style={[styles.savedHeading, { color: colors.text }]}>Recent orders</Text>
                  {orders.slice(0, 4).map((order) => (
                    <View
                      key={String(order.id || order.orderItemId)}
                      style={[
                        styles.orderCard,
                        {
                          backgroundColor: isDark ? colors.backgroundMuted : "#FFF7ED",
                          borderColor: isDark ? colors.border : "#FED7AA",
                        },
                      ]}
                    >
                      <View style={[styles.orderBadge, { backgroundColor: isDark ? colors.accentSoft : "#FFEDD5" }]}>
                        <Text style={styles.orderBadgeText}>{order.status || "Processing"}</Text>
                      </View>
                      <Text style={[styles.orderTitle, { color: isDark ? colors.text : "#7C2D12" }]}>
                        {order.productName || order.product?.name || "Order item"}
                      </Text>
                      <Text style={[styles.orderMeta, { color: isDark ? colors.textMuted : "#9A3412" }]}>
                        Qty {order.quantity || 1} • {formatCurrency(order.totalPrice ?? order.price)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {!wishlist.length && !orders.length ? (
                <EmptyCard
                  icon="bookmark"
                  title="Nothing saved yet"
                  copy="Products you save and recent order items will appear here for quick access."
                  colors={colors}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={showQuickMenu}
        animationType="fade"
        onRequestClose={() => setShowQuickMenu(false)}
      >
        <Pressable style={[styles.menuBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowQuickMenu(false)}>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.menuTitle, { color: colors.textMuted }]}>Quick links</Text>

            <Pressable
              style={[styles.menuItem, { backgroundColor: colors.backgroundMuted }]}
              onPress={() => {
                setShowQuickMenu(false);
                onNavigate?.("order-history");
              }}
            >
              <Feather name="shopping-bag" size={18} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>My orders</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, { backgroundColor: colors.backgroundMuted }]}
              onPress={() => {
                setShowQuickMenu(false);
                onNavigate?.("my-service-bookings");
              }}
            >
              <Feather name="calendar" size={18} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>My service booking</Text>
            </Pressable>

            <Pressable
              style={[
                styles.menuItem,
                styles.menuItemDanger,
                { backgroundColor: isDark ? "rgba(248,113,113,0.12)" : "#FEF2F2" },
              ]}
              onPress={() => {
                setShowQuickMenu(false);
                confirmLogout();
              }}
            >
              <Feather name="log-out" size={18} color="#B91C1C" />
              <Text style={styles.menuItemDangerText}>Log out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  colors: { text: string; textMuted: string };
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function MetaPill({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  colors: { textMuted: string };
}) {
  return (
    <View style={styles.metaPill}>
      <Feather name={icon} size={13} color={colors.textMuted} />
      <Text style={[styles.metaPillText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: { backgroundMuted: string; backgroundElevated: string; border: string; textMuted: string; text: string };
}) {
  return (
    <Pressable
      style={[
        styles.tabButton,
        { backgroundColor: colors.backgroundMuted },
        active && [styles.tabButtonActive, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }],
      ]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, { color: colors.textMuted }, active && [styles.tabTextActive, { color: colors.text }]]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Banner({
  tone,
  text,
  colors,
  isDark,
}: {
  tone: "error" | "success";
  text: string;
  colors: { danger: string; success: string };
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === "error"
          ? [styles.bannerError, { backgroundColor: isDark ? "rgba(248,113,113,0.14)" : "#FEE2E2" }]
          : [styles.bannerSuccess, { backgroundColor: isDark ? "rgba(49,196,141,0.14)" : "#DCFCE7" }],
      ]}
    >
      <Text
        style={[
          styles.bannerText,
          tone === "error"
            ? [styles.bannerErrorText, { color: colors.danger }]
            : [styles.bannerSuccessText, { color: colors.success }],
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function EmptyCard({
  icon,
  title,
  copy,
  actionLabel,
  onPress,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  copy: string;
  actionLabel?: string;
  onPress?: () => void;
  colors: { backgroundElevated: string; border: string; accentSoft: string; success: string; text: string; textMuted: string };
}) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
        <Feather name={icon} size={20} color={colors.success} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: colors.textMuted }]}>{copy}</Text>
      {actionLabel && onPress ? (
        <Pressable style={[styles.emptyAction, { backgroundColor: colors.success }]} onPress={onPress}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function normalizePetList(response: any): PetRecord[] {
  const list = response?.petList || response?.pets || response?.data || response || [];
  return Array.isArray(list) ? list : [];
}

function getPetOwnerId(pet: any) {
  return (
    pet?.userId ||
    pet?.ownerId ||
    pet?.user_id ||
    pet?.owner_id ||
    pet?.user?.id ||
    pet?.owner?.id ||
    null
  );
}

function toHandle(name?: string) {
  if (!name) return "@cuttypaws";
  return `@${String(name).trim().toLowerCase().replace(/\s+/g, "_")}`;
}

function formatJoined(input?: string) {
  if (!input) return "Joined recently";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Joined recently";
  return `Joined ${date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  })}`;
}

function formatLocation(address?: UserInfo["address"]) {
  if (!address) return "Location not set";
  if (typeof address === "string") return address;
  return [address.city, address.state, address.country].filter(Boolean).join(", ") || "Location not set";
}

function formatCurrency(value?: number | string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  embeddedSafeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  centerCopy: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    textAlign: "center",
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  coverImage: {
    width: "100%",
    height: 118,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 241, 236, 0.35)",
  },
  topBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarActions: {
    flexDirection: "row",
    gap: 10,
  },
  topBarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  menuCard: {
    width: 232,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    gap: 6,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#64748B",
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  menuItemDanger: {
    backgroundColor: "#FEF2F2",
  },
  menuItemDangerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B91C1C",
  },
  coverEditButton: {
    position: "absolute",
    right: 14,
    top: 76,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  coverEditText: {
    display: "none",
  },
  identityRow: {
    marginTop: -22,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
  },
  avatarEditButton: {
    position: "absolute",
    right: -4,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  identityCopy: {
    flex: 1,
    paddingTop: 34,
    gap: 6,
  },
  nameRow: {
    gap: 4,
  },
  nameText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: "#111827",
  },
  handlePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  handleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: "#FEE2E2",
  },
  bannerSuccess: {
    backgroundColor: "#DCFCE7",
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "700",
  },
  bannerErrorText: {
    color: "#991B1B",
  },
  bannerSuccessText: {
    color: "#166534",
  },
  statsRow: {
    flexDirection: "row",
    gap: 0,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
    paddingVertical: 12,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  tabsCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  tabTextActive: {
    color: "#111827",
  },
  sectionBlock: {
    marginTop: 18,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  inlineLoaderText: {
    fontSize: 13,
    color: "#64748B",
  },
  postGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  postCard: {
    width: "47.8%",
    aspectRatio: 0.92,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  postFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  postOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "rgba(15,23,42,0.48)",
  },
  videoBadge: {
    alignSelf: "flex-start",
    width: 26,
    height: 26,
    borderRadius: 13,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  postMetrics: {
    flexDirection: "row",
    gap: 12,
  },
  postMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  postMetricText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  petCard: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 22,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  petImage: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  petContent: {
    flex: 1,
    gap: 6,
  },
  petName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  petMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F766E",
  },
  petDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },
  petActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  petActionPrimary: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#0F172A",
  },
  petActionPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  petActionSecondary: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
  },
  petActionSecondaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  savedSection: {
    gap: 10,
  },
  savedHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  savedImage: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  savedContent: {
    flex: 1,
    gap: 4,
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  savedPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  orderCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 8,
  },
  orderBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FFEDD5",
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9A3412",
    textTransform: "capitalize",
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#7C2D12",
  },
  orderMeta: {
    fontSize: 13,
    color: "#9A3412",
  },
  emptyCard: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyCopy: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },
  emptyAction: {
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#0F766E",
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
