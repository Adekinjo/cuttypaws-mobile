import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  subscription?: Record<string, any> | null;
};

function formatCurrency(value?: number | null) {
  if (value == null) return "Custom";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusPalette(subscription?: Record<string, any> | null) {
  if (subscription?.isActive) {
    return {
      bg: "#DCFCE7",
      text: "#166534",
      icon: "check-decagram" as const,
    };
  }

  switch (String(subscription?.paymentStatus || "").toUpperCase()) {
    case "PENDING":
      return {
        bg: "#FEF3C7",
        text: "#92400E",
        icon: "clock-alert-outline" as const,
      };
    case "FAILED":
      return {
        bg: "#FEE2E2",
        text: "#B91C1C",
        icon: "close-octagon-outline" as const,
      };
    default:
      return {
        bg: "#E2E8F0",
        text: "#334155",
        icon: "information-outline" as const,
      };
  }
}

function MetaTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.metaTile}>
      <View style={styles.metaTop}>
        <View style={styles.metaIcon}>
          <Feather name={icon} size={14} color="#1D4ED8" />
        </View>
        <Text style={styles.metaLabel}>{label}</Text>
      </View>
      <Text style={styles.metaValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export default function ActiveSubscriptionCard({ subscription }: Props) {
  if (!subscription) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="diamond-stone" size={22} color="#1D4ED8" />
        </View>
        <Text style={styles.emptyTitle}>No active promotion</Text>
        <Text style={styles.emptyBody}>
          Start a paid promotion plan when you want stronger visibility in service discovery.
        </Text>
      </View>
    );
  }

  const palette = getStatusPalette(subscription);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>Promotion Status</Text>
          <Text style={styles.title}>Active promotion</Text>
          <Text style={styles.planType}>{subscription.planType || "Subscription plan"}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
          <MaterialCommunityIcons name={palette.icon} size={14} color={palette.text} />
          <Text style={[styles.statusText, { color: palette.text }]}>
            {subscription.paymentStatus || (subscription.isActive ? "ACTIVE" : "INACTIVE")}
          </Text>
        </View>
      </View>

      <View style={styles.heroStrip}>
        <View>
          <Text style={styles.heroLabel}>Current spend</Text>
          <Text style={styles.heroValue}>{formatCurrency(subscription.amount)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View>
          <Text style={styles.heroLabel}>Campaign window</Text>
          <Text style={styles.heroSubtext}>
            {formatDateTime(subscription.startsAt)} to {formatDateTime(subscription.endsAt)}
          </Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <MetaTile label="Amount" value={formatCurrency(subscription.amount)} icon="dollar-sign" />
        <MetaTile
          label="Reference"
          value={subscription.paymentReference || "Not available"}
          icon="hash"
        />
        <MetaTile label="Starts" value={formatDateTime(subscription.startsAt)} icon="calendar" />
        <MetaTile label="Ends" value={formatDateTime(subscription.endsAt)} icon="clock" />
      </View>
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
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  emptyIconWrap: {
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  planType: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  heroStrip: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    padding: 16,
    gap: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#93C5FD",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroValue: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  heroSubtext: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#1E293B",
  },
  metaGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaTile: {
    width: "48%",
    minWidth: 150,
    flexGrow: 1,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    padding: 14,
  },
  metaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  metaValue: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#0F172A",
    fontWeight: "700",
  },
});
