import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AdPlan = {
  value: string;
  label: string;
  durationDays?: number;
  price?: number;
  description?: string;
};

type Props = {
  plan: AdPlan;
  selected?: boolean;
  onSelect?: (value: string) => void;
  disabled?: boolean;
};

function formatCurrency(value?: number | null) {
  if (value == null) return "Custom";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function AdPlanCard({
  plan,
  selected = false,
  onSelect,
  disabled = false,
}: Props) {
  return (
    <View style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}>
      <View style={styles.topRow}>
        <View style={styles.copyBlock}>
          <View style={[styles.valueBadge, selected && styles.valueBadgeSelected]}>
            <Text style={[styles.valueBadgeText, selected && styles.valueBadgeTextSelected]}>
              {plan.value}
            </Text>
          </View>

          <Text style={styles.title}>{plan.label}</Text>
          <Text style={styles.duration}>{plan.durationDays || 0} days</Text>
        </View>

        <View style={styles.priceWrap}>
          {selected ? (
            <View style={styles.selectedMark}>
              <MaterialCommunityIcons name="check-decagram" size={18} color="#1D4ED8" />
            </View>
          ) : null}
          <Text style={styles.price}>{formatCurrency(plan.price)}</Text>
        </View>
      </View>

      <Text style={styles.description}>{plan.description || "Promotion plan for service discovery."}</Text>

      <View style={styles.footerRow}>
        <View style={styles.perkRow}>
          <Feather name="trending-up" size={15} color="#047857" />
          <Text style={styles.perkText}>Boost profile visibility</Text>
        </View>

        <Pressable
          disabled={disabled}
          onPress={() => onSelect?.(plan.value)}
          style={[
            styles.button,
            selected ? styles.selectedButton : styles.defaultButton,
            disabled && styles.buttonDisabled,
          ]}
        >
          <Text style={[styles.buttonText, selected ? styles.selectedButtonText : styles.defaultButtonText]}>
            {selected ? "Selected" : "Choose Plan"}
          </Text>
        </Pressable>
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
  cardSelected: {
    borderColor: "#60A5FA",
    backgroundColor: "#F8FBFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  copyBlock: {
    flex: 1,
    gap: 8,
  },
  valueBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  valueBadgeSelected: {
    backgroundColor: "#DBEAFE",
  },
  valueBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  valueBadgeTextSelected: {
    color: "#1D4ED8",
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    color: "#0F172A",
  },
  duration: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    fontWeight: "700",
  },
  priceWrap: {
    alignItems: "flex-end",
    gap: 10,
  },
  selectedMark: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  description: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  footerRow: {
    marginTop: 18,
    gap: 14,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  perkText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#065F46",
    fontWeight: "700",
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  defaultButton: {
    backgroundColor: "#0F172A",
  },
  selectedButton: {
    backgroundColor: "#DBEAFE",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "900",
  },
  defaultButtonText: {
    color: "#FFFFFF",
  },
  selectedButtonText: {
    color: "#1D4ED8",
  },
});
