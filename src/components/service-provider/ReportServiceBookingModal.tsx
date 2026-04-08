import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ServiceBookingReportService from "../../api/ServiceBookingReportService";

type Props = {
  visible: boolean;
  onHide?: () => void;
  booking?: Record<string, any> | null;
  onSuccess?: (report?: any) => void;
};

const REASONS = [
  { value: "PROVIDER_DID_NOT_SHOW_UP", label: "Provider did not show up" },
  { value: "UNSATISFACTORY_SERVICE", label: "Unsatisfactory service" },
  { value: "RUDE_BEHAVIOR", label: "Rude behavior" },
  { value: "SAFETY_CONCERN", label: "Safety concern" },
  { value: "OVERCHARGED", label: "Overcharged" },
  { value: "SCAM_SUSPECTED", label: "Scam suspected" },
  { value: "OTHER", label: "Other" },
];

export default function ReportServiceBookingModal({
  visible,
  onHide,
  booking,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState("UNSATISFACTORY_SERVICE");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    setReason("UNSATISFACTORY_SERVICE");
    setDetails("");
    setSubmitting(false);
    setErrorMessage("");
    setSuccessMessage("");

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [visible, booking?.id]);

  async function handleSubmit() {
    if (!booking?.id || submitting || !details.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await ServiceBookingReportService.createReport({
        bookingId: booking.id,
        reason,
        details: details.trim(),
      });

      if (response?.status === 201) {
        setSuccessMessage("Your report has been submitted successfully. Admin has been notified.");

        closeTimeoutRef.current = setTimeout(() => {
          closeTimeoutRef.current = null;
          onHide?.();
          onSuccess?.(response?.serviceBookingReport);
        }, 2000);

        return;
      }

      setErrorMessage(response?.message || "Failed to submit report");
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message || error?.message || "Failed to submit report"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    onHide?.();
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {successMessage ? (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Feather name="check" size={30} color="#166534" />
              </View>
              <Text style={styles.successTitle}>Report submitted</Text>
              <Text style={styles.successBody}>{successMessage}</Text>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <MaterialCommunityIcons
                    name="shield-alert-outline"
                    size={22}
                    color="#B91C1C"
                  />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Report Service Issue</Text>
                  <Text style={styles.subtitle}>
                    Send a complaint to the admin team for review.
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.formArea} contentContainerStyle={styles.formContent}>
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-triangle" size={17} color="#B91C1C" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.providerCard}>
                  <Text style={styles.providerLabel}>Provider</Text>
                  <Text style={styles.providerValue}>
                    {booking?.businessName || booking?.providerName || "Service Provider"}
                  </Text>
                  <Text style={styles.providerBody}>
                    Use this form to report a problem with the booked service. Our admin team will review it.
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Reason</Text>
                  <View style={styles.reasonGrid}>
                    {REASONS.map((item) => {
                      const selected = item.value === reason;
                      return (
                        <Pressable
                          key={item.value}
                          disabled={submitting}
                          onPress={() => setReason(item.value)}
                          style={[
                            styles.reasonChip,
                            selected && styles.reasonChipSelected,
                            submitting && styles.disabledButton,
                          ]}
                        >
                          <Text
                            style={[
                              styles.reasonChipText,
                              selected && styles.reasonChipTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Explain what happened</Text>
                  <TextInput
                    style={styles.textarea}
                    multiline
                    numberOfLines={6}
                    value={details}
                    onChangeText={setDetails}
                    editable={!submitting}
                    placeholder="Please explain the issue clearly so the admin team can review it."
                    placeholderTextColor="#94A3B8"
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  style={[styles.cancelButton, submitting && styles.disabledButton]}
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitButton,
                    (submitting || !details.trim()) && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting || !details.trim()}
                >
                  {submitting ? (
                    <View style={styles.submittingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
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
    padding: 16,
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  formArea: {
    maxHeight: 520,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
    fontWeight: "600",
  },
  providerCard: {
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  providerLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  providerValue: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: "#0F172A",
  },
  providerBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  reasonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  reasonChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonChipSelected: {
    backgroundColor: "#FEE2E2",
  },
  reasonChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  reasonChipTextSelected: {
    color: "#B91C1C",
  },
  textarea: {
    minHeight: 140,
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
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  submitButton: {
    flex: 1.25,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#B91C1C",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.55,
  },
  successWrap: {
    padding: 28,
    alignItems: "center",
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    marginTop: 16,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  successBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#166534",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 18,
    minHeight: 48,
    minWidth: 140,
    borderRadius: 16,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
