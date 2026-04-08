import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Bookmark, Bone, Cookie, Heart, MessageSquareHeart, PawPrint, Send } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import CommentLikeService from "../../api/CommentLikeService";
import CommentsService from "../../api/CommentsService";
import LikesService from "../../api/LikesService";
import ServiceProviderService from "../../api/ServiceProviderService";
import AppVideo from "../common/AppVideo";
import { useTheme } from "../context/ThemeContext";
import ReactionsPicker from "./ReactionsPicker";

type CurrentUser = {
  id?: string | number | null;
  name?: string;
  email?: string;
};

type PostMedia = {
  url?: string;
  mediaUrl?: string;
  streamUrl?: string;
  type?: string;
  mediaType?: string;
  thumbnailUrl?: string;
};

type PostComment = {
  id: string;
  userId?: string | number;
  userName?: string;
  userProfileImage?: string;
  content?: string;
  createdAt?: string;
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
  userReaction?: string | null;
  replies?: PostComment[];
};

type PostData = {
  id?: string | number;
  ownerId?: string | number;
  ownerName?: string;
  ownerProfileImage?: string;
  ownerRole?: string;
  createdAt?: string;
  caption?: string;
  media?: PostMedia[];
  imageUrls?: string[];
  userReaction?: keyof typeof LikesService.ReactionType | null;
  likedByCurrentUser?: boolean;
  isLikedByCurrentUser?: boolean;
  reactionsCount?: Record<string, number>;
  totalReactions?: number;
  likeCount?: number;
  commentCount?: number;
  totalComments?: number;
  [key: string]: any;
};

const CAPTION_LIMIT = 150;

