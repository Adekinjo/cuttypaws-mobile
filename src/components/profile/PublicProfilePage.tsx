import { Feather, Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import PetService from "../../api/PetService";
import ServiceProviderService from "../../api/ServiceProviderService";
import UserProfileService from "../../api/UserProfileService";
import AppVideo from "../common/AppVideo";
import { useTheme } from "../context/ThemeContext";

type PublicUser = {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  bio?: string;
  regDate?: string;
  createdAt?: string;
  profileImageUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  role?: string;
  userRole?: string;
  isServiceProvider?: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  address?:
    | {
        street?: string;
        city?: string;
        state?: string;
        zipcode?: string;
        country?: string;
      }
    | string;
};

type PublicPost = {
  id?: string | number;
  image?: string | null;
  imageUrls?: string[];
  media?: {
    type?: string;
    mediaType?: string;
    url?: string | null;
    mediaUrl?: string | null;
    thumbnailUrl?: string | null;
  }[];
  totalReactions?: number;
  likeCount?: number;
  likes?: number;
  commentCount?: number;
  comments?: number;
  totalComments?: number;
};

type PetRecord = {
  id?: string | number;
  userId?: string | number;
  ownerId?: string | number;
  user_id?: string | number;
  owner_id?: string | number;
  user?: { id?: string | number };
  owner?: { id?: string | number };
  name?: string;
  breed?: string;
  type?: string;
  age?: string | number;
  gender?: string;
  description?: string;
  imageUrls?: string[];
};

type CurrentUser = {
  id?: string | number;
  role?: string;
  userRole?: string;
  name?: string;
  email?: string;
};

type Stats = {
  postCount?: number;
  totalLikes?: number;
  totalComments?: number;
};

type FollowStats = {
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
};

type TabKey = "posts" | "pets" | "about";

type ServiceProfileSummary = {
  businessName?: string;
  ownerName?: string;
  serviceType?: string;
  city?: string;
  state?: string;
  country?: string;
};

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80";

export default function PublicProfilePage({
  userId,
  onNavigate,
}: {
  userId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const { colors, isDark } = useTheme();
  const [userProfile, setUserProfile] = useState<PublicUser | null>(null);
  const [userPosts, setUserPosts] = useState<PublicPost[]>([]);
  const [pets, setPets] = useState<PetRecord[]>([]);
  const [userStats, setUserStats] = useState<Stats | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [serviceProfile, setServiceProfile] = useState<ServiceProfileSummary | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCurrentUser = useCallback(async () => {
    try {
      const storedUser = await AuthService.getStoredUser();
      setCurrentUser(storedUser || null);
    } catch (currentUserError) {
      console.error("[PublicProfilePage] Failed to load current user", currentUserError);
      setCurrentUser(null);
    }
  }, []);

  const fetchUserPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      const response = await UserProfileService.getUserPosts(userId);
      const rawPosts = response?.postList || response?.data || response || [];
      setUserPosts(Array.isArray(rawPosts) ? rawPosts : []);
    } catch (postsError) {
      console.error("[PublicProfilePage] Failed to fetch posts", postsError);
      setUserPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [userId]);

  const fetchUserPets = useCallback(async (profileResponse?: any) => {
    try {
      const directPets = normalizePetList(profileResponse);
      if (directPets.length) {
        setPets(
          directPets.filter((pet) => String(getPetOwnerId(pet)) === String(userId))
        );
        return;
      }

      setPetsLoading(true);
      const response = await PetService.getAllPets();
      const allPets = normalizePetList(response);
      const ownedPets = allPets.filter((pet) => String(getPetOwnerId(pet)) === String(userId));
      setPets(ownedPets);
    } catch (petsError) {
      console.error("[PublicProfilePage] Failed to fetch pets", petsError);
      setPets([]);
    } finally {
      setPetsLoading(false);
    }
  }, [userId]);

  const fetchUserProfile = useCallback(async () => {
    try {
      setError("");

      const profileResponse = await UserProfileService.getUserProfile(userId);
      if (profileResponse?.status !== 200 || !profileResponse?.user) {
        throw new Error(profileResponse?.message || "Failed to load user profile");
      }

      setUserProfile(profileResponse.user);

      const [statsResult, followStatsResult] = await Promise.allSettled([
        UserProfileService.getUserStats(userId),
        FollowService.getFollowStats(userId),
      ]);

      if (statsResult.status === "fulfilled" && statsResult.value?.status === 200) {
        setUserStats(statsResult.value.userStats || { postCount: 0, totalLikes: 0, totalComments: 0 });
      } else {
        setUserStats({ postCount: 0, totalLikes: 0, totalComments: 0 });
      }

      if (followStatsResult.status === "fulfilled" && followStatsResult.value?.status === 200) {
        setFollowStats(
          followStatsResult.value.followStats || {
            followersCount: 0,
            followingCount: 0,
            isFollowing: false,
            isFollowedBy: false,
          }
        );
      } else {
        setFollowStats({
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
          isFollowedBy: false,
        });
      }

      await Promise.all([fetchUserPosts(), fetchUserPets(profileResponse)]);
    } catch (profileError: any) {
      console.error("[PublicProfilePage] Failed to fetch profile", profileError);

      if (profileError?.response?.status === 401) {
        await AuthService.logout();
        onNavigate?.("login");
        return;
      }

      setError(profileError?.message || "Failed to load user profile");
    }
  }, [fetchUserPets, fetchUserPosts, onNavigate, userId]);

  const fetchServiceProfile = useCallback(async () => {
    try {
      const response = await ServiceProviderService.getPublicServiceProfile(userId);
      if (!response || response.status >= 400 || !response.serviceProfile) {
        setServiceProfile(null);
        return;
      }
      setServiceProfile(response.serviceProfile);
    } catch (serviceError) {
      console.error("[PublicProfilePage] Failed to fetch service profile", serviceError);
      setServiceProfile(null);
    }
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        setLoading(true);
        await Promise.all([loadCurrentUser(), fetchUserProfile(), fetchServiceProfile()]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [fetchServiceProfile, fetchUserProfile, loadCurrentUser]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadCurrentUser(), fetchUserProfile(), fetchServiceProfile()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchServiceProfile, fetchUserProfile, loadCurrentUser]);

  const isCurrentUserProfile = useMemo(() => {
    return Boolean(currentUser?.id && userProfile?.id && String(currentUser.id) === String(userProfile.id));
  }, [currentUser?.id, userProfile?.id]);

  const currentRole = currentUser?.role || currentUser?.userRole || "";
  const isAdmin = useMemo(() => currentRole === "ROLE_ADMIN", [currentRole]);

  const displayName = useMemo(() => {
    const fullName =
      userProfile?.name || [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ");
    return fullName || userProfile?.email?.split("@")[0] || "Public Profile";
  }, [userProfile?.email, userProfile?.firstName, userProfile?.lastName, userProfile?.name]);

  const avatarUrl = userProfile?.profileImageUrl || userProfile?.imageUrl || AVATAR_FALLBACK;
  const coverUrl = userProfile?.coverImageUrl || userProfile?.coverUrl || COVER_FALLBACK;
  const viewedRole = userProfile?.role || userProfile?.userRole || "";
  const isServiceProviderProfile =
    Boolean(userProfile?.isServiceProvider) ||
    viewedRole === "ROLE_SERVICE" ||
    viewedRole === "ROLE_SERVICE_PROVIDER" ||
    Boolean(serviceProfile);
  const handle = useMemo(() => toHandle(displayName), [displayName]);
  const joinedLabel = useMemo(
    () => formatJoined(userProfile?.regDate || userProfile?.createdAt),
    [userProfile?.createdAt, userProfile?.regDate]
  );
  const locationLabel = useMemo(() => formatLocation(userProfile?.address), [userProfile?.address]);
  const serviceHeadline = useMemo(() => {
    if (!isServiceProviderProfile) return "";
    const serviceType = formatServiceType(serviceProfile?.serviceType);
    const location = [serviceProfile?.city, serviceProfile?.state]
      .filter(Boolean)
      .join(", ") || [serviceProfile?.city, serviceProfile?.country].filter(Boolean).join(", ");
    return location ? `${serviceType} in ${location}` : serviceType;
  }, [isServiceProviderProfile, serviceProfile?.city, serviceProfile?.country, serviceProfile?.serviceType, serviceProfile?.state]);

  async function refreshFollowStats() {
    try {
      const response = await FollowService.getFollowStats(userId);
      if (response?.status === 200) {
        setFollowStats(response.followStats || {});
      }
    } catch (refreshError) {
      console.error("[PublicProfilePage] Failed to refresh follow stats", refreshError);
    }
  }

  async function handleFollowToggle(nextAction: "follow" | "unfollow") {
    if (!currentUser) {
      onNavigate?.("login");
      return;
    }

    setFollowLoading(true);
    try {
      const response =
        nextAction === "follow"
          ? await FollowService.followUser(userId)
          : await FollowService.unfollowUser(userId);

      if (response?.status !== 200) {
        throw new Error(response?.message || `Failed to ${nextAction} user`);
      }

      await refreshFollowStats();
    } catch (followError: any) {
      Alert.alert("Action failed", followError?.message || `Unable to ${nextAction} this user.`);
    } finally {
      setFollowLoading(false);
    }
  }

  function confirmAdminAction(nextAction: "block" | "unblock") {
    const title = nextAction === "block" ? "Block user" : "Unblock user";
    const message =
      nextAction === "block"
        ? "This will prevent the user from being active on the platform."
        : "This will restore the user on the platform.";

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: nextAction === "block" ? "Block" : "Unblock",
        style: nextAction === "block" ? "destructive" : "default",
        onPress: () => handleAdminAction(nextAction),
      },
    ]);
  }

  async function handleAdminAction(nextAction: "block" | "unblock") {
    setAdminLoading(true);
    try {
      const response =
        nextAction === "block"
          ? await UserProfileService.blockUser(userId, "Blocked by admin from mobile app")
          : await UserProfileService.unblockUser(userId);

      if (response?.status !== 200) {
        throw new Error(response?.message || `Failed to ${nextAction} user`);
      }

      if (response?.user) {
        setUserProfile(response.user);
      } else {
        await fetchUserProfile();
      }
    } catch (adminError: any) {
      Alert.alert("Admin action failed", adminError?.message || `Unable to ${nextAction} user.`);
    } finally {
      setAdminLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={[styles.centerTitle, { color: colors.text }]}>Loading profile...</Text>
          <Text style={[styles.centerCopy, { color: colors.textMuted }]}>
            Fetching profile details, pets, and recent posts.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <View style={[styles.errorIcon, { backgroundColor: isDark ? "rgba(248,113,113,0.16)" : "#FEE2E2" }]}>
            <Feather name="alert-triangle" size={22} color="#991B1B" />
          </View>
          <Text style={[styles.centerTitle, { color: colors.text }]}>Unable to load profile</Text>
          <Text style={[styles.centerCopy, { color: colors.textMuted }]}>{error}</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={() => onNavigate?.("back")}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[styles.centerState, { backgroundColor: colors.background }]}>
          <Text style={[styles.centerTitle, { color: colors.text }]}>User not found</Text>
          <Pressable style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={() => onNavigate?.("back")}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
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
              onPress={() => onNavigate?.("back")}
            >
              <Feather name="arrow-left" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.identityRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              {userProfile.isBlocked ? (
                <View style={styles.blockedBadge}>
                  <Feather name="slash" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <View style={styles.identityCopy}>
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, { color: colors.text }]}>{displayName}</Text>
                <View style={styles.handlePill}>
                  <Text style={[styles.handleText, { color: colors.textMuted }]}>{handle}</Text>
                </View>
              </View>
              {userProfile.bio ? (
                <Text style={[styles.bioText, { color: colors.textMuted }]}>{userProfile.bio}</Text>
              ) : null}

              {isServiceProviderProfile ? (
                <View
                  style={[
                    styles.serviceBadge,
                    {
                      backgroundColor: colors.accentSoft,
                    },
                  ]}
                >
                  <Feather name="briefcase" size={14} color={colors.success} />
                  <Text style={[styles.serviceBadgeText, { color: colors.success }]}>
                    {serviceHeadline || "Service Provider"}
                  </Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <MetaPill icon="map-pin" label={locationLabel} colors={colors} />
                <MetaPill icon="calendar" label={joinedLabel} colors={colors} />
              </View>

              {!isCurrentUserProfile ? (
                <View style={styles.actionRow}>
                  {followStats?.isFollowing ? (
                    <Pressable
                      style={[styles.actionButton, styles.actionButtonMuted, { backgroundColor: colors.backgroundMuted }]}
                      onPress={() => handleFollowToggle("unfollow")}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <>
                          <Feather name="user-check" size={16} color={colors.text} />
                          <Text style={[styles.actionButtonMutedText, { color: colors.text }]}>Following</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: colors.success }]}
                      onPress={() => handleFollowToggle("follow")}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Feather name="user-plus" size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonPrimaryText}>Follow</Text>
                        </>
                      )}
                    </Pressable>
                  )}

                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.actionButtonGhost,
                      {
                        backgroundColor: colors.backgroundElevated,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => onNavigate?.("messages", { userId: userProfile.id })}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.text} />
                    <Text style={[styles.actionButtonGhostText, { color: colors.text }]}>Message</Text>
                  </Pressable>
                </View>
              ) : null}

              {isServiceProviderProfile ? (
                <Pressable
                  style={[styles.serviceProfileButton, { backgroundColor: colors.text }]}
                  onPress={() => onNavigate?.("service-public-profile", { userId: String(userProfile.id || userId) })}
                >
                  <Feather name="external-link" size={15} color="#FFFFFF" />
                  <Text style={styles.serviceProfileButtonText}>View service profile</Text>
                </Pressable>
              ) : null}

              {isAdmin && !isCurrentUserProfile ? (
                <View style={styles.adminRow}>
                  <Pressable
                    style={[
                      styles.adminButton,
                      userProfile.isBlocked ? styles.adminButtonSuccess : styles.adminButtonDanger,
                    ]}
                    onPress={() => confirmAdminAction(userProfile.isBlocked ? "unblock" : "block")}
                    disabled={adminLoading}
                  >
                    {adminLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather
                          name={userProfile.isBlocked ? "check-circle" : "slash"}
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.adminButtonText}>
                          {userProfile.isBlocked ? "Unblock user" : "Block user"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {userProfile.isBlocked ? (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: isDark ? "rgba(245,158,11,0.14)" : "#FFF7ED",
                borderColor: isDark ? "rgba(245,158,11,0.3)" : "#FED7AA",
              },
            ]}
          >
            <Feather name="alert-octagon" size={18} color="#9A3412" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>This user is blocked</Text>
              <Text style={styles.warningCopy}>
                {userProfile.blockedReason || "This account is currently restricted on the platform."}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatCard label="Posts" value={userStats?.postCount || userPosts.length} colors={colors} />
          <Pressable style={styles.statCard} onPress={() => onNavigate?.("followers", { userId: userProfile.id })}>
            <Text style={[styles.statValue, { color: colors.text }]}>{followStats?.followersCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Followers</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => onNavigate?.("following", { userId: userProfile.id })}>
            <Text style={[styles.statValue, { color: colors.text }]}>{followStats?.followingCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Following</Text>
          </Pressable>
        </View>

        <View style={[styles.tabsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tabsRow}>
            <TabButton label="Posts" active={activeTab === "posts"} onPress={() => setActiveTab("posts")} colors={colors} />
            <TabButton label="Pets" active={activeTab === "pets"} onPress={() => setActiveTab("pets")} colors={colors} />
            <TabButton label="About" active={activeTab === "about"} onPress={() => setActiveTab("about")} colors={colors} />
          </View>

          {activeTab === "posts" ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Posts</Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>{userPosts.length} shared</Text>
              </View>

              {userProfile.isBlocked ? (
                <EmptyCard
                  icon="slash"
                  title="This user's posts are not available"
                  copy="The account is blocked, so posts are hidden from the public profile."
                  colors={colors}
                />
              ) : postsLoading ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={colors.success} />
                  <Text style={[styles.inlineLoaderText, { color: colors.textMuted }]}>Loading posts...</Text>
                </View>
              ) : userPosts.length ? (
                <View style={styles.postGrid}>
                  {userPosts.map((post) => {
                    const preview = getPostPreview(post);
                    return (
                      <Pressable
                        key={String(post.id)}
                        style={styles.postCard}
                        onPress={() => onNavigate?.("post-details", { postId: post.id })}
                      >
                        {preview.videoUrl ? (
                          <>
                            <AppVideo
                              uri={preview.videoUrl}
                              style={styles.postMedia}
                              posterUri={preview.thumbnailUrl}
                              shouldPlay={false}
                              isMuted
                              contentFit="cover"
                            />
                            <View style={styles.videoBadge}>
                              <Feather name="play" size={12} color="#FFFFFF" />
                            </View>
                          </>
                        ) : preview.imageUrl ? (
                          <Image source={{ uri: preview.imageUrl }} style={styles.postMedia} />
                        ) : (
                          <View style={[styles.postFallback, { backgroundColor: colors.border }]}>
                            <Feather name="image" size={22} color={colors.textSoft} />
                          </View>
                        )}

                        <View style={styles.postOverlay}>
                          <View style={styles.postMetric}>
                            <Feather name="heart" size={12} color="#FFFFFF" />
                            <Text style={styles.postMetricText}>{preview.likes}</Text>
                          </View>
                          <View style={styles.postMetric}>
                            <Feather name="message-circle" size={12} color="#FFFFFF" />
                            <Text style={styles.postMetricText}>{preview.comments}</Text>
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
                  copy="This user has not shared any posts yet."
                  colors={colors}
                />
              )}
            </View>
          ) : null}

          {activeTab === "pets" ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pets</Text>
                <Text style={[styles.sectionHint, { color: colors.textMuted }]}>{pets.length} profiles</Text>
              </View>

              {userProfile.isBlocked ? (
                <EmptyCard
                  icon="lock"
                  title="Pet profiles are hidden"
                  copy="This account is blocked, so pet details are not available."
                  colors={colors}
                />
              ) : petsLoading ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={colors.success} />
                  <Text style={[styles.inlineLoaderText, { color: colors.textMuted }]}>Loading pets...</Text>
                </View>
              ) : pets.length ? (
                pets.map((pet) => (
                  <View
                    key={String(pet.id)}
                    style={[
                      styles.petCard,
                      {
                        backgroundColor: colors.backgroundElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
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
                        {pet.description || "No extra details have been shared for this pet yet."}
                      </Text>
                      <View style={styles.petFooter}>
                        {pet.age ? (
                          <View style={[styles.petTag, { backgroundColor: colors.backgroundMuted }]}>
                            <Text style={[styles.petTagText, { color: colors.textMuted }]}>Age {pet.age}</Text>
                          </View>
                        ) : null}
                        <Pressable
                          style={[styles.petActionPrimary, { backgroundColor: colors.text }]}
                          onPress={() => onNavigate?.("pet-details", { petId: pet.id })}
                        >
                          <Text style={styles.petActionPrimaryText}>View pet</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyCard
                  icon="heart"
                  title="No pet profiles yet"
                  copy="This user has not added any pet profiles yet."
                  colors={colors}
                />
              )}
            </View>
          ) : null}

          {activeTab === "about" ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              </View>

              {userProfile.isBlocked ? (
                <EmptyCard
                  icon="lock"
                  title="Profile information is not available"
                  copy="This account is blocked, so public profile details are hidden."
                  colors={colors}
                />
              ) : (
                <View style={styles.aboutList}>
                  <AboutCard icon="person-outline" label="Full Name" value={displayName} colors={colors} />
                  <AboutCard icon="mail-outline" label="Email" value={userProfile.email || "Not available"} colors={colors} />
                  {userProfile.phoneNumber ? (
                    <AboutCard icon="call-outline" label="Phone Number" value={userProfile.phoneNumber} colors={colors} />
                  ) : null}
                  <AboutCard icon="calendar-outline" label="Member Since" value={joinedLabel.replace("Joined ", "")} colors={colors} />
                  <AboutCard icon="location-outline" label="Location" value={formatAddress(userProfile.address) || "Not available"} colors={colors} />
                </View>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getPostPreview(post: PublicPost) {
  const firstMedia = Array.isArray(post.media) ? post.media[0] : null;
  const normalizedType = String(firstMedia?.type || firstMedia?.mediaType || "").toUpperCase();
  const isVideo = normalizedType === "VIDEO";
  const mediaUrl = firstMedia?.url || firstMedia?.mediaUrl || null;

  return {
    imageUrl: isVideo ? null : mediaUrl || post.image || post.imageUrls?.[0] || null,
    videoUrl: isVideo ? mediaUrl : null,
    thumbnailUrl: firstMedia?.thumbnailUrl || null,
    likes: post.totalReactions ?? post.likeCount ?? post.likes ?? 0,
    comments: post.totalComments ?? post.commentCount ?? post.comments ?? 0,
  };
}

function StatCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number;
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
  colors: { textMuted: string; backgroundMuted: string };
}) {
  return (
    <View style={[styles.metaPill, { backgroundColor: colors.backgroundMuted }]}>
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
  colors: {
    backgroundMuted: string;
    backgroundElevated: string;
    border: string;
    textMuted: string;
    text: string;
  };
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

function EmptyCard({
  icon,
  title,
  copy,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  copy: string;
  colors: {
    backgroundElevated: string;
    border: string;
    accentSoft: string;
    success: string;
    text: string;
    textMuted: string;
  };
}) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
        <Feather name={icon} size={20} color={colors.success} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: colors.textMuted }]}>{copy}</Text>
    </View>
  );
}

function AboutCard({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: {
    backgroundElevated: string;
    border: string;
    accentSoft: string;
    success: string;
    text: string;
    textMuted: string;
  };
}) {
  return (
    <View style={[styles.aboutCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
      <View style={[styles.aboutIconWrap, { backgroundColor: colors.accentSoft || "rgba(49,196,141,0.12)" }]}>
        <Ionicons name={icon} size={17} color={colors.success} />
      </View>
      <View style={styles.aboutContent}>
        <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.aboutValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function normalizePetList(response: any): PetRecord[] {
  const list = response?.petList || response?.pets || response?.data || response || [];
  return Array.isArray(list) ? list : [];
}

function getPetOwnerId(pet: PetRecord) {
  return pet?.userId || pet?.ownerId || pet?.user_id || pet?.owner_id || pet?.user?.id || pet?.owner?.id || null;
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

function formatLocation(address?: PublicUser["address"]) {
  if (!address) return "Location not set";
  if (typeof address === "string") return address;
  return [address.city, address.state, address.country].filter(Boolean).join(", ") || "Location not set";
}

function formatAddress(address?: PublicUser["address"]) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [address.street, address.city, address.state, address.zipcode, address.country]
    .filter(Boolean)
    .join(", ");
}

function formatServiceType(value?: string) {
  if (!value) return "Service Provider";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

const styles = StyleSheet.create({
  safeArea: {
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
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  centerCopy: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
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
    borderWidth: 1,
  },
  coverImage: {
    width: "100%",
    height: 118,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  topBarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  identityRow: {
    marginTop: -30,
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 16,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
  },
  blockedBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  identityCopy: {
    flex: 1,
    paddingTop: 34,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "800",
  },
  handlePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(148,163,184,0.12)",
  },
  handleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bioText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  serviceBadge: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 120,
  },
  actionButtonPrimary: {},
  actionButtonPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionButtonMuted: {},
  actionButtonMutedText: {
    fontSize: 13,
    fontWeight: "800",
  },
  actionButtonGhost: {
    borderWidth: 1,
  },
  actionButtonGhostText: {
    fontSize: 13,
    fontWeight: "800",
  },
  adminRow: {
    marginTop: 12,
  },
  serviceProfileButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  serviceProfileButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  adminButtonDanger: {
    backgroundColor: "#DC2626",
  },
  adminButtonSuccess: {
    backgroundColor: "#16A34A",
  },
  adminButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  warningCard: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  warningContent: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#9A3412",
  },
  warningCopy: {
    fontSize: 13,
    lineHeight: 20,
    color: "#9A3412",
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  tabsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    fontWeight: "800",
  },
  sectionBlock: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "600",
  },
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  inlineLoaderText: {
    fontSize: 13,
  },
  postGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  postCard: {
    width: "47.8%",
    aspectRatio: 0.94,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  postMedia: {
    width: "100%",
    height: "100%",
  },
  postFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.56)",
  },
  postOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(15,23,42,0.48)",
  },
  postMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postMetricText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  petCard: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  petImage: {
    width: 94,
    height: 94,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  petContent: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: "800",
  },
  petMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  petDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
  },
  petFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },
  petTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  petTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  petActionPrimary: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  petActionPrimaryText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  aboutList: {
    gap: 12,
  },
  aboutCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  aboutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,118,110,0.1)",
  },
  aboutContent: {
    flex: 1,
    gap: 4,
  },
  aboutLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  aboutValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyCopy: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
