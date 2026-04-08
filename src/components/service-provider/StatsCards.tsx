import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  dashboard?: Record<string, any> | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const CONFIG = [
  {
    key: "rating",
    label: "Rating",
    icon: <Feather name="star" size={18} color="#B45309" />,
    background: "#FFF3CF",
    accent: "#B45309",
    getValue: (dashboard: any) =>
      `${Number(dashboard?.serviceProfile?.averageRating || 0).toFixed(1)} / 5`,
    getMeta: (dashboard: any) =>
      Number(dashboard?.serviceProfile?.reviewCount || 0) > 0
        ? `${dashboard.serviceProfile.reviewCount} reviews received`
        : "No reviews yet",
  },
  {
    key: "bookings",
    label: "Total Bookings",
    icon: <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#1D4ED8" />,
    background: "#E5EEFF",
    accent: "#1D4ED8",
    getValue: (dashboard: any) =>
      String(
        dashboard?.bookingSummary?.totalBookings ??
          dashboard?.stats?.totalBookings ??
          dashboard?.totalBookings ??
          0
      ),
    getMeta: () => "Booking analytics ready when orders arrive",
  },
  {
    key: "earnings",
    label: "Monthly Earnings",
    icon: <Feather name="dollar-sign" size={18} color="#047857" />,
    background: "#E6FAEF",
    accent: "#047857",
    getValue: (dashboard: any) =>
      formatCurrency(
        Number(
          dashboard?.bookingSummary?.monthlyEarnings ??
            dashboard?.stats?.monthlyEarnings ??
            dashboard?.monthlyEarnings ??
            0
        )
      ),
    getMeta: () => "Connect payments to track revenue cleanly",
  },
  {
    key: "views",
    label: "Profile Views",
    icon: <Feather name="eye" size={18} color="#7C3AED" />,
    background: "#F0EAFE",
    accent: "#7C3AED",
    getValue: (dashboard: any) =>
      String(dashboard?.stats?.profileViews ?? dashboard?.profileViews ?? 0),
    getMeta: () => "Visibility insights coming soon",
  },
];

export default function StatsCards({ dashboard }: Props) {
  return (
    <View style={styles.grid}>
      {CONFIG.map((item) => (
        <View key={item.key} style={styles.card}>
          <View style={[styles.topAccent, { backgroundColor: item.accent }]} />
          <View style={styles.topRow}>
            <View>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.getValue(dashboard)}</Text>
            </View>
            <View style={[styles.iconWrap, { backgroundColor: item.background }]}>{item.icon}</View>
          </View>
          <Text style={styles.meta}>{item.getMeta(dashboard)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    overflow: "hidden",
    width: "48%",
    minWidth: 160,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7ECF5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7C8AA5",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
    color: "#52627C",
  },
});
