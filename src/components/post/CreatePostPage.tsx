import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
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

type MediaFile = {
  uri: string;
  name: string;
  type: string;
};

type MediaPreview = {
  file: MediaFile;
  preview: string;
  type: string;
};

const MAX_MEDIA = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function CreatePostPage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [caption, setCaption] = useState("");

  const canSubmit = useMemo(
    () => caption.trim().length > 0 && mediaPreviews.length > 0 && !loading,
    [caption, loading, mediaPreviews.length]
  );

  const handleMediaUpload = async () => {
    setError("");

    if (mediaPreviews.length >= MAX_MEDIA) {
      setError(`You can upload maximum ${MAX_MEDIA} media files per post.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Media library permission is required to upload images or videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - mediaPreviews.length,
      quality: 0.9,
      videoMaxDuration: 60,
    });

    if (result.canceled) return;

    const validFiles = result.assets
      .map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `post-media-${Date.now()}-${index}`,
        type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
        fileSize: asset.fileSize || 0,
      }))
      .filter((file) => {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          setError("Please upload only image or video files.");
          return false;
        }

        if (file.fileSize > MAX_FILE_SIZE) {
          setError("Each file should be 50MB or less.");
          return false;
        }

        return true;
      });

    if (!validFiles.length) return;

    const nextPreviews = validFiles.map((file) => ({
      file: {
        uri: file.uri,
        name: file.name,
        type: file.type,
      },
      preview: file.uri,
      type: file.type,
    }));

    setMediaPreviews((prev) => [...prev, ...nextPreviews].slice(0, MAX_MEDIA));
  };

  const removeMedia = (index: number) => {
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!caption.trim()) {
      setError("Caption is required.");
      setLoading(false);
      return;
    }

    if (!mediaPreviews.length) {
      setError("At least one media file is required.");
      setLoading(false);
      return;
    }

    if (caption.trim().length > 500) {
      setError("Caption must be less than 500 characters.");
      setLoading(false);
      return;
    }

    try {
      const response = await PostService.createPost({
        caption: caption.trim(),
        media: mediaPreviews.map((item) => item.file),
      });

      if (response?.status === 200 || response?.id || response?.post) {
        setSuccess("Post created successfully.");
        setCaption("");
        setMediaPreviews([]);

        setTimeout(() => {
          onNavigate?.("customer-profile");
        }, 1500);
      } else {
        setError(response?.message || "Failed to create post.");
      }
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.topRow}>
            <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
              <Feather name="arrow-left" size={18} color="#DBEAFE" />
            </Pressable>

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="image-text" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>New post</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Create New Post</Text>
          <Text style={styles.heroSubtitle}>
            Share your moments with the community using a strong caption and rich media that tells
            the story clearly.
          </Text>

          <View style={styles.heroStatsRow}>
            <StatPill label="Caption" value={`${caption.length}/500`} />
            <StatPill label="Media" value={`${mediaPreviews.length}/10`} />
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
            Write a short post that captures the moment, context, or update.
          </Text>

          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="What's on your mind?"
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <Text style={styles.helperText}>{caption.length}/500 characters</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Media</Text>
              <Text style={styles.sectionSubtitle}>
                Add up to 10 images or videos. Maximum 50MB each.
              </Text>
            </View>
            <Pressable style={styles.uploadAction} onPress={handleMediaUpload}>
              <Feather name="camera" size={18} color="#0F766E" />
            </Pressable>
          </View>

          {mediaPreviews.length > 0 ? (
            <View style={styles.mediaGrid}>
              {mediaPreviews.map((preview, index) => (
                <View key={`${preview.preview}-${index}`} style={styles.mediaCard}>
                  {preview.type.startsWith("video/") ? (
                    <AppVideo
                      uri={preview.preview}
                      style={styles.mediaPreview}
                      contentFit="cover"
                      shouldPlay={false}
                      isLooping={false}
                      nativeControls={false}
                    />
                  ) : (
                    <Image source={{ uri: preview.preview }} style={styles.mediaPreview} />
                  )}

                  <Pressable
                    style={styles.removeMediaButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Pressable style={styles.emptyUploadBox} onPress={handleMediaUpload}>
              <Feather name="camera" size={30} color="#64748B" />
              <Text style={styles.emptyUploadTitle}>Upload media</Text>
              <Text style={styles.emptyUploadText}>
                Tap to browse for images or videos.
              </Text>
            </Pressable>
          )}

          {mediaPreviews.length > 0 && mediaPreviews.length < 10 ? (
            <Pressable style={styles.addMoreButton} onPress={handleMediaUpload}>
              <Text style={styles.addMoreButtonText}>Add More Media</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Tips for great posts</Text>
          <Text style={styles.tipText}>Use clear photos or short videos with good lighting.</Text>
          <Text style={styles.tipText}>Write captions that tell a story instead of just labeling the moment.</Text>
          <Text style={styles.tipText}>Show your pet’s personality, activity, or daily routine.</Text>
          <Text style={styles.tipText}>Keep it real and post moments that feel authentic.</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => onNavigate?.("back")}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.primaryButton, (!canSubmit || loading) && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Creating..." : "Create Post"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#F5FAF8",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    gap: 16,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -28,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(45,212,191,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -42,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.14)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#CCFBF1",
  },
  heroBadgeText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    lineHeight: 22,
    fontSize: 15,
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statPill: {
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  statLabel: {
    color: "#99F6E4",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageBannerError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  messageBannerSuccess: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  messageText: {
    flex: 1,
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
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#64748B",
    lineHeight: 20,
  },
  captionInput: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    color: "#102A43",
  },
  helperText: {
    color: "#64748B",
    fontSize: 12,
  },
  uploadAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mediaCard: {
    width: "47%",
    position: "relative",
  },
  mediaPreview: {
    width: "100%",
    height: 140,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  removeMediaButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  emptyUploadBox: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    paddingVertical: 32,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
  },
  emptyUploadTitle: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyUploadText: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  addMoreButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  addMoreButtonText: {
    color: "#0F766E",
    fontWeight: "800",
  },
  tipsCard: {
    borderRadius: 24,
    padding: 18,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  tipText: {
    color: "#486581",
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: "#0F766E",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  secondaryButtonText: {
    color: "#102A43",
    fontWeight: "900",
  },
});
