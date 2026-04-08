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

type FollowingUser = {
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

export default function FollowingPage({
  userId,
  onNavigate,
}: {
  userId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const followingCount = following.length;
  const confirmedCount = useMemo(
    () => following.filter((item) => item.isFollowing).length,
    [following]
  );
  const droppedCount = Math.max(0, followingCount - confirmedCount);

  const hydrateFollowing = useCallback(async () => {
    if (!userId) {
      setError("No user ID was provided.");
      setFollowing([]);
      return;
    }

    setError("");

    const response = await FollowService.getFollowing(userId);
    if (response?.status !== 200) {
      setFollowing([]);
      setError(response?.message || "Failed to load following.");
      return;
    }

    const mapped = (response?.followingList || [])
      .map((item: any, index: number) => {
        const user = item?.following || item?.user || item;
        const id = user?.id || user?._id || item?.id || `following-${index}`;
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
        } satisfies FollowingUser;
      })
      .filter(Boolean) as FollowingUser[];

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

    setFollowing(withStatus);
  }, [userId]);

  const loadScreen = useCallback(async () => {
    try {
      setLoading(true);
      const [storedUser] = await Promise.all([AuthService.getStoredUser(), hydrateFollowing()]);
      setCurrentUser(storedUser);
    } finally {
      setLoading(false);
    }
  }, [hydrateFollowing]);

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
    setFollowing((prev) =>
      prev.map((user) =>
        user.id === targetUserId ? { ...user, followLoading: true } : user
      )
    );

    try {
      const response = isCurrentlyFollowing
        ? await FollowService.unfollowUser(targetUserId)
        : await FollowService.followUser(targetUserId);

      if (response?.status === 200) {
        setFollowing((prev) =>
          prev.map((user) =>
            user.id === targetUserId
              ? { ...user, isFollowing: !isCurrentlyFollowing, followLoading: false }
              : user
          )
        );
      } else {
        setError(response?.message || "Failed to update follow status.");
        setFollowing((prev) =>
          prev.map((user) =>
            user.id === targetUserId ? { ...user, followLoading: false } : user
          )
        );
      }
    } catch (toggleError: any) {
      setError(toggleError?.message || "Failed to update follow status.");
      setFollowing((prev) =>
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
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingTitle}>Loading following</Text>
          <Text style={styles.loadingText}>
            Pulling the accounts this profile tracks and checking current follow state.
          </Text>
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
              <Feather name="arrow-left" size={18} color="#DBEAFE" />
            </Pressable>

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="account-check-outline" size={16} color="#172554" />
              <Text style={styles.heroBadgeText}>Following</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Accounts this profile has chosen to track.</Text>
          <Text style={styles.heroSubtitle}>
            Review the active following list, unfollow where needed, and quickly jump into any
            public profile from a cleaner mobile layout.
          </Text>

          <View style={styles.statsRow}>
            <StatPill label="Following" value={`${followingCount}`} />
            <StatPill label="Active" value={`${confirmedCount}`} />
            <StatPill label="Changed" value={`${droppedCount}`} />
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
            <Text style={styles.summaryLabel}>Current list</Text>
            <Text style={styles.summaryValue}>{followingCount} accounts</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Still followed</Text>
            <Text style={styles.summaryValue}>{confirmedCount} confirmed</Text>
          </View>
        </View>

        {following.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="user-plus" size={30} color="#1E3A8A" />
            </View>
            <Text style={styles.emptyTitle}>Not following anyone yet</Text>
            <Text style={styles.emptyText}>
              When this profile follows people, they will appear here with quick management actions.
            </Text>
            <Pressable style={styles.refreshButton} onPress={onRefresh}>
              <Feather name="refresh-cw" size={16} color="#1D4ED8" />
              <Text style={styles.refreshButtonText}>Refresh list</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listCard}>
            {following.map((user) => {
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
                        ) : (
                          <View style={styles.staleBadge}>
                            <Text style={styles.staleBadgeText}>Out of sync</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userHandle} numberOfLines={1}>
                        @{user.username || makeHandle(user.name, user.email, 0)}
                      </Text>
                      <Text style={styles.userMeta} numberOfLines={1}>
                        {user.createdAt ? `Started ${formatDate(user.createdAt)}` : "Following"}
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
                          color={user.isFollowing ? "#1D4ED8" : "#FFFFFF"}
                        />
                      ) : (
                        <>
                          <Feather
                            name={user.isFollowing ? "user-check" : "user-plus"}
                            size={15}
                            color={user.isFollowing ? "#1D4ED8" : "#FFFFFF"}
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
    backgroundColor: "#F5F7FB",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F5F7FB",
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
    backgroundColor: "#F5F7FB",
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
    backgroundColor: "#172554",
  },
  heroGlowOne: {
    position: "absolute",
    top: -45,
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(96, 165, 250, 0.24)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -80,
    left: -25,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(14, 165, 233, 0.18)",
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
    backgroundColor: "#DBEAFE",
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#172554",
  },
  heroTitle: {
    marginTop: 20,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#EFF6FF",
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#BFDBFE",
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
    color: "#93C5FD",
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
    borderColor: "#DBE4F0",
  },
  summaryBlock: {
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 12,
    backgroundColor: "#DBE4F0",
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
    borderColor: "#DBE4F0",
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
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
    backgroundColor: "#DBEAFE",
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  listCard: {
    borderRadius: 24,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBE4F0",
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
    backgroundColor: "#DBEAFE",
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1D4ED8",
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
    backgroundColor: "#DBEAFE",
  },
  followingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#1D4ED8",
  },
  staleBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E2E8F0",
  },
  staleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#475569",
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
    backgroundColor: "#1D4ED8",
  },
  followButtonActive: {
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
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
    color: "#1D4ED8",
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
