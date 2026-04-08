import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PostService from "../../api/PostService";
import AppVideo from "../common/AppVideo";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

type ExistingMedia = {
  id: string;
  uri: string;
  type: string;
};

type NewMedia = {
  id: string;
  file: ReactNativeFile;
  uri: string;
  type: string;
};

type PostRecord = {
  _id?: string;
  id?: string;
  caption?: string;
  images?: any[];
  media?: any[];
};

const MAX_MEDIA = 10;
const MAX_CAPTION = 500;
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024;

export default function EditPostPage({
  postId,
  onNavigate,
}: {
  postId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [loadingPost, setLoadingPost] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [caption, setCaption] = useState("");
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [newMedia, setNewMedia] = useState<NewMedia[]>([]);

  const activeExistingCount = useMemo(
    () => existingMedia.filter((item) => !mediaToDelete.includes(item.id)).length,
    [existingMedia, mediaToDelete]
  );
  const mediaCount = activeExistingCount + newMedia.length;
  const canSubmit = caption.trim().length > 0 && mediaCount > 0 && !submitting;

  useEffect(() => {
    let active = true;

    const loadPost = async () => {
      if (!postId) {
        setError("No post ID was provided.");
        setLoadingPost(false);
        return;
      }

      try {
        setLoadingPost(true);
        setError("");
        const response = await PostService.getPostById(postId);
        const post = normalizePost(response);

        if (!active) return;

        setCaption(post?.caption || "");
        setExistingMedia(extractExistingMedia(post));
      } catch (loadError: any) {
        if (!active) return;
        setError(loadError?.message || "Failed to load this post.");
      } finally {
        if (active) {
          setLoadingPost(false);
        }
      }
    };

    loadPost();

    return () => {
      active = false;
    };
  }, [postId]);

  const handlePickMedia = async () => {
    setError("");

    if (mediaCount >= MAX_MEDIA) {
      setError(`You can keep up to ${MAX_MEDIA} media files on a post.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Media library permission is required to edit post media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - mediaCount,
      quality: 0.9,
      videoMaxDuration: 60,
    });

    if (result.canceled) return;

    const nextItems = result.assets
      .map((asset, index) => ({
        id: `new-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        uri: asset.uri,
        type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        name:
          asset.fileName ||
          `post-media-${Date.now()}-${index}.${asset.type === "video" ? "mp4" : "jpg"}`,
        size: asset.fileSize || 0,
      }))
      .filter((item) => {
        if (!item.type.startsWith("image/") && !item.type.startsWith("video/")) {
          setError("Only image and video files are supported.");
          return false;
        }

        if (item.type.startsWith("image/") && item.size > MAX_IMAGE_FILE_SIZE) {
          setError("Image size must be 10MB or less.");
          return false;
        }

        if (item.type.startsWith("video/") && item.size > MAX_VIDEO_FILE_SIZE) {
          setError("Video size must be 100MB or less.");
          return false;
        }

        return true;
      })
      .slice(0, MAX_MEDIA - mediaCount)
      .map(
        (item): NewMedia => ({
          id: item.id,
          uri: item.uri,
          type: item.type,
          file: {
            uri: item.uri,
            name: item.name,
            type: item.type,
          },
        })
      );

    if (nextItems.length) {
      setNewMedia((prev) => [...prev, ...nextItems].slice(0, MAX_MEDIA));
    }
  };

  const toggleExistingMedia = (mediaId: string) => {
    setMediaToDelete((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
  };

  const removeNewMedia = (mediaId: string) => {
    setNewMedia((prev) => prev.filter((item) => item.id !== mediaId));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!caption.trim()) {
      setError("Caption is required.");
      return;
    }

    if (caption.trim().length > MAX_CAPTION) {
      setError(`Caption must be ${MAX_CAPTION} characters or less.`);
      return;
    }

    if (mediaCount === 0) {
      setError("Keep at least one image or video on the post.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await PostService.updatePost(postId, {
        caption: caption.trim(),
        media: newMedia.map((item) => item.file),
        mediaToDelete,
      });

      if (response?.status === 200 || response?.success || response?.post) {
        setSuccess("Post updated successfully.");
        setExistingMedia((prev) => prev.filter((item) => !mediaToDelete.includes(item.id)));
        setMediaToDelete([]);
        setNewMedia([]);

        setTimeout(() => {
          onNavigate?.("customer-profile");
        }, 1400);
      } else {
        setError(response?.message || "Failed to update post.");
      }
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to update post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPost) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingTitle}>Loading post</Text>
          <Text style={styles.loadingText}>Preparing your caption and media for editing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.topRow}>
            <Pressable style={styles.iconButton} onPress={() => onNavigate?.("back")}>
              <Feather name="arrow-left" size={18} color="#E2E8F0" />
            </Pressable>

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="pencil-box-outline" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Edit post</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Refine the story before it goes further.</Text>
          <Text style={styles.heroSubtitle}>
            Update the caption, swap media, and keep the post sharp without losing its momentum.
          </Text>

          <View style={styles.heroStatsRow}>
            <StatPill label="Caption" value={`${caption.length}/${MAX_CAPTION}`} />
            <StatPill label="Media" value={`${mediaCount}/${MAX_MEDIA}`} />
            <StatPill label="Pending removals" value={`${mediaToDelete.length}`} />
          </View>
        </View>

        {error ? (
          <View style={[styles.messageBanner, styles.messageBannerError]}>
            <Feather name="alert-circle" size={16} color="#991B1B" />
            <Text style={[styles.messageText, styles.messageTextError]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.messageBanner, styles.messageBannerSuccess]}>
            <Feather name="check-circle" size={16} color="#065F46" />
            <Text style={[styles.messageText, styles.messageTextSuccess]}>{success}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Caption</Text>
          <Text style={styles.sectionSubtitle}>
            Tighten the wording or rewrite the context completely. Keep it clear and readable.
          </Text>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="What's on your mind?"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={MAX_CAPTION}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>{caption.length}/{MAX_CAPTION} characters</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTextWrap}>
              <Text style={styles.sectionTitle}>Current media</Text>
              <Text style={styles.sectionSubtitle}>
                Tap any item to remove it from the updated post. Tap again to keep it.
              </Text>
            </View>
            <Pressable
              style={[styles.uploadAction, mediaCount >= MAX_MEDIA && styles.uploadActionDisabled]}
              onPress={handlePickMedia}
              disabled={mediaCount >= MAX_MEDIA}
            >
              <Feather name="camera" size={18} color={mediaCount >= MAX_MEDIA ? "#94A3B8" : "#0F766E"} />
            </Pressable>
          </View>

          {existingMedia.length ? (
            <View style={styles.mediaGrid}>
              {existingMedia.map((item, index) => {
                const markedForDelete = mediaToDelete.includes(item.id);
                return (
                  <View key={`${item.id}-${index}`} style={styles.mediaCard}>
                    <MediaThumbnail uri={item.uri} type={item.type} style={styles.mediaPreview} />

                    <View
                      style={[
                        styles.mediaOverlay,
                        markedForDelete ? styles.mediaOverlayDanger : styles.mediaOverlayNeutral,
                      ]}
                    >
                      <Text
                        style={[
                          styles.mediaOverlayText,
                          markedForDelete && styles.mediaOverlayTextDanger,
                        ]}
                      >
                        {markedForDelete ? "Removed" : "Current"}
                      </Text>
                    </View>

                    <Pressable
                      style={[
                        styles.removeMediaButton,
                        markedForDelete && styles.restoreMediaButton,
                      ]}
                      onPress={() => toggleExistingMedia(item.id)}
                    >
                      <Feather
                        name={markedForDelete ? "rotate-ccw" : "x"}
                        size={14}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <Feather name="image" size={28} color="#64748B" />
              <Text style={styles.emptyStateTitle}>No current media found</Text>
              <Text style={styles.emptyStateText}>
                Add new images or videos below to rebuild this post visually.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>New media</Text>
          <Text style={styles.sectionSubtitle}>
            Add fresh images or videos. Images up to 10MB, videos up to 100MB are supported.
          </Text>

          {newMedia.length ? (
            <View style={styles.mediaGrid}>
              {newMedia.map((item) => (
                <View key={item.id} style={styles.mediaCard}>
                  <MediaThumbnail uri={item.uri} type={item.type} style={styles.mediaPreview} />
                  <View style={[styles.mediaOverlay, styles.mediaOverlaySuccess]}>
                    <Text style={[styles.mediaOverlayText, styles.mediaOverlayTextSuccess]}>New</Text>
                  </View>
                  <Pressable style={styles.removeMediaButton} onPress={() => removeNewMedia(item.id)}>
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {mediaCount < MAX_MEDIA ? (
            <Pressable style={styles.uploadBox} onPress={handlePickMedia}>
              <View style={styles.uploadIconWrap}>
                <Feather name="upload-cloud" size={22} color="#0F766E" />
              </View>
              <Text style={styles.uploadTitle}>Add photos or videos</Text>
              <Text style={styles.uploadText}>
                {MAX_MEDIA - mediaCount} slot{MAX_MEDIA - mediaCount === 1 ? "" : "s"} remaining.
                Select multiple files at once.
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#92400E" />
          <View style={styles.noteTextWrap}>
            <Text style={styles.noteTitle}>Editing guidance</Text>
            <Text style={styles.noteText}>
              Keep the strongest visual first, avoid repeating angles, and trim the caption if the
              story is already obvious from the media.
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.secondaryButton, submitting && styles.buttonDisabled]}
            onPress={() => onNavigate?.("back")}
            disabled={submitting}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, (!canSubmit || submitting) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="save" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Update Post</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizePost(response: any): PostRecord | null {
  if (!response) return null;
  if (response?.post) return response.post;
  if (response?.data && !Array.isArray(response.data)) return response.data;
  return response;
}

function extractExistingMedia(post: PostRecord | null): ExistingMedia[] {
  const media = post?.media || post?.images || [];
  if (!Array.isArray(media)) return [];

  return media
    .map((item: any, index) => {
      const id = item?._id || item?.id || item?.public_id || `media-${index}`;
      const uri =
        item?.imageUrl ||
        item?.url ||
        item?.path ||
        item?.secure_url ||
        item?.mediaUrl ||
        item?.thumbnailUrl ||
        "";
      const type =
        item?.type ||
        item?.mimeType ||
        (typeof uri === "string" && /\.(mp4|mov|webm|m4v)$/i.test(uri) ? "video/mp4" : "image/jpeg");

      if (!uri) return null;

      return { id, uri, type };
    })
    .filter(Boolean) as ExistingMedia[];
}

function MediaThumbnail({
  uri,
  type,
  style,
}: {
  uri: string;
  type: string;
  style?: any;
}) {
  if (type.startsWith("video/")) {
    return (
      <View>
        <AppVideo
          uri={uri}
          style={style}
          contentFit="cover"
          shouldPlay={false}
          isLooping={false}
          nativeControls={false}
        />
        <View style={styles.videoBadge}>
          <Feather name="play" size={12} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return <Image source={{ uri }} style={style} />;
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
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.24)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -70,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(250, 204, 21, 0.18)",
  },
  topRow: {
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
    lineHeight: 33,
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
  messageBannerSuccess: {
    backgroundColor: "#D1FAE5",
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
  messageTextSuccess: {
    color: "#065F46",
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionHeaderTextWrap: {
    flex: 1,
  },
  captionInput: {
    minHeight: 140,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EF",
    fontSize: 15,
    lineHeight: 22,
    color: "#0F172A",
  },
  helperText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  uploadAction: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  uploadActionDisabled: {
    backgroundColor: "#E2E8F0",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mediaCard: {
    position: "relative",
    width: "47%",
  },
  mediaPreview: {
    width: "100%",
    height: 168,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  mediaOverlay: {
    position: "absolute",
    left: 10,
    bottom: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mediaOverlayNeutral: {
    backgroundColor: "rgba(15, 23, 42, 0.7)",
  },
  mediaOverlayDanger: {
    backgroundColor: "rgba(127, 29, 29, 0.82)",
  },
  mediaOverlaySuccess: {
    backgroundColor: "rgba(6, 95, 70, 0.88)",
  },
  mediaOverlayText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F8FAFC",
    textTransform: "uppercase",
  },
  mediaOverlayTextDanger: {
    color: "#FECACA",
  },
  mediaOverlayTextSuccess: {
    color: "#D1FAE5",
  },
  removeMediaButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(185, 28, 28, 0.95)",
  },
  restoreMediaButton: {
    backgroundColor: "rgba(5, 150, 105, 0.95)",
  },
  videoBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.78)",
  },
  emptyStateCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: "#F8FAFC",
  },
  emptyStateTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#64748B",
  },
  uploadBox: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#5EEAD4",
    paddingHorizontal: 18,
    paddingVertical: 24,
    backgroundColor: "#F0FDFA",
  },
  uploadIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  uploadTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "800",
    color: "#134E4A",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#0F766E",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  noteTextWrap: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#78350F",
  },
  noteText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#92400E",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
  },
  primaryButton: {
    flex: 1.3,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