export default function PostCard({
  post,
  onDelete,
  onEdit,
  onPress,
  onNavigate,
  isOwner = false,
  currentUser,
  isActive = false,
}: {
  post: PostData;
  onDelete?: (postId: string | number) => void;
  onEdit?: (postId: string | number) => void;
  onPress?: () => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  isOwner?: boolean;
  currentUser?: CurrentUser | null;
  isActive?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [serviceProfile, setServiceProfile] = useState<any>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaWidth, setMediaWidth] = useState(0);
  const [showMoreCaption, setShowMoreCaption] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactionsCount, setReactionsCount] = useState<Record<string, number>>({});
  const [totalReactions, setTotalReactions] = useState(0);
  const [totalComments, setTotalComments] = useState(post?.commentCount ?? 0);
  const [commentReactionsLoading, setCommentReactionsLoading] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!post) return;

    if (post.userReaction) {
      setUserReaction(post.userReaction);
    } else if (post.isLikedByCurrentUser || post.likedByCurrentUser) {
      setUserReaction("PAWPRINT");
    } else {
      setUserReaction(null);
    }

    setReactionsCount(post.reactionsCount || {});
    setTotalReactions(post.totalReactions ?? post.likeCount ?? 0);
    setTotalComments(post.commentCount ?? post.totalComments ?? 0);
  }, [post]);

  useEffect(() => {
    let active = true;

    const loadServiceProfile = async () => {
      if (!post?.ownerId) return;
      if (
        post?.ownerRole &&
        post.ownerRole !== "ROLE_SERVICE" &&
        post.ownerRole !== "ROLE_SERVICE_PROVIDER"
      ) {
        if (active) setServiceProfile(null);
        return;
      }

      try {
        const cached = await ServiceProviderService.getCachedPublicServiceProfile(
          String(post.ownerId)
        );
        if (cached?.status === 200 && active) {
          setServiceProfile(cached.serviceProfile || null);
          return;
        }

        const response = await ServiceProviderService.getPublicServiceProfile(
          String(post.ownerId)
        );
        if (active && response?.status === 200) {
          await ServiceProviderService.setCachedPublicServiceProfile(
            String(post.ownerId),
            response
          );
          setServiceProfile(response.serviceProfile || null);
        }
      } catch {
        if (active) setServiceProfile(null);
      }
    };

    loadServiceProfile();

    return () => {
      active = false;
    };
  }, [post?.ownerId, post?.ownerRole]);

  useEffect(() => {
    const fetchUserReaction = async () => {
      if (!currentUser?.id || !post?.id) return;

      const hasReactionStateFromFeed =
        post?.userReaction !== undefined ||
        post?.likedByCurrentUser !== undefined ||
        post?.isLikedByCurrentUser !== undefined;

      if (hasReactionStateFromFeed) return;

      try {
        const response = await LikesService.getUserReaction(String(post.id));
        if (response?.status === 200 && response?.data?.hasReacted) {
          setUserReaction(response.data.reactionType);
        }
      } catch {
      }
    };

    fetchUserReaction();
  }, [currentUser?.id, post?.id, post?.userReaction, post?.likedByCurrentUser, post?.isLikedByCurrentUser]);

  const mediaItems = useMemo(() => {
    const normalizedFromMedia = Array.isArray(post?.media)
      ? post.media
          .map((item) => ({
            url: item?.url || item?.mediaUrl || null,
            streamUrl: item?.streamUrl || null,
            type: String(item?.type || item?.mediaType || "IMAGE").toUpperCase(),
            thumbnailUrl: item?.thumbnailUrl || null,
          }))
          .filter((item) => item.url || item.streamUrl)
      : [];

    const normalizedFromImageUrls = Array.isArray(post?.imageUrls)
      ? post.imageUrls.filter(Boolean).map((url) => ({
          url,
          streamUrl: null,
          type: "IMAGE",
          thumbnailUrl: null,
        }))
      : [];

    const unique = new Map<string, any>();
    [...normalizedFromMedia, ...normalizedFromImageUrls].forEach((item) => {
      const finalUrl = item.streamUrl || item.url;
      const key = `${item.type}|${finalUrl}`;
      if (!unique.has(key)) unique.set(key, item);
    });

    return Array.from(unique.values());
  }, [post]);

  const ownerDisplayLabel = serviceProfile?.status === "ACTIVE"
    ? buildServiceLabel(serviceProfile)
    : buildPetOwnerLabel(post);

  const isImageCarousel =
    mediaItems.length > 1 &&
    mediaItems.every((item) => String(item?.type || "").toUpperCase() === "IMAGE");

  useEffect(() => {
    setSelectedMediaIndex(0);
  }, [post?.id, mediaItems.length]);

  const handleOwnerPress = () => {
    if (post?.ownerId != null && onNavigate) {
      onNavigate("customer-profile", { userId: String(post.ownerId) });
      return;
    }

    onPress?.();
  };

  const handleReaction = async (reactionType: keyof typeof LikesService.ReactionType) => {
    if (!currentUser?.id || !post?.id || reactionLoading) return;

    setReactionLoading(true);
    setError("");
    try {
      const response = await LikesService.reactToPost(String(post.id), reactionType);
      if (response?.status === 200) {
        const reactions = response.data?.reactions;
        setUserReaction(response.data?.userReaction ?? reactionType);
        setReactionsCount(reactions?.counts || {});
        setTotalReactions(reactions?.total ?? 0);
      } else {
        setError(response?.message || "Failed to react to post.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to react to post.");
    } finally {
      setReactionLoading(false);
    }
  };

  const handleRemoveReaction = async () => {
    if (!currentUser?.id || !post?.id || !userReaction || reactionLoading) return;
    setReactionLoading(true);
    setError("");
    try {
      const response = await LikesService.removeReaction(String(post.id));
      if (response?.status === 200) {
        const reactions = response.data?.reactions;
        setUserReaction(null);
        setReactionsCount(reactions?.counts || {});
        setTotalReactions(reactions?.total ?? 0);
      } else {
        setError(response?.message || "Failed to remove reaction.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to remove reaction.");
    } finally {
      setReactionLoading(false);
    }
  };

  const fetchComments = useCallback(async () => {
    if (!post?.id) return;
    setCommentsLoading(true);
    setError("");
    try {
      const res = await CommentsService.getCommentsByPostId(String(post.id), 0, 50);
      if (res?.status === 200) {
        const list = res.commentList || [];
        setComments(list);
        setTotalComments(res.totalComments ?? post?.commentCount ?? list.length);
      }
    } catch {
      setError("Failed to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [post?.id, post?.commentCount]);

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments((prev) => !prev);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !post?.id) return;
    setCommentLoading(true);
    setError("");
    try {
      const res = await CommentsService.createComment({
        postId: post.id,
        content: newComment.trim(),
      });
      if (res?.status === 200) {
        if (res.comment) setComments((prev) => [res.comment, ...prev]);
        setNewComment("");
        setTotalComments((prev) => prev + 1);
        setShowComments(true);
      } else {
        setError(res?.message || "Failed to add comment.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to add comment.");
    } finally {
      setCommentLoading(false);
    }
  };

  const submitReply = async (commentId: string) => {
    if (!replyText.trim() || !post?.id) return;
    try {
      const res = await CommentsService.createComment({
        postId: post.id,
        content: replyText.trim(),
        parentCommentId: commentId,
      });
      if (res?.status === 200) {
        setReplyText("");
        setReplyingTo(null);
        fetchComments();
      } else {
        setError(res?.message || "Failed to reply.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reply.");
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await CommentsService.deleteComment(commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      setTotalComments((prev) => Math.max(0, prev - 1));
    } catch {
      setError("Failed to delete comment.");
    }
  };

  const updateCommentTree = (
    targetId: string,
    updater: (comment: PostComment) => PostComment
  ) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === targetId) return updater(comment);
        if (Array.isArray(comment.replies)) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === targetId ? updater(reply) : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  const handleCommentReaction = async (commentId: string, reactionType = "LIKE") => {
    if (!currentUser?.id) return;
    setCommentReactionsLoading((prev) => ({ ...prev, [commentId]: true }));
    try {
      const response = await CommentLikeService.reactToComment(commentId, reactionType as any);
      if (response?.status === 200) {
        updateCommentTree(commentId, (comment) => ({
          ...comment,
          likeCount: response.data?.total ?? comment.likeCount,
          reactions: response.data?.counts,
          isLikedByCurrentUser: true,
          userReaction: reactionType,
        }));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to react to comment.");
    } finally {
      setCommentReactionsLoading((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleRemoveCommentReaction = async (commentId: string) => {
    if (!currentUser?.id) return;
    setCommentReactionsLoading((prev) => ({ ...prev, [commentId]: true }));
    try {
      const response = await CommentLikeService.removeReaction(commentId);
      if (response?.status === 200) {
        updateCommentTree(commentId, (comment) => ({
          ...comment,
          likeCount: response.data?.total ?? comment.likeCount,
          reactions: response.data?.counts,
          isLikedByCurrentUser: false,
          userReaction: null,
        }));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to remove reaction.");
    } finally {
      setCommentReactionsLoading((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleShare = async () => {
    if (!post?.id) return;
    try {
      await Share.share({
        title: `${post.ownerName || "CuttyPaws"}'s post`,
        message: `${post.caption || "Check out this pet post on CuttyPaws"}\nhttps://cuttypaws.app/post/${post.id}`,
      });
      setShareMessage("Post shared");
    } catch {
      setError("Failed to share post.");
    }
  };

  const formattedCaption =
    post?.caption && post.caption.length > CAPTION_LIMIT && !showMoreCaption
      ? `${post.caption.slice(0, CAPTION_LIMIT)}...`
      : post?.caption || "";

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!mediaWidth) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / mediaWidth);
    if (nextIndex !== selectedMediaIndex) {
      setSelectedMediaIndex(nextIndex);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardAlt,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.08,
          elevation: isDark ? 0 : 2,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.borderSoft }]}>
        <Pressable style={styles.ownerRow} onPress={handleOwnerPress}>
          {post?.ownerProfileImage ? (
            <Image source={{ uri: post.ownerProfileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.accentSoft }]}>
              <MaterialCommunityIcons name="paw" size={18} color={colors.success} />
            </View>
          )}

          <View style={styles.ownerTextWrap}>
            <Text style={[styles.ownerName, { color: colors.text }]}>
              {post?.ownerName || "Unknown user"}
            </Text>
            <Text style={[styles.ownerMeta, { color: colors.textMuted }]}>{ownerDisplayLabel}</Text>
            <Text style={[styles.ownerMeta, { color: colors.textMuted }]}>
              {formatDate(post?.createdAt)}
            </Text>
          </View>
        </Pressable>

        {isOwner ? (
          <View style={styles.ownerActions}>
            <Pressable style={styles.miniAction} onPress={() => post?.id && onEdit?.(post.id)}>
              <Feather name="edit-2" size={16} color="#334155" />
            </Pressable>
            <Pressable style={styles.miniAction} onPress={() => post?.id && onDelete?.(post.id)}>
              <Feather name="trash-2" size={16} color="#B91C1C" />
            </Pressable>
          </View>
        ) : null}
      </View>

      {mediaItems.length > 0 ? (
        <View style={styles.mediaSection}>
          <View
            style={styles.primaryMediaWrap}
            onLayout={(event) => setMediaWidth(event.nativeEvent.layout.width)}
          >
            {isImageCarousel ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleCarouselScroll}
                  scrollEventThrottle={16}
                >
                  {mediaItems.map((item, index) => (
                    <View
                      key={`${item.url || item.streamUrl}-${index}`}
                      style={[styles.carouselPage, mediaWidth ? { width: mediaWidth } : null]}
                    >
                      <RenderMedia item={item} isActive={isActive} />
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.carouselDots}>
                  {mediaItems.map((item, index) => (
                    <View
                      key={`${item.url || item.streamUrl}-dot-${index}`}
                      style={[
                        styles.carouselDot,
                        index === selectedMediaIndex && styles.carouselDotActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <RenderMedia item={mediaItems[selectedMediaIndex]} isActive={isActive} />
            )}
          </View>

          {!isImageCarousel && mediaItems.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaThumbRow}
            >
              {mediaItems.map((item, index) => (
                <Pressable
                  key={`${item.url || item.streamUrl}-${index}`}
                  style={[
                    styles.thumbCard,
                    selectedMediaIndex === index && styles.thumbCardActive,
                  ]}
                  onPress={() => setSelectedMediaIndex(index)}
                >
                  <RenderMedia item={item} compact />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.actionRow}>
          <View style={styles.leftActions}>
            <ReactionsPicker
              currentReaction={userReaction as any}
              onReactionSelect={handleReaction as any}
              onRemoveReaction={handleRemoveReaction}
              size={24}
              disabled={reactionLoading}
            />

            <Pressable style={styles.iconAction} onPress={toggleComments}>
              <MessageSquareHeart size={24} strokeWidth={2} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.iconAction} onPress={handleShare}>
              <Send size={24} strokeWidth={2} color={colors.textMuted} />
            </Pressable>
          </View>

          <Pressable style={styles.iconAction} onPress={() => setIsBookmarked((prev) => !prev)}>
            <Bookmark
              size={24}
              strokeWidth={2}
              color={isBookmarked ? colors.accent : colors.textMuted}
              fill={isBookmarked ? colors.accent : "none"}
            />
          </Pressable>
        </View>

        <View style={styles.statRow}>
          <Text style={[styles.statText, { color: colors.text }]}>
            {formatCount(totalReactions)} reactions
          </Text>
          <Pressable onPress={toggleComments}>
            <Text style={[styles.statText, { color: colors.text }]}>
              {formatCount(totalComments)} comments
            </Text>
          </Pressable>
        </View>

        {totalReactions > 0 ? (
          <View style={styles.reactionSummary}>
            {Object.entries(reactionsCount)
              .filter(([, count]) => Number(count) > 0)
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .slice(0, 3)
              .map(([type]) => (
                <View key={type} style={styles.reactionBubble}>
                  {renderReactionIcon(type)}
                </View>
              ))}
          </View>
        ) : null}

        {shareMessage ? (
          <Text style={[styles.shareFeedback, { color: colors.textMuted }]}>{shareMessage}</Text>
        ) : null}

        {post?.caption ? (
          <View style={styles.captionWrap}>
            <Text style={[styles.captionOwner, { color: colors.text }]}>
              {post.ownerName || "Unknown"}
            </Text>
            <Text style={[styles.captionText, { color: colors.textMuted }]}>{formattedCaption}</Text>
            {post.caption.length > CAPTION_LIMIT ? (
              <Pressable onPress={() => setShowMoreCaption((prev) => !prev)}>
                <Text style={[styles.captionToggle, { color: colors.accent }]}>
                  {showMoreCaption ? "less" : "more"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {currentUser?.id ? (
          <View style={styles.commentComposer}>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.backgroundElevated,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSoft}
              value={newComment}
              onChangeText={setNewComment}
              editable={!commentLoading}
            />
            <Pressable
              style={[
                styles.commentSubmit,
                (!newComment.trim() || commentLoading) && styles.disabledButton,
              ]}
              onPress={submitComment}
              disabled={!newComment.trim() || commentLoading}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="send" size={16} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[
              styles.loginPrompt,
              { borderColor: colors.border, backgroundColor: colors.backgroundElevated },
            ]}
          >
            <Feather name="log-in" size={16} color={colors.success} />
            <Text style={[styles.loginPromptText, { color: colors.success }]}>
              Login to comment
            </Text>
          </Pressable>
        )}

        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

        {showComments ? (
          <View style={styles.commentsBlock}>
            {commentsLoading ? (
              <View style={styles.commentsLoader}>
                <ActivityIndicator size="small" color="#0F766E" />
              </View>
            ) : comments.length === 0 ? (
              <Text style={styles.emptyComments}>No comments yet. Be the first to comment.</Text>
            ) : (
              comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  currentUser={currentUser}
                  isOwner={isOwner}
                  isReplying={replyingTo === comment.id}
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onToggleReply={() =>
                    setReplyingTo((prev) => (prev === comment.id ? null : comment.id))
                  }
                  onSubmitReply={() => submitReply(comment.id)}
                  onDelete={() => removeComment(comment.id)}
                  onLike={() =>
                    comment.isLikedByCurrentUser
                      ? handleRemoveCommentReaction(comment.id)
                      : handleCommentReaction(comment.id)
                  }
                  loading={Boolean(commentReactionsLoading[comment.id])}
                  onLikeReply={(reply) =>
                    reply.isLikedByCurrentUser
                      ? handleRemoveCommentReaction(reply.id)
                      : handleCommentReaction(reply.id)
                  }
                  replyLoadingMap={commentReactionsLoading}
                />
              ))
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RenderMedia({
  item,
  compact = false,
  isActive = false,
}: {
  item: { url?: string | null; streamUrl?: string | null; type?: string; thumbnailUrl?: string | null };
  compact?: boolean;
  isActive?: boolean;
}) {
  const isVideo = String(item?.type || "").toUpperCase() === "VIDEO";
  const uri = item?.streamUrl || item?.url || "";

  if (isVideo) {
    return (
      <View style={[styles.videoWrap, compact && styles.videoWrapCompact]}>
        <AppVideo
          uri={uri}
          style={compact ? styles.mediaThumb : styles.mediaHero}
          contentFit="cover"
          nativeControls={!compact}
          shouldPlay={!compact && isActive}
          isMuted={compact}
          isLooping
          posterUri={item?.thumbnailUrl || null}
        />
        {compact ? (
          <View style={styles.videoChip}>
            <Feather name="play" size={12} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
    );
  }

  return <Image source={{ uri }} style={compact ? styles.mediaThumb : styles.mediaHero} />;
}

function CommentThread({
  comment,
  currentUser,
  isOwner,
  isReplying,
  replyText,
  onReplyTextChange,
  onToggleReply,
  onSubmitReply,
  onDelete,
  onLike,
  loading,
  onLikeReply,
  replyLoadingMap,
}: {
  comment: PostComment;
  currentUser?: CurrentUser | null;
  isOwner: boolean;
  isReplying: boolean;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onToggleReply: () => void;
  onSubmitReply: () => void;
  onDelete: () => void;
  onLike: () => void;
  loading: boolean;
  onLikeReply: (reply: PostComment) => void;
  replyLoadingMap: Record<string, boolean>;
}) {
  return (
    <View style={styles.commentItem}>
      <View style={styles.commentRow}>
        {comment.userProfileImage ? (
          <Image source={{ uri: comment.userProfileImage }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarFallback}>
            <MaterialCommunityIcons name="paw" size={13} color="#0F766E" />
          </View>
        )}

        <View style={styles.commentContent}>
          <Text style={styles.commentAuthor}>{comment.userName || "User"}</Text>
          <Text style={styles.commentText}>{comment.content}</Text>

          <View style={styles.commentMetaRow}>
            <Text style={styles.commentMeta}>{formatDate(comment.createdAt)}</Text>
            <Pressable style={styles.commentMetaButton} onPress={onLike} disabled={loading}>
              <Feather
                name={comment.isLikedByCurrentUser ? "heart" : "heart"}
                size={13}
                color={comment.isLikedByCurrentUser ? "#E11D48" : "#64748B"}
              />
              <Text style={styles.commentMetaButtonText}>{comment.likeCount || 0}</Text>
            </Pressable>
            <Pressable style={styles.commentMetaButton} onPress={onToggleReply}>
              <Text style={styles.commentMetaButtonText}>Reply</Text>
            </Pressable>
            {(currentUser?.id === comment.userId || isOwner) ? (
              <Pressable style={styles.commentMetaButton} onPress={onDelete}>
                <Text style={[styles.commentMetaButtonText, styles.deleteText]}>Delete</Text>
              </Pressable>
            ) : null}
          </View>

          {isReplying ? (
            <View style={styles.replyComposer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply..."
                value={replyText}
                onChangeText={onReplyTextChange}
              />
              <Pressable
                style={[styles.replySubmit, !replyText.trim() && styles.disabledButton]}
                onPress={onSubmitReply}
                disabled={!replyText.trim()}
              >
                <Feather name="send" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}

          {Array.isArray(comment.replies) && comment.replies.length > 0 ? (
            <View style={styles.repliesWrap}>
              {comment.replies.map((reply) => (
                <View key={reply.id} style={styles.replyItem}>
                  {reply.userProfileImage ? (
                    <Image source={{ uri: reply.userProfileImage }} style={styles.replyAvatar} />
                  ) : (
                    <View style={styles.replyAvatarFallback}>
                      <MaterialCommunityIcons name="paw" size={11} color="#0F766E" />
                    </View>
                  )}
                  <View style={styles.replyContent}>
                    <Text style={styles.replyAuthor}>{reply.userName || "User"}</Text>
                    <Text style={styles.replyText}>{reply.content}</Text>
                    <View style={styles.commentMetaRow}>
                      <Text style={styles.commentMeta}>{formatDate(reply.createdAt)}</Text>
                      <Pressable
                        style={styles.commentMetaButton}
                        onPress={() => onLikeReply(reply)}
                        disabled={Boolean(replyLoadingMap[reply.id])}
                      >
                        <Feather
                          name="heart"
                          size={12}
                          color={reply.isLikedByCurrentUser ? "#E11D48" : "#64748B"}
                        />
                        <Text style={styles.commentMetaButtonText}>{reply.likeCount || 0}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return "Unknown time";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return date.toLocaleDateString();
  } catch {
    return "Unknown time";
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function renderReactionIcon(type: string) {
  const color = getReactionColor(type);

  switch (type) {
    case "COOKIE":
      return <Cookie size={14} strokeWidth={2.2} color={color} fill={color} />;
    case "BONE":
      return <Bone size={14} strokeWidth={2.2} color={color} fill={color} />;
    case "HEART":
      return <Heart size={14} strokeWidth={2.2} color={color} fill={color} />;
    case "PAWPRINT":
    default:
      return <PawPrint size={14} strokeWidth={2.2} color={color} fill={color} />;
  }
}

function getReactionColor(type: string) {
  const map: Record<string, string> = {
    PAWPRINT: "#F97316",
    COOKIE: "#D97706",
    BONE: "#0F766E",
    HEART: "#E11D48",
  };
  return map[type] || "#F97316";
}

function buildServiceLabel(profile: any) {
  if (!profile) return "Pet owner";
  const type = String(profile?.serviceType || "SERVICE_PROVIDER")
    .split("_")
    .map((part: string) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ");
  return location ? `${type} • ${location}` : type;
}

function buildPetOwnerLabel(post: PostData) {
  return "Pet owner";
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  ownerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E2E8F0",
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  ownerTextWrap: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  ownerMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },
  ownerActions: {
    flexDirection: "row",
    gap: 8,
  },
  miniAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  mediaSection: {
    gap: 10,
  },
  primaryMediaWrap: {
    width: "100%",
    height: 360,
    backgroundColor: "#E2E8F0",
  },
  mediaHero: {
    width: "100%",
    height: "100%",
  },
  carouselPage: {
    height: "100%",
  },
  carouselDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: "#FFFFFF",
  },
  mediaThumbRow: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 4,
  },
  thumbCard: {
    overflow: "hidden",
    width: 72,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbCardActive: {
    borderColor: "#0F766E",
  },
  mediaThumb: {
    width: "100%",
    height: "100%",
  },
  videoWrap: {
    flex: 1,
  },
  videoWrapCompact: {
    borderRadius: 16,
    overflow: "hidden",
  },
  videoChip: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  statRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  reactionSummary: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  reactionBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  shareFeedback: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#0F766E",
  },
  captionWrap: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  captionOwner: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  captionText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#334155",
  },
  captionToggle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
  },
  commentComposer: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#0F172A",
  },
  commentSubmit: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  disabledButton: {
    opacity: 0.45,
  },
  loginPrompt: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#ECFEFF",
  },
  loginPromptText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: "#B91C1C",
  },
  commentsBlock: {
    marginTop: 14,
    gap: 12,
  },
  commentsLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyComments: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 10,
  },
  commentItem: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#F8FAFC",
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2E8F0",
  },
  commentAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  commentText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
  },
  commentMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  commentMeta: {
    fontSize: 11,
    color: "#94A3B8",
  },
  commentMetaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentMetaButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  deleteText: {
    color: "#B91C1C",
  },
  replyComposer: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  replyInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  replySubmit: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  repliesWrap: {
    marginTop: 12,
    gap: 10,
  },
  replyItem: {
    flexDirection: "row",
    gap: 8,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  replyAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  replyText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
  },
});
