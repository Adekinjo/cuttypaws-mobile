import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  onSubmit?: (payload: { rating: number; comment: string }) => void | Promise<void>;
  submitting?: boolean;
  disabled?: boolean;
};

export default function ReviewForm({
  onSubmit,
  submitting = false,
  disabled = false,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (disabled) {
      setError("Please sign in to leave a review.");
      return;
    }

    setError("");
    await onSubmit?.({ rating: Number(rating), comment: comment.trim() });
    setComment("");
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Write a review</Text>
      <Text style={styles.subtitle}>
        Share how the service went so other pet owners can make better decisions.
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={17} color="#B91C1C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= rating;
            return (
              <Pressable
                key={value}
                disabled={submitting}
                onPress={() => setRating(value)}
                style={[styles.starButton, active && styles.starButtonActive]}
              >
                <Feather name="star" size={18} color={active ? "#D97706" : "#94A3B8"} />
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.ratingText}>
          {rating} {rating === 1 ? "star" : "stars"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Comment</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={5}
          value={comment}
          maxLength={2000}
          onChangeText={setComment}
          editable={!submitting}
          placeholder="Describe the experience, what went well, and what others should know."
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{comment.length}/2000</Text>
      </View>

      <Pressable
        style={[styles.submitButton, submitting && styles.disabledButton]}
        disabled={submitting}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? "Submitting..." : "Submit review"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  errorBanner: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
    fontWeight: "600",
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  starButtonActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FCD34D",
  },
  ratingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  textarea: {
    marginTop: 10,
    minHeight: 130,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 21,
    color: "#0F172A",
  },
  counter: {
    marginTop: 8,
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  submitButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.55,
  },
});
