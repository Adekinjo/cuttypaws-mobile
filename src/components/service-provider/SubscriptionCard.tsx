import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  subscription?: Record<string, any> | null;
  onUpgrade?: () => void;
};

function formatCurrency(value?: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SubscriptionCard({ subscription, onUpgrade }: Props) {
  const isActive = Boolean(subscription?.isActive);
  const planName = subscription?.planType || "Free";
  const meta = subscription
    ? `${formatCurrency(subscription.amount) || "Custom"}${formatDateTime(subscription.endsAt) ? ` • ends ${formatDateTime(subscription.endsAt)}` : ""}`
    : "No active paid plan";

  return (
    <View style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.body}>
            Keep your business visible and attract more customers.
          </Text>
        </View>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="diamond-stone" size={20} color="#1D4ED8" />
        </View>
      </View>

      <View style={styles.planCard}>
        <View style={styles.planTop}>
          <View style={styles.planCopy}>
            <Text style={styles.planName}>{planName}</Text>
            <Text style={styles.planMeta}>{meta}</Text>
          </View>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.freeBadge]}>
            <Text style={[styles.statusText, isActive ? styles.activeText : styles.freeText]}>
              {isActive ? "Active" : "Free"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.benefits}>
        {[
          "Promoted profile visibility",
          "Priority placement in service discovery",
          "Performance-ready growth tools",
        ].map((item) => (
          <View key={item} style={styles.benefitRow}>
            <Feather name="check-circle" size={16} color="#047857" />
            <Text style={styles.benefitText}>{item}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.upgradeButton} onPress={onUpgrade}>
        <Feather name="arrow-up-right" size={16} color="#FFFFFF" />
        <Text style={styles.upgradeText}>Upgrade Plan</Text>
      </Pressable>
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
  glow: {
    position: "absolute",
    top: -26,
    right: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EEF2FF",
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
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  planCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#F7F9FD",
    padding: 15,
    borderWidth: 1,
    borderColor: "#E7ECF5",
  },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  planCopy: {
    flex: 1,
    gap: 6,
  },
  planName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  planMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeBadge: {
    backgroundColor: "#DCFCE7",
  },
  freeBadge: {
    backgroundColor: "#E8EEF7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },
  activeText: {
    color: "#166534",
  },
  freeText: {
    color: "#334155",
  },
  benefits: {
    marginTop: 16,
    gap: 10,
  },
  benefitRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: "#334155",
  },
  upgradeButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "#375DFB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  upgradeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
