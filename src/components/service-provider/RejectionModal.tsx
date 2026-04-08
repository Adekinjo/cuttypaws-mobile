import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  visible: boolean;
  onClose?: () => void;
  onSubmit?: (reason: string) => void | Promise<void>;
  submitting?: boolean;
  profile?: Record<string, any> | null;
};

export default function RejectionModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
  profile,
}: Props) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!visible) {
      setReason("");
    }
  }, [visible]);

  const handleClose = () => {
    setReason("");
    onClose?.();
  };

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed || submitting) return;
    await onSubmit?.(trimmed);
    setReason("");
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Reject registration</Text>
          <Text style={styles.body}>
            Add a rejection reason for{" "}
            {profile?.ownerName || profile?.businessName || "this service provider"}.
          </Text>

          <View style={styles.inputShell}>
            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={5}
              value={reason}
              onChangeText={setReason}
              placeholder="Explain why this registration is being rejected"
              placeholderTextColor="#94A3B8"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.secondaryButton, submitting && styles.disabledButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.dangerButton,
                (submitting || !reason.trim()) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={submitting || !reason.trim()}
            >
              <Text style={styles.dangerButtonText}>
                {submitting ? "Submitting..." : "Reject"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
  inputShell: {
    marginTop: 18,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 128,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 21,
    color: "#0F172A",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#B91C1C",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
