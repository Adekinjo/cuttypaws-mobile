import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  dashboard?: Record<string, any> | null;
};

function getStatusPalette(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", icon: "check-decagram" as const };
    case "REJECTED":
      return { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: "close-octagon" as const };
    case "SUSPENDED":
      return { bg: "#FEF2F2", border: "#FECACA", text: "#7F1D1D", icon: "shield-off-outline" as const };
    default:
      return { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", icon: "clock-alert-outline" as const };
  }
}

export default function ServiceStatusBanner({ dashboard }: Props) {
  if (!dashboard) return null;

  const palette = getStatusPalette(dashboard.status);

  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={[styles.sideAccent, { backgroundColor: palette.text }]} />
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: "#FFFFFF" }]}>
          <MaterialCommunityIcons name={palette.icon} size={20} color={palette.text} />
        </View>
        <View style={styles.copyWrap}>
          <Text style={[styles.badge, { color: palette.text }]}>{dashboard.status || "PENDING"}</Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {dashboard.statusMessage || "Service status"}
          </Text>
          <Text style={styles.body}>
            Your dashboard tools and discovery visibility follow your backend approval status.
          </Text>
          {dashboard.rejectionReason ? (
            <Text style={styles.reason}>
              Reason: {dashboard.rejectionReason}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  sideAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 5,
  },
  headerRow: {
    flexDirection: "row",
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  badge: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    color: "#56657E",
  },
  reason: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#0F172A",
    fontWeight: "700",
  },
});
