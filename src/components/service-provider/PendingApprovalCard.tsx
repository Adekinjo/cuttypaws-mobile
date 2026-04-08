import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import ServiceProfileCard from "./ServiceProfileCard";

type Props = {
  profile: Record<string, any>;
  onApprove?: () => void;
  onReject?: () => void;
  approving?: boolean;
  rejecting?: boolean;
};

export default function PendingApprovalCard({
  profile,
  onApprove,
  onReject,
  approving = false,
  rejecting = false,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.identityBlock}>
          <View style={styles.avatarWrap}>
            <Feather name="user" size={18} color="#1D4ED8" />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.ownerName}>{profile?.ownerName || "Service Provider"}</Text>
            <Text style={styles.businessName}>{profile?.businessName || "No business name"}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Awaiting Review</Text>
        </View>
      </View>

      <ServiceProfileCard profile={profile} />

      <View style={styles.actions}>
        <Pressable
          style={[styles.approveButton, approving && styles.disabledButton]}
          disabled={approving}
          onPress={onApprove}
        >
          <Feather name="check" size={16} color="#FFFFFF" />
          <Text style={styles.approveButtonText}>{approving ? "Approving..." : "Approve"}</Text>
        </Pressable>

        <Pressable
          style={[styles.rejectButton, rejecting && styles.disabledButton]}
          disabled={rejecting}
          onPress={onReject}
        >
          <Feather name="x" size={16} color="#B91C1C" />
          <Text style={styles.rejectButtonText}>{rejecting ? "Rejecting..." : "Reject"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
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
  identityCopy: {
    flex: 1,
  },
  ownerName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  businessName: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#92400E",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  approveButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  rejectButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  rejectButtonText: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.55,
  },
});
