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

import ApiService from "../../api/ApiService";
import NotificationService from "../../api/NotificationService";

type NotificationItem = {
  id: string;
  type?: string;
  read?: boolean;
  message?: string;
  senderId?: string | number;
  senderName?: string;
  userName?: string;
  senderProfileImage?: string;
  postId?: string | number;
  commentId?: string | number;
  createdAt?: string;
  commentContent?: string;
  commentText?: string;
  content?: string;
  reactionType?: string;
  reaction?: string;
  typeDetail?: string;
  postImage?: string;
  postImageUrl?: string;
  mediaUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
};

type FilterType = "all" | "unread" | "read";

export default function NotificationPage({
  onNavigate,
  embedded = false,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  embedded?: boolean;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) {
        if (!append) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await NotificationService.getMyNotifications(pageNum, 20);

      if (response?.status === 200) {
        const newNotifications = response.notificationList || [];
        setNotifications((prev) => (append ? [...prev, ...newNotifications] : newNotifications));
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      } else {
        throw new Error(response?.message || "Failed to fetch notifications");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to load notifications";
      if (errorMessage.includes("JDBC") && errorMessage.includes("SQL")) {
        setError("Server error. Please try again later.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      if (response?.status === 200) {
        const nextUnreadCount = NotificationService.getNormalizedUnreadCount(response);
        setUnreadCount(nextUnreadCount);
        NotificationService.notifyUnreadCountChange(nextUnreadCount);
      }
    } catch {
    }
  }, []);

  const refreshNotificationsSilently = useCallback(async () => {
    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        NotificationService.getMyNotifications(0, 20),
        NotificationService.getUnreadCount(),
      ]);

      if (notificationsResponse?.status === 200) {
        const latestNotifications = notificationsResponse.notificationList || [];
        setNotifications((prev) => {
          if (!Array.isArray(prev) || prev.length !== latestNotifications.length) {
            return latestNotifications;
          }

          const prevSignature = prev
            .map((item) => `${item.id}:${item.read}:${item.createdAt}`)
            .join("|");
          const nextSignature = latestNotifications
            .map((item: NotificationItem) => `${item.id}:${item.read}:${item.createdAt}`)
            .join("|");

          return prevSignature === nextSignature ? prev : latestNotifications;
        });
        setHasMore(latestNotifications.length === 20);
        setPage(0);
      }

      if (unreadResponse?.status === 200) {
        const nextUnreadCount = NotificationService.getNormalizedUnreadCount(unreadResponse);
        setUnreadCount(nextUnreadCount);
        NotificationService.notifyUnreadCountChange(nextUnreadCount);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      const isAuthenticated = await ApiService.isAuthenticated();
      if (!isAuthenticated) {
        setLoading(false);
        setError("Please log in to view notifications.");
        return;
      }

      await Promise.all([fetchNotifications(0), fetchUnreadCount()]);
    };

    boot();

    return () => {
      NotificationService.cleanupPushNotificationListeners();
    };
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotificationsSilently();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshNotificationsSilently]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 2600);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === "unread") return !notification.read;
      if (filter === "read") return Boolean(notification.read);
      return true;
    });
  }, [filter, notifications]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );
  const readNotificationsCount = notifications.length - unreadNotificationsCount;

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError("");
    Promise.all([fetchNotifications(0), fetchUnreadCount()]).finally(() => setRefreshing(false));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
      );
      const nextUnreadCount = Math.max(
        0,
        notifications.filter((notif) => !notif.read && notif.id !== notificationId).length
      );
      setUnreadCount(nextUnreadCount);
      NotificationService.notifyUnreadCountChange(nextUnreadCount);
      setSuccess("Notification marked as read");
    } catch {
      setError("Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
      NotificationService.notifyUnreadCountChange(0);
      setSuccess("All notifications marked as read");
    } catch {
      setError("Failed to mark all notifications as read.");
    }
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    switch (notification.type) {
      case "NEW_POST":
      case "POST_LIKE":
      case "COMMENT":
        if (notification.postId) {
          onNavigate?.("post-details", { postId: notification.postId });
        } else {
          setError("Post information is not available.");
        }
        break;
      case "REPLY":
        if (notification.postId && notification.commentId) {
          onNavigate?.("post-details", {
            postId: notification.postId,
            commentId: notification.commentId,
          });
        } else {
          setError("Post or comment information is not available.");
        }
        break;
      case "FOLLOW":
        if (notification.senderId) {
          onNavigate?.("customer-profile", { userId: notification.senderId });
        } else {
          setError("User information is not available.");
        }
        break;
      default:
        break;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingTitle}>Loading notifications</Text>
          <Text style={styles.loadingText}>Pulling your latest activity and unread updates.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scrollContent = (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroBadgeText}>Notifications</Text>

            {unreadCount > 0 ? (
              <Pressable style={styles.markAllPill} onPress={handleMarkAllAsRead}>
                <MaterialCommunityIcons name="check-all" size={16} color="#0F766E" />
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.heroTitle}>
            {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up"}
          </Text>
          <Text style={styles.heroSubtitle}>
            Follow activity, post reactions, replies, and new content from one cleaner mobile inbox.
          </Text>

          <View style={styles.heroStatsRow}>
            <StatPill label="All" value={`${notifications.length}`} />
            <StatPill label="Unread" value={`${unreadNotificationsCount}`} />
            <StatPill label="Read" value={`${readNotificationsCount}`} />
          </View>

        </View>

        <View style={styles.filterRow}>
          <FilterPill
            label={`All (${notifications.length})`}
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterPill
            label={`Unread (${unreadNotificationsCount})`}
            active={filter === "unread"}
            onPress={() => setFilter("unread")}
          />
          <FilterPill
            label={`Read (${readNotificationsCount})`}
            active={filter === "read"}
            onPress={() => setFilter("read")}
          />
        </View>

        {success ? (
          <View style={[styles.messageBanner, styles.messageSuccess]}>
            <Feather name="check-circle" size={16} color="#065F46" />
            <Text style={[styles.messageText, styles.messageTextSuccess]}>{success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.messageBanner, styles.messageError]}>
            <Feather name="alert-triangle" size={16} color="#991B1B" />
            <Text style={[styles.messageText, styles.messageTextError]}>{error}</Text>
          </View>
        ) : null}

        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={30} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              {filter === "all" ? "You're all caught up." : `No ${filter} notifications right now.`}
            </Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {filteredNotifications.map((notification) => {
              const presentation = getNotificationPresentation(notification);
              const senderName = getSenderName(notification);
              return (
                <Pressable
                  key={notification.id}
                  style={[styles.notificationRow, !notification.read && styles.notificationRowUnread]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.avatarWrap}>
                    <NotificationAvatar imageUrl={notification.senderProfileImage} alt={senderName} />
                    <View style={[styles.typeBadge, { backgroundColor: presentation.badgeBg }]}>
                      <MaterialCommunityIcons
                        name={presentation.icon}
                        size={14}
                        color={presentation.badgeColor}
                      />
                    </View>
                  </View>

                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{presentation.title}</Text>
                    {presentation.detail ? (
                      <Text style={styles.notificationDetail} numberOfLines={2}>
                        &quot;{presentation.detail}&quot;
                      </Text>
                    ) : null}
                    <View style={styles.notificationMetaRow}>
                      <Text style={styles.notificationTime}>{presentation.time}</Text>
                      {!notification.read ? <View style={styles.unreadDot} /> : null}
                    </View>
                  </View>

                  <View style={styles.notificationRight}>
                    {presentation.previewImage ? (
                      <Image source={{ uri: presentation.previewImage }} style={styles.previewImage} />
                    ) : (
                      <View style={styles.previewFallback}>
                        <MaterialCommunityIcons name="bell-outline" size={18} color="#64748B" />
                      </View>
                    )}

                    {!notification.read ? (
                      <Pressable
                        style={styles.readButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <Feather name="check" size={12} color="#166534" />
                      </Pressable>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {hasMore && filteredNotifications.length > 0 ? (
          <Pressable
            style={[styles.loadMoreButton, loadingMore && styles.loadMoreButtonDisabled]}
            onPress={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#0F766E" />
            ) : (
              <>
                <Feather name="chevrons-down" size={16} color="#0F766E" />
                <Text style={styles.loadMoreText}>Load More</Text>
              </>
            )}
          </Pressable>
        ) : null}

        {!hasMore && filteredNotifications.length > 0 ? (
          <Text style={styles.endText}>No more notifications to load</Text>
        ) : null}
    </ScrollView>
  );

  if (embedded) {
    return <View style={styles.embeddedContainer}>{scrollContent}</View>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {scrollContent}
    </SafeAreaView>
  );
}

function NotificationAvatar({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.avatar} accessibilityLabel={alt} />;
  }

  return (
    <View style={styles.avatarFallback}>
      <MaterialCommunityIcons name="paw" size={22} color="#0F766E" />
    </View>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.filterPill, active && styles.filterPillActive]} onPress={onPress}>
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return "Unknown time";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "Unknown time";
  }
}

function getSenderName(notification: NotificationItem) {
  return notification.senderName || notification.userName || "Someone";
}

function extractCommentText(notification: NotificationItem) {
  if (notification.commentContent) return notification.commentContent;
  if (notification.commentText) return notification.commentText;
  if (notification.content) return notification.content;
  if (!notification.message) return "";

  const quoted = notification.message.match(/["']([^"']+)["']/);
  if (quoted?.[1]) return quoted[1];
  return notification.message;
}

function extractReactionType(notification: NotificationItem) {
  const source = (
    notification.reactionType ||
    notification.reaction ||
    notification.typeDetail ||
    notification.message ||
    ""
  )
    .toString()
    .toUpperCase();

  if (source.includes("LOVE")) return "LOVE";
  if (source.includes("HAHA")) return "HAHA";
  if (source.includes("WOW")) return "WOW";
  if (source.includes("SAD")) return "SAD";
  if (source.includes("ANGRY")) return "ANGRY";
  return "LIKE";
}

function getReactionBadge(reactionType: string) {
  switch (reactionType) {
    case "LOVE":
      return { label: "Loved", icon: "heart", badgeBg: "#FFE4E6", badgeColor: "#E11D48" };
    case "HAHA":
      return { label: "Found it funny", icon: "emoticon-happy-outline", badgeBg: "#FEF3C7", badgeColor: "#D97706" };
    case "WOW":
      return { label: "Reacted wow", icon: "emoticon-excited-outline", badgeBg: "#E0F2FE", badgeColor: "#0284C7" };
    case "SAD":
      return { label: "Reacted sad", icon: "emoticon-sad-outline", badgeBg: "#E0E7FF", badgeColor: "#4F46E5" };
    case "ANGRY":
      return { label: "Reacted angry", icon: "emoticon-angry-outline", badgeBg: "#FEE2E2", badgeColor: "#DC2626" };
    default:
      return { label: "Liked", icon: "paw", badgeBg: "#ECFCCB", badgeColor: "#65A30D" };
  }
}

function getPostPreviewImage(notification: NotificationItem) {
  return (
    notification.postImage ||
    notification.postImageUrl ||
    notification.mediaUrl ||
    notification.imageUrl ||
    notification.thumbnailUrl ||
    ""
  );
}

function getNotificationPresentation(notification: NotificationItem) {
  const type = notification.type;
  const sender = getSenderName(notification);
  const time = formatDate(notification.createdAt);

  if (type === "COMMENT" || type === "REPLY") {
    return {
      icon: type === "REPLY" ? "reply-outline" : "message-reply-text-outline",
      badgeBg: type === "REPLY" ? "#E0E7FF" : "#DBEAFE",
      badgeColor: type === "REPLY" ? "#4338CA" : "#2563EB",
      title: `${sender} ${type === "REPLY" ? "replied to your comment" : "commented on your post"}`,
      detail: extractCommentText(notification),
      time,
      previewImage: getPostPreviewImage(notification),
    };
  }

  if (type === "FOLLOW") {
    return {
      icon: "account-plus-outline",
      badgeBg: "#DCFCE7",
      badgeColor: "#16A34A",
      title: `${sender} started following you`,
      detail: "",
      time,
      previewImage: "",
    };
  }

  if (type === "POST_LIKE") {
    const reaction = getReactionBadge(extractReactionType(notification));
    return {
      icon: reaction.icon,
      badgeBg: reaction.badgeBg,
      badgeColor: reaction.badgeColor,
      title: `${sender} ${reaction.label.toLowerCase()} your post`,
      detail: reaction.label,
      time,
      previewImage: getPostPreviewImage(notification),
    };
  }

  if (type === "NEW_POST") {
    return {
      icon: "post-outline",
      badgeBg: "#F3E8FF",
      badgeColor: "#7C3AED",
      title: `${sender} created a new post`,
      detail: notification.message || "",
      time,
      previewImage: getPostPreviewImage(notification),
    };
  }

  return {
    icon: "bell-outline",
    badgeBg: "#E2E8F0",
    badgeColor: "#475569",
    title: notification.message || "New notification",
    detail: "",
    time,
    previewImage: getPostPreviewImage(notification),
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7F5",
  },
  embeddedContainer: {
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
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBadgeText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  markAllPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#ECFDF5",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  statPill: {
    minWidth: 90,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#64748B",
  },
  statValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  connectionBanner: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  connectionOnline: {
    backgroundColor: "#D1FAE5",
  },
  connectionOffline: {
    backgroundColor: "#FEF3C7",
  },
  connectionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  connectionTextOnline: {
    color: "#065F46",
  },
  connectionTextOffline: {
    color: "#92400E",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
  },
  filterPillActive: {
    backgroundColor: "#0F766E",
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  messageSuccess: {
    backgroundColor: "#D1FAE5",
  },
  messageError: {
    backgroundColor: "#FEE2E2",
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  messageTextSuccess: {
    color: "#065F46",
  },
  messageTextError: {
    color: "#991B1B",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 34,
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
  listCard: {
    borderRadius: 24,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
  },
  notificationRowUnread: {
    backgroundColor: "#F8FAFC",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E2E8F0",
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  typeBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  notificationDetail: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  notificationMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  notificationTime: {
    fontSize: 11,
    color: "#94A3B8",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F766E",
  },
  notificationRight: {
    alignItems: "center",
    gap: 8,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  previewFallback: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  readButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  loadMoreButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#CCFBF1",
  },
  loadMoreButtonDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
  },
  endText: {
    textAlign: "center",
    fontSize: 13,
    color: "#64748B",
  },
  nativeNoteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#A5F3FC",
  },
  nativeNoteTextWrap: {
    flex: 1,
  },
  nativeNoteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#155E75",
  },
  nativeNoteText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#0F766E",
  },
});
