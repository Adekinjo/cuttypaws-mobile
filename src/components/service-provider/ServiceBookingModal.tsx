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

import AuthService from "../../api/AuthService";
import PaymentService from "../../api/PaymentService";
import ServiceBookingService from "../../api/ServiceBookingService";
import { presentMobilePaymentSheet } from "../../utils/paymentSheet";

const DEFAULT_TIMEZONE = "America/Chicago";

type ServiceProfile = {
  id?: string | number;
  businessName?: string;
  ownerName?: string;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const formatCurrency = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Contact for pricing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const combineDateTime = (date: string, time: string) => {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export default function ServiceBookingModal({
  visible,
  onClose,
  serviceProfile,
  defaultAmount = 0,
  onBookingCreated,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  serviceProfile?: ServiceProfile | null;
  defaultAmount?: number;
  onBookingCreated?: (booking: any) => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [formData, setFormData] = useState({
    petName: "",
    petType: "",
    serviceAddress: "",
    notes: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setFormData({
      petName: "",
      petType: "",
      serviceAddress: "",
      notes: "",
      bookingDate: "",
      startTime: "",
      endTime: "",
    });
    setError("");
    setSubmitting(false);
  }, [visible, serviceProfile?.id]);

  const amount = useMemo(() => {
    const numericAmount = Number(defaultAmount);
    return Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : 0;
  }, [defaultAmount]);

  function setField(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function handleSubmit() {
    const startsAt = combineDateTime(formData.bookingDate, formData.startTime);
    const endsAt = combineDateTime(formData.bookingDate, formData.endTime);

    if (!serviceProfile?.id) {
      setError("Service profile is not available for booking.");
      return;
    }
    if (!startsAt || !endsAt) {
      setError("Choose a valid booking date and time range.");
      return;
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("End time must be after start time.");
      return;
    }
    if (amount <= 0) {
      setError("This service does not have a valid booking amount yet.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        serviceProfileId: serviceProfile.id,
        startsAt,
        endsAt,
        amount,
        paymentPurpose: "SERVICE_BOOKING",
        petName: formData.petName.trim(),
        petType: formData.petType.trim(),
        serviceAddress: formData.serviceAddress.trim(),
        notes: formData.notes.trim(),
        timezone: DEFAULT_TIMEZONE,
      };

      const response = await ServiceBookingService.createBooking(payload);
      const bookingData =
        response?.serviceBooking || response?.data?.serviceBooking || null;

      if (!bookingData?.id) {
        throw new Error("Booking was created but no booking ID was returned.");
      }

      const userResponse = await AuthService.getLoggedInInfo();
      const user = userResponse?.user;

      const userId = String(user?.id || "").trim();
      const userEmail = String(user?.email || "").trim();

      if (!userId || !userEmail) {
        throw new Error("User not found. Please log in again.");
      }

      const paymentResponse = await PaymentService.initializeBookingPayment(
        amount,
        "USD",
        userEmail,
        userId,
        bookingData.id
      );

      await presentMobilePaymentSheet(paymentResponse);

      if (!paymentResponse.reference) {
        throw new Error("Booking payment reference was not returned.");
      }

      await PaymentService.waitForPaidStatus(paymentResponse.reference);

      onBookingCreated?.({
        ...bookingData,
        paymentReference: paymentResponse.reference,
      });

      setSubmitting(false);
      onClose();
      onNavigate?.("my-service-bookings");
      return;
    } catch (submitError: any) {
      console.error("[ServiceBookingModal] Booking creation failed:", submitError);
      setSubmitting(false);
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to create booking."
      );
      return;
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Book Service</Text>
              <Text style={styles.subtitle}>
                Booking with {serviceProfile?.businessName || serviceProfile?.ownerName || "Service Provider"}
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Estimated amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Field
              label="Pet Name"
              value={formData.petName}
              onChangeText={(value) => setField("petName", value)}
              placeholder="Enter your pet's name"
            />
            <Field
              label="Pet Type"
              value={formData.petType}
              onChangeText={(value) => setField("petType", value)}
              placeholder="Dog, Cat, Bird..."
            />
            <Field
              label="Service Address"
              value={formData.serviceAddress}
              onChangeText={(value) => setField("serviceAddress", value)}
              placeholder="Where should the service happen?"
            />
            <Field
              label="Date"
              value={formData.bookingDate}
              onChangeText={(value) => setField("bookingDate", value)}
              placeholder={`YYYY-MM-DD (from ${getTodayDate()})`}
            />
            <Field
              label="Start Time"
              value={formData.startTime}
              onChangeText={(value) => setField("startTime", value)}
              placeholder="HH:MM"
            />
            <Field
              label="End Time"
              value={formData.endTime}
              onChangeText={(value) => setField("endTime", value)}
              placeholder="HH:MM"
            />
            <Field
              label="Notes"
              value={formData.notes}
              onChangeText={(value) => setField("notes", value)}
              placeholder="Share anything the provider should know before the booking."
              multiline
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Book and Pay</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={[styles.input, multiline && styles.textarea]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 18,
    gap: 14,
  },
  amountCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#ECFEFF",
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  amountValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  errorBanner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FEE2E2",
  },
  errorBannerText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#991B1B",
    fontWeight: "700",
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102A43",
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
    color: "#102A43",
    fontSize: 14,
  },
  textarea: {
    minHeight: 120,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334E68",
  },
  primaryButton: {
    flex: 1.2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
