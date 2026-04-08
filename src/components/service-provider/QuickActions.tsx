import type { ReactNode } from "react";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  dashboard?: Record<string, any> | null;
  onEdit?: () => void;
  onManageAdverts?: () => void;
  onViewPublicProfile?: () => void;
};

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  icon: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "dark";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        tone === "primary" && styles.primaryButton,
        tone === "secondary" && styles.secondaryButton,
        tone === "dark" && styles.darkButton,
        disabled && styles.disabledButton,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          tone === "primary" && styles.primaryButtonText,
          tone === "secondary" && styles.secondaryButtonText,
          tone === "dark" && styles.darkButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function QuickActions({
  dashboard,
  onEdit,
  onManageAdverts,
  onViewPublicProfile,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Quick Actions</Text>
          <Text style={styles.body}>
            Edit your profile, preview the public listing, or manage promotions.
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="lightning-bolt-circle" size={22} color="#375DFB" />
        </View>
      </View>

      <View style={styles.stack}>
        <ActionButton
          label="Edit Service"
          icon={<Feather name="edit-2" size={16} color="#FFFFFF" />}
          onPress={onEdit}
          tone="primary"
        />
        <ActionButton
          label="View Public Profile"
          icon={<Feather name="external-link" size={16} color="#1D4ED8" />}
          onPress={onViewPublicProfile}
          disabled={!dashboard?.serviceProfile?.userId}
          tone="secondary"
        />
        <ActionButton
          label="Manage Adverts"
          icon={<MaterialCommunityIcons name="bullhorn-outline" size={18} color="#FFFFFF" />}
          onPress={onManageAdverts}
          disabled={!dashboard?.canAccessDashboard}
          tone="dark"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  body: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#66778F",
  },
  stack: {
    marginTop: 16,
    gap: 10,
  },
  button: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#375DFB",
  },
  secondaryButton: {
    backgroundColor: "#EEF4FF",
  },
  darkButton: {
    backgroundColor: "#111C37",
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#1D4ED8",
  },
  darkButtonText: {
    color: "#FFFFFF",
  },
});
