import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  profile?: Record<string, any> | null;
};

function getInsight(profile?: Record<string, any> | null) {
  const rating = Number(profile?.averageRating || 0);
  const reviews = Number(profile?.reviewCount || 0);

  if (!reviews) {
    return {
      title: "Your profile needs social proof",
      body: "Ask your first customers to leave reviews so new pet owners can trust your business faster.",
      metric: "0 reviews",
    };
  }

  if (rating < 4) {
    return {
      title: "Your profile is performing below average",
      body: "Refresh your description, update pricing details, and encourage more recent reviews to improve conversion.",
      metric: `${rating.toFixed(1)} average rating`,
    };
  }

  return {
    title: "Your profile is in good shape",
    body: "Keep your public profile fresh and consider running adverts to increase local reach.",
    metric: `${reviews} reviews collected`,
  };
}

export default function PerformanceInsightsCard({ profile }: Props) {
  const insight = getInsight(profile);

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>Performance Insights</Text>
          <Text style={styles.body}>
            A lightweight snapshot of how your service profile is doing.
          </Text>
        </View>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="target" size={20} color="#D97706" />
        </View>
      </View>

      <View style={styles.miniChart}>
        <View style={[styles.bar, styles.shortBar]} />
        <View style={[styles.bar, styles.mediumBar]} />
        <View style={[styles.bar, styles.tallBar]} />
        <View style={[styles.bar, styles.mediumBar]} />
        <View style={[styles.bar, styles.shortBar]} />
      </View>

      <Text style={styles.insightTitle}>{insight.title}</Text>
      <Text style={styles.insightBody}>{insight.body}</Text>

      <View style={styles.metricRow}>
        <Feather name="trending-up" size={16} color="#1D4ED8" />
        <Text style={styles.metricText}>{insight.metric}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7ECF5",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#D97706",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#FFF4E7",
    alignItems: "center",
    justifyContent: "center",
  },
  miniChart: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 48,
    paddingHorizontal: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#D8E7FF",
  },
  shortBar: {
    height: 16,
  },
  mediumBar: {
    height: 28,
  },
  tallBar: {
    height: 42,
    backgroundColor: "#5B6CFF",
  },
  insightTitle: {
    marginTop: 16,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: "#0F172A",
  },
  insightBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  metricRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#375DFB",
  },
});
