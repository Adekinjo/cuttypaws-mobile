import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Review = Record<string, any>;

type Props = {
  reviews?: Review[];
  loading?: boolean;
  error?: string;
};

function formatDateTime(value?: string) {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewStars({ rating }: { rating?: number }) {
  const value = Number(rating || 0);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Feather
          key={index}
          name="star"
          size={14}
          color={index <= value ? "#D97706" : "#CBD5E1"}
        />
      ))}
    </View>
  );
}

export default function ReviewList({ reviews = [], loading = false, error = "" }: Props) {
  if (loading) {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="small" color="#1D4ED8" />
        <Text style={styles.centerText}>Loading reviews...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorCard}>
        <Feather name="alert-triangle" size={17} color="#B91C1C" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!reviews.length) {
    return (
      <View style={styles.centerCard}>
        <View style={styles.emptyIcon}>
          <Feather name="message-circle" size={20} color="#1D4ED8" />
        </View>
        <Text style={styles.emptyTitle}>No reviews yet</Text>
        <Text style={styles.emptyBody}>
          Once customers share feedback, their reviews will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{reviews.length}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {reviews.map((review, index) => (
          <View
            key={review.id || `${review.reviewerName || "review"}-${index}`}
            style={[styles.reviewItem, index === reviews.length - 1 && styles.lastReviewItem]}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.identityBlock}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>
                    {String(review.reviewerName || "R").trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.identityCopy}>
                  <Text style={styles.reviewerName}>{review.reviewerName || "Anonymous"}</Text>
                  <Text style={styles.reviewDate}>
                    {formatDateTime(review.updatedAt || review.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.ratingPill}>
                <ReviewStars rating={review.rating} />
                <Text style={styles.ratingPillText}>{Number(review.rating || 0).toFixed(1)}</Text>
              </View>
            </View>

            {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: "#0F172A",
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  list: {
    paddingHorizontal: 18,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  lastReviewItem: {
    borderBottomWidth: 0,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  identityBlock: {
    flexDirection: "row",
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  identityCopy: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  reviewDate: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
  },
  ratingPill: {
    alignItems: "flex-end",
    gap: 6,
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#9A3412",
  },
  comment: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  centerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
  },
  centerText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
    fontWeight: "600",
  },
});
