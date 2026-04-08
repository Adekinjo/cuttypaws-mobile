import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import ServiceBookingReportService from "../../api/ServiceBookingReportService";
import ServiceBookingService from "../../api/ServiceBookingService";

type ServiceBooking = {
  id?: string | number;
  businessName?: string;
  providerName?: string;
  providerUserId?: string | number;
  serviceType?: string;
  amount?: number | string;
  bookingStatus?: string;
  paymentStatus?: string;
  startsAt?: string;
  endsAt?: string;
  serviceAddress?: string;
  petName?: string;
  petType?: string;
  notes?: string;
  paymentReference?: string;
  createdAt?: string;
};

type BookingReport = {
  id?: string | number;
  bookingId?: string | number;
  reason?: string;
  description?: string;
  status?: string;
  adminNote?: string;
};

const reportReasonOptions = [
  "Provider did not show up",
  "Service quality issue",
  "Unsafe handling",
  "Unexpected extra charge",
  "Wrong service delivered",
  "Other",
];

export default function MyServiceBookings({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [reports, setReports] = useState<BookingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportReason, setReportReason] = useState(reportReasonOptions[0]);
  const [reportDescription, setReportDescription] = useState("");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    loadBookingsAndReports();
  }, []);

  async function loadBookingsAndReports() {
    try {
      setLoading(true);
      setError("");

      const [bookingResponse, reportResponse] = await Promise.all([
        ServiceBookingService.getMyBookings(),
        ServiceBookingReportService.getMyReports(),
      ]);

      const bookingList =
        bookingResponse?.serviceBookings ||
        bookingResponse?.data?.serviceBookings ||
        [];

      const reportList =
        reportResponse?.serviceBookingReports ||
        reportResponse?.data?.serviceBookingReports ||
        [];

      setBookings(Array.isArray(bookingList) ? bookingList : []);
      setReports(Array.isArray(reportList) ? reportList : []);
    } catch (loadError: any) {
      console.error("[MyServiceBookings] Failed to load bookings or reports", loadError);
      setError(loadError?.message || "Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  }

  function openReportModal(booking: ServiceBooking) {
    setSelectedBooking(booking);
    setReportReason(reportReasonOptions[0]);
    setReportDescription("");
    setReportError("");
    setShowReportModal(true);
  }

  function closeReportModal() {
    setShowReportModal(false);
    setSelectedBooking(null);
    setReportDescription("");
    setReportError("");
  }

  async function submitReport() {
    if (!selectedBooking?.id) return;
    if (!reportReason.trim()) {
      setReportError("Please select a reason.");
      return;
    }
    if (!reportDescription.trim()) {
      setReportError("Please describe the issue.");
      return;
    }

    try {
      setSubmittingReport(true);
      setReportError("");

      const response = await ServiceBookingReportService.createReport({
        bookingId: selectedBooking.id,
        reason: reportReason,
        description: reportDescription.trim(),
      });

      const createdReport =
        response?.serviceBookingReport ||
        response?.report ||
        response?.data?.serviceBookingReport ||
        response?.data ||
        null;

      if (createdReport?.bookingId) {
        setReports((prev) => {
          const existing = prev.filter((item) => item.bookingId !== createdReport.bookingId);
          return [createdReport, ...existing];
        });
      }

      closeReportModal();
    } catch (submitError: any) {
      console.error("[MyServiceBookings] Failed to submit report", submitError);
      setReportError(submitError?.message || "Unable to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  }

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aTime = a?.startsAt ? new Date(a.startsAt).getTime() : 0;
      const bTime = b?.startsAt ? new Date(b.startsAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [bookings]);

  const reportMap = useMemo(() => {
    const map = new Map<string | number, BookingReport>();
    reports.forEach((report) => {
      if (report?.bookingId !== undefined && report?.bookingId !== null) {
        map.set(report.bookingId, report);
      }
    });
    return map;
  }, [reports]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((booking) =>
      ["CONFIRMED", "PENDING_PAYMENT"].includes(String(booking.bookingStatus || "").toUpperCase())
    ).length;
    const completed = bookings.filter((booking) =>
      ["COMPLETED"].includes(String(booking.bookingStatus || "").toUpperCase())
    ).length;
    const reported = reports.length;
    return { total, active, completed, reported };
  }, [bookings, reports.length]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.centerTitle}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>My Service Bookings</Text>
            <Text style={styles.headerSubtitle}>View all pet services you have booked</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Feather name="calendar" size={18} color="#D97706" />}
            tint="#FFF7ED"
            value={String(stats.total)}
            label="Bookings"
          />
          <StatCard
            icon={<Feather name="clock" size={18} color="#A16207" />}
            tint="#FFFBEB"
            value={String(stats.active)}
            label="Active"
          />
          <StatCard
            icon={<Feather name="check-circle" size={18} color="#15803D" />}
            tint="#F0FDF4"
            value={String(stats.completed)}
            label="Completed"
          />
          <StatCard
            icon={<Feather name="alert-triangle" size={18} color="#B91C1C" />}
            tint="#FEF2F2"
            value={String(stats.reported)}
            label="Reports"
          />
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load bookings</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.primaryButton} onPress={loadBookingsAndReports}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!error && sortedBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="calendar" size={24} color="#D97706" />
            </View>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>You have not booked any service yet.</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => onNavigate?.("home")}
            >
              <Text style={styles.primaryButtonText}>Explore Services</Text>
            </Pressable>
          </View>
        ) : null}

        {!error && sortedBookings.length > 0 ? (
          <View style={styles.bookingList}>
            {sortedBookings.map((booking) => {
              const report = booking.id !== undefined ? reportMap.get(booking.id) : undefined;
              const bookingStatus = getStatusMeta(booking.bookingStatus);
              const paymentStatus = booking.paymentStatus
                ? getStatusMeta(booking.paymentStatus)
                : null;
              const reportStatus = report?.status ? getReportMeta(report.status) : null;

              return (
                <View key={String(booking.id)} style={styles.bookingCard}>
                  <View style={styles.bookingTopRow}>
                    <View style={styles.bookingHeading}>
                      <Text style={styles.providerName}>
                        {booking.businessName || booking.providerName || "Service Provider"}
                      </Text>
                      <View style={styles.metaRow}>
                        <MetaLine
                          icon={<Feather name="briefcase" size={13} color="#64748B" />}
                          text={booking.serviceType || "Service"}
                        />
                        <MetaLine
                          icon={<Feather name="dollar-sign" size={13} color="#64748B" />}
                          text={`$${booking.amount ?? "0.00"}`}
                        />
                      </View>
                    </View>

                    <View style={styles.badgeStack}>
                      <StatusBadge label={booking.bookingStatus || "Unknown"} meta={bookingStatus} />
                      {paymentStatus ? (
                        <StatusBadge
                          label={`Payment: ${booking.paymentStatus}`}
                          meta={paymentStatus}
                        />
                      ) : null}
                      {reportStatus ? (
                        <StatusBadge label={reportStatus.label} meta={reportStatus} />
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.twoColumnGrid}>
                    <View style={styles.infoPanel}>
                      <Text style={styles.panelTitle}>Booking Details</Text>
                      <MetaLine
                        icon={<Feather name="calendar" size={14} color="#D97706" />}
                        text={formatDateTime(booking.startsAt)}
                      />
                      <MetaLine
                        icon={<Feather name="clock" size={14} color="#D97706" />}
                        text={formatDateTime(booking.endsAt)}
                      />
                      <MetaLine
                        icon={<Feather name="map-pin" size={14} color="#D97706" />}
                        text={booking.serviceAddress || "Address not provided"}
                      />
                    </View>

                    <View style={styles.infoPanel}>
                      <Text style={styles.panelTitle}>Pet Information</Text>
                      <MetaLine
                        icon={<MaterialCommunityIcons name="paw" size={14} color="#D97706" />}
                        text={`Pet: ${booking.petName || "N/A"}`}
                      />
                      <Text style={styles.plainInfoText}>
                        <Text style={styles.plainInfoLabel}>Type: </Text>
                        {booking.petType || "N/A"}
                      </Text>
                      <Text style={styles.plainInfoText}>
                        <Text style={styles.plainInfoLabel}>Notes: </Text>
                        {booking.notes || "No extra notes"}
                      </Text>
                    </View>
                  </View>

                  {report ? (
                    <View style={styles.reportPanel}>
                      <Text style={styles.panelTitle}>Service Report Status</Text>
                      <Text style={styles.reportText}>
                        <Text style={styles.plainInfoLabel}>Reason: </Text>
                        {report.reason || "N/A"}
                      </Text>
                      <Text style={styles.reportText}>
                        <Text style={styles.plainInfoLabel}>Status: </Text>
                        {getReportMeta(report.status).label}
                      </Text>
                      {report.adminNote ? (
                        <Text style={styles.reportText}>
                          <Text style={styles.plainInfoLabel}>Admin Note: </Text>
                          {report.adminNote}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <View style={styles.footerCopy}>
                      <Text style={styles.footerMeta}>
                        <Text style={styles.footerMetaLabel}>Reference: </Text>
                        {booking.paymentReference || "N/A"}
                      </Text>
                      <Text style={styles.footerMeta}>
                        <Text style={styles.footerMetaLabel}>Booked on: </Text>
                        {formatDateTime(booking.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.footerActions}>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() =>
                          onNavigate?.("public-service-profile", {
                            userId: booking.providerUserId,
                          })
                        }
                      >
                        <Text style={styles.secondaryButtonText}>View Provider</Text>
                      </Pressable>

                      {(booking.bookingStatus === "CONFIRMED" ||
                        booking.bookingStatus === "COMPLETED") &&
                      !report ? (
                        <Pressable
                          style={styles.dangerButton}
                          onPress={() => openReportModal(booking)}
                        >
                          <Text style={styles.dangerButtonText}>Report Service</Text>
                        </Pressable>
                      ) : null}

                      {report ? (
                        <View style={styles.disabledStatusPill}>
                          <Text style={styles.disabledStatusPillText}>
                            {getReportMeta(report.status).label}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={showReportModal}
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Service</Text>
              <Pressable onPress={closeReportModal} style={styles.modalClose}>
                <Feather name="x" size={18} color="#0F172A" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Tell us what went wrong with{" "}
              {selectedBooking?.businessName || selectedBooking?.providerName || "this booking"}.
            </Text>

            <Text style={styles.fieldLabel}>Reason</Text>
            <View style={styles.reasonWrap}>
              {reportReasonOptions.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.reasonChip,
                    reportReason === option && styles.reasonChipActive,
                  ]}
                  onPress={() => setReportReason(option)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      reportReason === option && styles.reasonChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Describe what happened..."
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.descriptionInput}
              textAlignVertical="top"
            />

            {reportError ? <Text style={styles.reportErrorText}>{reportError}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={closeReportModal}>
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalPrimaryButton}
                onPress={submitReport}
                disabled={submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Submit Report</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  tint,
  value,
  label,
}: {
  icon: ReactNode;
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: tint }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MetaLine({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <View style={styles.metaLine}>
      {icon}
      <Text style={styles.metaLineText}>{text}</Text>
    </View>
  );
}

function StatusBadge({
  label,
  meta,
}: {
  label: string;
  meta: { backgroundColor: string; textColor: string; icon: keyof typeof Feather.glyphMap };
}) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: meta.backgroundColor }]}>
      <Feather name={meta.icon} size={12} color={meta.textColor} />
      <Text style={[styles.statusBadgeText, { color: meta.textColor }]}>{label}</Text>
    </View>
  );
}

function getStatusMeta(status?: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "CONFIRMED" || normalized === "COMPLETED") {
    return { backgroundColor: "#DCFCE7", textColor: "#166534", icon: "check-circle" as const };
  }
  if (normalized === "PENDING_PAYMENT") {
    return { backgroundColor: "#FEF3C7", textColor: "#A16207", icon: "clock" as const };
  }
  if (["CANCELLED", "DECLINED", "FAILED", "EXPIRED"].includes(normalized)) {
    return { backgroundColor: "#FEE2E2", textColor: "#B91C1C", icon: "x-circle" as const };
  }

  return { backgroundColor: "#E2E8F0", textColor: "#334155", icon: "clock" as const };
}

function getReportMeta(status?: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "OPEN") {
    return { backgroundColor: "#FEE2E2", textColor: "#B91C1C", icon: "alert-triangle" as const, label: "Report Submitted" };
  }
  if (normalized === "UNDER_REVIEW") {
    return { backgroundColor: "#FEF3C7", textColor: "#A16207", icon: "clock" as const, label: "Under Review" };
  }
  if (normalized === "RESOLVED") {
    return { backgroundColor: "#DCFCE7", textColor: "#166534", icon: "check-circle" as const, label: "Resolved" };
  }
  if (normalized === "REJECTED") {
    return { backgroundColor: "#E2E8F0", textColor: "#475569", icon: "slash" as const, label: "Rejected" };
  }

  return { backgroundColor: "#E2E8F0", textColor: "#334155", icon: "alert-triangle" as const, label: "Report Submitted" };
}

function formatDateTime(value?: string) {
  if (!value) return "N/A";

  try {
    return new Date(value).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 42,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "47.8%",
    borderRadius: 24,
    padding: 16,
  },
  statIcon: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  errorCard: {
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    backgroundColor: "#FEE2E2",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#991B1B",
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#991B1B",
  },
  primaryButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#D97706",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7ED",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },
  bookingList: {
    gap: 14,
  },
  bookingCard: {
    borderRadius: 26,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bookingTopRow: {
    gap: 12,
  },
  bookingHeading: {
    gap: 5,
  },
  providerName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  metaLineText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
  badgeStack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  twoColumnGrid: {
    gap: 12,
    marginTop: 14,
  },
  infoPanel: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  plainInfoText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
    marginTop: 8,
  },
  plainInfoLabel: {
    fontWeight: "800",
    color: "#0F172A",
  },
  reportPanel: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reportText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
    marginTop: 6,
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  footerCopy: {
    gap: 4,
  },
  footerMeta: {
    fontSize: 12,
    color: "#64748B",
  },
  footerMetaLabel: {
    fontWeight: "800",
    color: "#0F172A",
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  secondaryButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#F1F5F9",
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  dangerButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#FEE2E2",
  },
  dangerButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B91C1C",
  },
  disabledStatusPill: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#E2E8F0",
  },
  disabledStatusPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  reasonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  reasonChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#F1F5F9",
  },
  reasonChipActive: {
    backgroundColor: "#0F172A",
  },
  reasonChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  reasonChipTextActive: {
    color: "#FFFFFF",
  },
  descriptionInput: {
    minHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontSize: 14,
    color: "#0F172A",
  },
  reportErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#B91C1C",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    backgroundColor: "#F1F5F9",
  },
  modalSecondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    backgroundColor: "#0F172A",
  },
  modalPrimaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
