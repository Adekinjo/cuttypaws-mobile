import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import AuthService from "../../api/AuthService";
import LikesService from "../../api/LikesService";

type PostMedia = {
  type?: string;
  url?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
};

type VideoPost = {
  id?: string | number;
  ownerName?: string;
  ownerProfileImage?: string;
  caption?: string;
  media?: PostMedia[];
  totalReactions?: number;
  likeCount?: number;
  commentCount?: number;
  userReaction?: string | null;
  likedByCurrentUser?: boolean;
};

export default function VideoFeedItem({
  post,
  isActive,
  onVisible,
  onOpenComments,
  onNavigate,
}: {
  post: VideoPost;
  isActive?: boolean;
  onVisible?: () => void;
  onOpenComments?: (post: VideoPost) => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [likeCount, setLikeCount] = useState(post?.totalReactions ?? post?.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(post?.commentCount ?? 0);
  const [userReaction, setUserReaction] = useState<string | null>(
    post?.userReaction || (post?.likedByCurrentUser ? "HEART" : null)
  );
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);

  const videoMedia = useMemo(
    () => (Array.isArray(post?.media) ? post.media.find((m) => m?.type === "VIDEO") : null),
    [post?.media]
  );
  const videoSource = videoMedia?.streamUrl || videoMedia?.url || null;
  const player = useVideoPlayer(videoSource ? { uri: videoSource } : null, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    setLikeCount(post?.totalReactions ?? post?.likeCount ?? 0);
    setCommentCount(post?.commentCount ?? 0);
    setUserReaction(post?.userReaction || (post?.likedByCurrentUser ? "HEART" : null));
  }, [post]);

  useEffect(() => {
    setHasRenderedFrame(false);
  }, [videoSource]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    const syncPlayback = async () => {
      if (!videoMedia) return;

      try {
        if (isActive && !isPausedByUser) {
          player.play();
          onVisible?.();
        } else {
          player.pause();
        }
      } catch {
      }
    };

    syncPlayback();
  }, [isActive, onVisible, player, videoMedia, isPausedByUser]);

  const isPaused = !isActive || isPausedByUser;

  const isLiked = Boolean(userReaction);

  const handleLike = async () => {
    if (!post?.id || isLikeLoading) return;

    const authenticated = await AuthService.isAuthenticated();
    if (!authenticated) {
      onNavigate?.("login");
      return;
    }

    const previousReaction = userReaction;
    const previousCount = likeCount;

    try {
      setIsLikeLoading(true);

      if (isLiked) {
        setUserReaction(null);
        setLikeCount((prev) => Math.max(0, prev - 1));
        await LikesService.removeReaction(String(post.id));
      } else {
        setUserReaction(LikesService.ReactionType.HEART);
        setLikeCount((prev) => prev + 1);
        await LikesService.reactToPost(String(post.id), LikesService.ReactionType.HEART);
      }
    } catch {
      setUserReaction(previousReaction);
      setLikeCount(previousCount);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleShare = async () => {
    if (!post?.id) return;

    try {
      await Share.share({
        title: post?.caption || "CuttyPaws video",
        message: `${post?.caption || "Check out this video on CuttyPaws"}\nhttps://cuttypaws.app/post/${post.id}`,
      });
    } catch {
    }
  };

  const togglePlayback = async () => {
    try {
      if (isPausedByUser || !isActive) {
        player.play();
        setIsPausedByUser(false);
      } else {
        player.pause();
        setIsPausedByUser(true);
      }
    } catch {
    }
  };

  const toggleMute = async () => {
    try {
      player.muted = !isMuted;
      setIsMuted((prev) => !prev);
    } catch {
    }
  };

  if (!videoMedia) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.videoFrame}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
          onFirstFrameRender={() => setHasRenderedFrame(true)}
        />
        {videoMedia.thumbnailUrl && !hasRenderedFrame ? (
          <Image source={{ uri: videoMedia.thumbnailUrl }} style={styles.video} resizeMode="cover" />
        ) : null}

        <View style={styles.scrim} />

        <Pressable style={styles.centerControl} onPress={togglePlayback}>
          <View style={styles.centerControlInner}>
            <Feather name={isPaused ? "play" : "pause"} size={22} color="#FFFFFF" />
          </View>
        </Pressable>

        <Pressable style={styles.muteButton} onPress={toggleMute}>
          <Feather name={isMuted ? "volume-x" : "volume-2"} size={16} color="#FFFFFF" />
        </Pressable>

        <View style={styles.ownerStrip}>
          {post?.ownerProfileImage ? (
            <Image source={{ uri: post.ownerProfileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <MaterialCommunityIcons name="paw" size={16} color="#0F766E" />
            </View>
          )}
          <View style={styles.ownerTextWrap}>
            <Text style={styles.ownerName} numberOfLines={1}>
              {post?.ownerName || "CuttyPaws"}
            </Text>
            {post?.caption ? (
              <Text style={styles.caption} numberOfLines={2}>
                {post.caption}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsColumn}>
          <Pressable
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={handleLike}
            disabled={isLikeLoading}
          >
            {isLikeLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.actionLabel}>{likeCount}</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => {
              if (onOpenComments) {
                onOpenComments(post);
                return;
              }
              onNavigate?.("post-details", { postId: post?.id });
            }}
          >
            <MaterialCommunityIcons name="message-processing-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionLabel}>{commentCount}</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Feather name="send" size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Share</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: "#0F172A",
    flex: 1,
  },
  videoFrame: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#020617",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.22)",
  },
  centerControl: {
    position: "absolute",
    top: "42%",
    left: "42%",
  },
  centerControlInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  muteButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.58)",
  },
  ownerStrip: {
    position: "absolute",
    left: 16,
    right: 88,
    bottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E2E8F0",
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    color: "#FFFFFF",
  },
  caption: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#E2E8F0",
  },
  actionsColumn: {
    position: "absolute",
    right: 14,
    bottom: 18,
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    alignItems: "center",
    gap: 6,
  },
  actionButtonActive: {
    transform: [{ scale: 1.02 }],
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
