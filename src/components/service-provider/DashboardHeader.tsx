import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  dashboard?: Record<string, any> | null;
  onEdit?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

function getStatusTone(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return { bg: "#DCFCE7", fg: "#166534" };
    case "REJECTED":
      return { bg: "#FEE2E2", fg: "#B91C1C" };
    case "SUSPENDED":
      return { bg: "#FEE2E2", fg: "#991B1B" };
    default:
      return { bg: "#FEF3C7", fg: "#92400E" };
  }
}

export default function DashboardHeader({
  dashboard,
  onEdit,
  onRefresh,
  refreshing,
}: Props) {
  const status = dashboard?.status || "PENDING";
  const tone = getStatusTone(status);

  return (
    <View style={styles.card}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <View style={styles.row}>
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>Service Operations</Text>
          <Text style={styles.title}>Service Dashboard</Text>
          <Text style={styles.subtitle}>Manage and grow your service business.</Text>
        </View>

        <View style={styles.actions}>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{status}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={onEdit}>
            <Feather name="edit-2" size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </Pressable>

          <Pressable
            style={[styles.iconButton, refreshing && styles.iconButtonDisabled]}
            disabled={refreshing}
            onPress={onRefresh}
          >
            <Feather name="refresh-cw" size={16} color="#1D4ED8" />
          </Pressable>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{dashboard?.serviceProfile?.reviewCount ?? 0}</Text>
            <Text style={styles.metricLabel}>Reviews</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{dashboard?.bookingSummary?.totalBookings ?? dashboard?.stats?.totalBookings ?? 0}</Text>
            <Text style={styles.metricLabel}>Bookings</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>
              {Number(dashboard?.serviceProfile?.averageRating || 0).toFixed(1)}
            </Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: "#10182E",
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
  },
  glowOne: {
    position: "absolute",
    top: -24,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(91,108,255,0.25)",
  },
  glowTwo: {
    position: "absolute",
    bottom: -36,
    left: -22,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(56,189,248,0.14)",
  },
  row: {
    gap: 18,
  },
  copyBlock: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#9CC8FF",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#C9D5EA",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#375DFB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricPill: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#B7C5DC",
    textTransform: "uppercase",
  },
});
