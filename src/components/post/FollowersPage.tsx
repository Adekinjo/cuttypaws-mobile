import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type FollowerUser = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  profileImageUrl?: string;
  imageUrl?: string;
  avatar?: string;
  isFollowing: boolean;
  followLoading: boolean;
  createdAt?: string;
};

export default function FollowersPage({
  userId,
  onNavigate,
}: {
  userId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const followerCount = followers.length;
  const followingBackCount = useMemo(
    () => followers.filter((item) => item.isFollowing).length,
    [followers]
  );

  const hydrateFollowers = useCallback(async () => {
    if (!userId) {
      setError("No user ID was provided.");
      setFollowers([]);
      return;
    }

    setError("");

    const response = await FollowService.getFollowers(userId);
    if (response?.status !== 200) {
      setFollowers([]);
      setError(response?.message || "Failed to load followers.");
      return;
    }

    const mapped = (response?.followersList || [])
      .map((item: any, index: number) => {
        const user = item?.follower || item?.user || item;
        const id = user?.id || user?._id || item?.id || `follower-${index}`;
        if (!id) return null;

        return {
          id,
          name: user?.name || user?.fullName || "Unknown User",
          username: user?.username || makeHandle(user?.name, user?.email, index),
          email: user?.email || "",
          profileImageUrl: user?.profileImageUrl || user?.imageUrl || user?.avatar || "",
          imageUrl: user?.imageUrl || "",
          avatar: user?.avatar || "",
          createdAt: item?.createdAt,
          isFollowing: false,
          followLoading: false,
        } satisfies FollowerUser;
      })
      .filter(Boolean) as FollowerUser[];

    const withStatus = await Promise.all(
      mapped.map(async (item) => {
        try {
          const status = await FollowService.checkFollowStatus(item.id);
          return {
            ...item,
            isFollowing: Boolean(status?.followStats?.isFollowing),
          };
        } catch {
          return item;
        }
      })
    );

    setFollowers(withStatus);
  }, [userId]);

  const loadScreen = useCallback(async () => {
    try {
      setLoading(true);
      const [storedUser] = await Promise.all([AuthService.getStoredUser(), hydrateFollowers()]);
      setCurrentUser(storedUser);
    } finally {
      setLoading(false);
    }
  }, [hydrateFollowers]);

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadScreen();
    } finally {
      setRefreshing(false);
    }
  }, [loadScreen]);

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser?.id) {
      onNavigate?.("login");
      return;
    }

    setError("");
    setFollowers((prev) =>
      prev.map((user) =>
        user.id === targetUserId ? { ...user, followLoading: true } : user
      )
    );

    try {
      const response = isCurrentlyFollowing
        ? await FollowService.unfollowUser(targetUserId)
        : await FollowService.followUser(targetUserId);

      if (response?.status === 200) {
        setFollowers((prev) =>
          prev.map((user) =>
            user.id === targetUserId
              ? { ...user, isFollowing: !isCurrentlyFollowing, followLoading: false }
              : user
          )
        );
      } else {
        setError(response?.message || "Failed to update follow status.");
        setFollowers((prev) =>
          prev.map((user) =>
            user.id === targetUserId ? { ...user, followLoading: false } : user
          )
        );
      }
    } catch (toggleError: any) {
      setError(toggleError?.message || "Failed to update follow status.");
      setFollowers((prev) =>
        prev.map((user) =>
          user.id === targetUserId ? { ...user, followLoading: false } : user
        )
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingTitle}>Loading followers</Text>
          <Text style={styles.loadingText}>Building the audience list and checking follow state.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <Pressable style={styles.iconButton} onPress={() => onNavigate?.("back")}>
              <Feather name="arrow-left" size={18} color="#E2E8F0" />
            </Pressable>

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="account-multiple-outline" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Followers</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>People keeping up with this profile.</Text>
          <Text style={styles.heroSubtitle}>
            Review who follows this account, follow back selectively, and keep the community
            relationship visible in one clean mobile screen.
          </Text>

          <View style={styles.statsRow}>
            <StatPill label="Total" value={`${followerCount}`} />
            <StatPill label="Following back" value={`${followingBackCount}`} />
            <StatPill label="Profile" value={userId?.slice(0, 6) || "User"} />
          </View>
        </View>

        {error ? (
          <View style={[styles.messageBanner, styles.messageBannerError]}>
            <Feather name="alert-circle" size={16} color="#991B1B" />
            <Text style={[styles.messageText, styles.messageTextError]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.summaryCard}>
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Audience size</Text>
            <Text style={styles.summaryValue}>
              {followerCount} follower{followerCount === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Mutual signal</Text>
            <Text style={styles.summaryValue}>{followingBackCount} followed back</Text>
          </View>
        </View>

        {followers.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="users" size={30} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>No followers yet</Text>
            <Text style={styles.emptyText}>
              When people start following this profile, they will appear here with quick actions.
            </Text>
            <Pressable style={styles.refreshButton} onPress={onRefresh}>
              <Feather name="refresh-cw" size={16} color="#0F766E" />
              <Text style={styles.refreshButtonText}>Refresh list</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listCard}>
            {followers.map((user) => {
              const avatar = user.profileImageUrl || user.imageUrl || user.avatar || "";
              const isSelf = currentUser?.id === user.id;
              return (
                <Pressable
                  key={user.id}
                  style={styles.userRow}
                  onPress={() => onNavigate?.("customer-profile", { userId: user.id })}
                >
                  <View style={styles.userInfoRow}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarFallbackText}>
                          {getInitials(user.name || user.username || "U")}
                        </Text>
                      </View>
                    )}

                    <View style={styles.userTextWrap}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {user.name || "Unknown User"}
                        </Text>
                        {user.isFollowing ? (
                          <View style={styles.followingBadge}>
                            <Text style={styles.followingBadgeText}>Following</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.userHandle} numberOfLines={1}>
                        @{user.username || makeHandle(user.name, user.email, 0)}
                      </Text>
                      <Text style={styles.userMeta} numberOfLines={1}>
                        {user.createdAt ? `Followed ${formatDate(user.createdAt)}` : "Follower"}
                      </Text>
                    </View>
                  </View>

                  {!isSelf ? (
                    <Pressable
                      style={[
                        styles.followButton,
                        user.isFollowing && styles.followButtonActive,
                        user.followLoading && styles.followButtonDisabled,
                      ]}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleFollowToggle(user.id, user.isFollowing);
                      }}
                      disabled={user.followLoading}
                    >
                      {user.followLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={user.isFollowing ? "#0F766E" : "#FFFFFF"}
                        />
                      ) : (
                        <>
                          <Feather
                            name={user.isFollowing ? "user-check" : "user-plus"}
                            size={15}
                            color={user.isFollowing ? "#0F766E" : "#FFFFFF"}
                          />
                          <Text
                            style={[
                              styles.followButtonText,
                              user.isFollowing && styles.followButtonTextActive,
                            ]}
                          >
                            {user.isFollowing ? "Following" : "Follow"}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.selfPill}>
                      <Text style={styles.selfPillText}>You</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeHandle(name?: string, email?: string, index = 0) {
  const fromName = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  if (fromName) return fromName;
  const fromEmail = (email || "").split("@")[0]?.toLowerCase();
  if (fromEmail) return fromEmail;
  return `user${index + 1}`;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    paddingBottom: 36,
    gap: 16,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F4F7F5",
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  loadingText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#64748B",
  },
  heroCard: {
    marginTop: 8,
    overflow: "hidden",
    borderRadius: 28,
    padding: 22,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -45,
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.24)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -80,
    left: -25,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(59, 130, 246, 0.18)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148, 163, 184, 0.18)",
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
  heroTitle: {
    marginTop: 20,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#CBD5E1",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  statPill: {
    minWidth: 92,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#94A3B8",
  },
  statValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  messageBannerError: {
    backgroundColor: "#FEE2E2",
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  messageTextError: {
    color: "#991B1B",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  summaryBlock: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 12,
    backgroundColor: "#E2E8F0",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#64748B",
  },
  summaryValue: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#64748B",
  },
  refreshButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#CCFBF1",
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
  },
  listCard: {
    borderRadius: 24,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userInfoRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E2E8F0",
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F766E",
  },
  userTextWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  followingBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#DCFCE7",
  },
  followingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#166534",
  },
  userHandle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  userMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#94A3B8",
  },
  followButton: {
    minWidth: 102,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F766E",
  },
  followButtonActive: {
    borderWidth: 1,
    borderColor: "#99F6E4",
    backgroundColor: "#ECFEFF",
  },
  followButtonDisabled: {
    opacity: 0.55,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  followButtonTextActive: {
    color: "#0F766E",
  },
  selfPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
  },
  selfPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
  },
});
