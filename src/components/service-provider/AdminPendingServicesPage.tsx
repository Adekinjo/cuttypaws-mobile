import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import ServiceProviderService from "../../api/ServiceProviderService";
import ServiceProfileCard from "./ServiceProfileCard";

type ServiceProfile = Record<string, any>;

function StatusPill({ count }: { count: number }) {
  return (
    <View style={styles.statusPill}>
      <MaterialCommunityIcons name="shield-check-outline" size={15} color="#1D4ED8" />
      <Text style={styles.statusPillText}>{count} pending</Text>
    </View>
  );
}

function RejectionSheet({
  visible,
  profile,
  submitting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  profile: ServiceProfile | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible) {
      setReason("");
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Reject registration</Text>
          <Text style={styles.modalBody}>
            Add a rejection reason for{" "}
            {profile?.ownerName || profile?.businessName || "this service provider"}.
          </Text>

          <TextInput
            style={styles.modalInput}
            multiline
            numberOfLines={5}
            placeholder="Explain why this registration is being rejected"
            placeholderTextColor="#94A3B8"
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <Pressable style={styles.modalSecondaryButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalDangerButton,
                (submitting || !reason.trim()) && styles.disabledButton,
              ]}
              disabled={submitting || !reason.trim()}
              onPress={() => onSubmit(reason.trim())}
            >
              <Text style={styles.modalDangerButtonText}>
                {submitting ? "Submitting..." : "Reject"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PendingApprovalCard({
  profile,
  approving,
  rejecting,
  onApprove,
  onReject,
}: {
  profile: ServiceProfile;
  approving: boolean;
  rejecting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.profileCardShell}>
      <View style={styles.profileCardHeader}>
        <View style={styles.identityBlock}>
          <View style={styles.identityIcon}>
            <Feather name="user" size={16} color="#1D4ED8" />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.ownerName}>{profile.ownerName || "Service Provider"}</Text>
            <Text style={styles.ownerMeta}>{profile.businessName || "No business name"}</Text>
          </View>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Awaiting Review</Text>
        </View>
      </View>

      <ServiceProfileCard profile={profile} />

      <View style={styles.actionRow}>
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

export default function AdminPendingServicesPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ServiceProfile | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pendingCount = useMemo(() => profiles.length, [profiles]);

  async function loadProfiles(options?: { refresh?: boolean }) {
    const refresh = Boolean(options?.refresh);
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const admin = await AuthService.isAdmin();
      setIsAdmin(admin);

      if (!admin) {
        setProfiles([]);
        setError("");
        return;
      }

      const response = await ServiceProviderService.getPendingServiceRegistrations();
      setProfiles(response?.serviceProfiles || []);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load pending service registrations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleApprove(profile: ServiceProfile) {
    try {
      setSuccess("");
      setApprovingId(String(profile.userId));
      const response = await ServiceProviderService.approveServiceRegistration(String(profile.userId));
      setSuccess(response?.message || "Service registration approved.");
      await loadProfiles({ refresh: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to approve service registration.");
    } finally {
      setApprovingId(null);
    }
  }

  async function handleReject(reason: string) {
    if (!selectedProfile?.userId) return;
    try {
      setSuccess("");
      setRejectingId(String(selectedProfile.userId));
      const response = await ServiceProviderService.rejectServiceRegistration(
        String(selectedProfile.userId),
        reason
      );
      setSuccess(response?.message || "Service registration rejected.");
      setSelectedProfile(null);
      await loadProfiles({ refresh: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to reject service registration.");
    } finally {
      setRejectingId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.centerTitle}>Loading pending registrations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAdmin === false) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={styles.centerIcon}>
            <MaterialCommunityIcons name="shield-lock-outline" size={30} color="#B91C1C" />
          </View>
          <Text style={styles.centerTitle}>Admin access required</Text>
          <Text style={styles.centerBody}>
            This moderation page is restricted to administrators.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfiles({ refresh: true })}
            tintColor="#1D4ED8"
          />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Admin Moderation</Text>
          <Text style={styles.heroTitle}>Pending service registrations</Text>
          <Text style={styles.heroBody}>
            Review incoming provider applications, approve strong listings fast, and reject weak or incomplete submissions with a clear reason.
          </Text>
          <StatusPill count={pendingCount} />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-triangle" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBanner}>
            <Feather name="check-circle" size={18} color="#166534" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {!profiles.length ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={26} color="#1D4ED8" />
            </View>
            <Text style={styles.emptyTitle}>No pending registrations</Text>
            <Text style={styles.emptyBody}>
              New service applications will appear here when they need admin review.
            </Text>
          </View>
        ) : (
          <View style={styles.stack}>
            {profiles.map((profile) => (
              <PendingApprovalCard
                key={profile.id || profile.userId}
                profile={profile}
                approving={approvingId === String(profile.userId)}
                rejecting={rejectingId === String(profile.userId)}
                onApprove={() => handleApprove(profile)}
                onReject={() => setSelectedProfile(profile)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <RejectionSheet
        visible={Boolean(selectedProfile)}
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onSubmit={handleReject}
        submitting={Boolean(rejectingId)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  centerIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  centerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  centerBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#7DD3FC",
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#F8FAFC",
  },
  heroBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#CBD5E1",
  },
  statusPill: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  errorBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
    fontWeight: "600",
  },
  successBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#166534",
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    padding: 24,
  },
  emptyIcon: {
    width: 58,
    height: 58,
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
  stack: {
    gap: 16,
  },
  profileCardShell: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileCardHeader: {
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
  identityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  identityCopy: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#0F172A",
  },
  ownerMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
  pendingBadge: {
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#92400E",
  },
  actionRow: {
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
  modalInput: {
    marginTop: 16,
    minHeight: 128,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modalSecondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  modalDangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B91C1C",
  },
  modalDangerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
