import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AuthService from "../../api/AuthService";
import PostService from "../../api/PostService";
import PostCard from "./PostCard";

type CurrentUser = {
  id?: string | number | null;
  name?: string;
  email?: string;
};

export default function PostDetailsPage({
  postId,
  onNavigate,
}: {
  postId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [post, setPost] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const loadPost = useCallback(async () => {
    try {
      setError("");
      const [postResponse, storedUser] = await Promise.all([
        PostService.getPostById(postId),
        AuthService.getStoredUser(),
      ]);

      const resolvedPost =
        postResponse?.post || postResponse?.data?.post || postResponse?.data || postResponse;

      if (!resolvedPost?.id) {
        throw new Error("Post not found.");
      }

      setPost(resolvedPost);
      setCurrentUser(storedUser || null);
    } catch (loadError: any) {
      console.error("[PostDetailsPage] load failed", loadError);
      setError(loadError?.message || "Unable to load this post right now.");
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    loadPost();
  }, [loadPost]);

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.centerTitle}>Loading post...</Text>
        <Text style={styles.centerCopy}>Pulling in comments, media, and reactions.</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerState}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={22} color="#991B1B" />
        </View>
        <Text style={styles.centerTitle}>Post unavailable</Text>
        <Text style={styles.centerCopy}>{error || "This post could not be found."}</Text>
        <Pressable style={styles.primaryButton} onPress={() => onNavigate?.("home")}>
          <Text style={styles.primaryButtonText}>Back Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable style={styles.headerButton} onPress={() => onNavigate?.("home")}>
          <Feather name="arrow-left" size={18} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle}>Post details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <PostCard
        post={post}
        currentUser={currentUser}
        isOwner={Boolean(currentUser?.id && String(currentUser.id) === String(post?.ownerId))}
        onDelete={() => onNavigate?.("profile")}
        onEdit={(id) => onNavigate?.("edit-post", { postId: id })}
        onNavigate={onNavigate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#F8FAFC",
  },
  centerTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  centerCopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
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
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#0F766E",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSpacer: {
    width: 40,
  },
  banner: {
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
});
