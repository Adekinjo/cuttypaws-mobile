import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ServiceBookingService from "../../api/ServiceBookingService";
import keyValueStorage from "../../utils/keyValueStorage";

type Props = {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
};

export default function ServiceBookingSuccess({ onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Confirming your booking payment...");
  const [booking, setBooking] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let active = true;

    const confirmBooking = async () => {
      try {
        const pendingRaw = await keyValueStorage.getItem("pendingServiceBooking");
        const pendingBooking = pendingRaw ? JSON.parse(pendingRaw) : null;

        if (!pendingBooking?.paymentReference) {
          throw new Error("Booking payment reference not found.");
        }

        const response = await ServiceBookingService.confirmBookingPayment(
          pendingBooking.paymentReference
        );

        if (response?.status !== 200) {
          throw new Error(response?.message || "Booking confirmation failed.");
        }

        if (!active) return;

        setBooking(response?.serviceBooking || null);
        setMessage("Your booking has been confirmed successfully.");
        await keyValueStorage.removeItem("pendingServiceBooking");
      } catch (error: any) {
        if (!active) return;
        setMessage(error?.message || "Unable to confirm booking.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    confirmBooking();

    return () => {
      active = false;
    };
  }, []);

  const isSuccess = Boolean(booking);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.centerTitle}>Booking payment processing</Text>
          <Text style={styles.centerBody}>{message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Service Booking</Text>
          <Text style={styles.heroTitle}>Payment result</Text>
          <Text style={styles.heroBody}>
            We finished checking your service booking payment and updated the booking status.
          </Text>
        </View>

        <View style={styles.mainCard}>
          <View
            style={[
              styles.iconWrap,
              isSuccess ? styles.successIconWrap : styles.errorIconWrap,
            ]}
          >
            {isSuccess ? (
              <Feather name="check" size={30} color="#166534" />
            ) : (
              <MaterialCommunityIcons name="close-thick" size={28} color="#B91C1C" />
            )}
          </View>

          <Text style={[styles.resultTitle, isSuccess ? styles.successText : styles.errorText]}>
            {isSuccess ? "Booking Confirmed!" : "Booking Confirmation Failed"}
          </Text>

          <Text style={styles.resultMessage}>{message}</Text>

          {booking ? (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Booking Details</Text>

              <View style={styles.metaGrid}>
                <View style={styles.metaTile}>
                  <Text style={styles.metaLabel}>Business</Text>
                  <Text style={styles.metaValue}>
                    {booking.businessName || booking.providerName || "Service Provider"}
                  </Text>
                </View>
                <View style={styles.metaTile}>
                  <Text style={styles.metaLabel}>Service</Text>
                  <Text style={styles.metaValue}>{booking.serviceType || "Not specified"}</Text>
                </View>
                <View style={styles.metaTile}>
                  <Text style={styles.metaLabel}>Pet</Text>
                  <Text style={styles.metaValue}>{booking.petName || "N/A"}</Text>
                </View>
                <View style={styles.metaTile}>
                  <Text style={styles.metaLabel}>Amount</Text>
                  <Text style={styles.metaValue}>
                    {booking.amount != null ? `$${booking.amount}` : "N/A"}
                  </Text>
                </View>
                <View style={styles.metaTile}>
                  <Text style={styles.metaLabel}>Payment Reference</Text>
                  <Text style={styles.metaValue}>{booking.paymentReference || "N/A"}</Text>
                </View>
                <View style={styles.metaTile}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <Text style={styles.metaValue}>{booking.bookingStatus || "Unknown"}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.actionStack}>
            {booking ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => onNavigate?.("my-service-bookings")}
              >
                <Text style={styles.primaryButtonText}>View My Bookings</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.secondaryButton} onPress={() => onNavigate?.("home")}>
              <Text style={styles.secondaryButtonText}>Go Home</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconWrap: {
    backgroundColor: "#DCFCE7",
  },
  errorIconWrap: {
    backgroundColor: "#FEE2E2",
  },
  resultTitle: {
    marginTop: 16,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
  },
  successText: {
    color: "#166534",
  },
  errorText: {
    color: "#B91C1C",
  },
  resultMessage: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
  },
  detailsCard: {
    width: "100%",
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    padding: 16,
  },
  detailsTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#166534",
    marginBottom: 12,
  },
  metaGrid: {
    gap: 10,
  },
  metaTile: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    color: "#0F172A",
    fontWeight: "800",
  },
  actionStack: {
    width: "100%",
    marginTop: 20,
    gap: 10,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "800",
  },
});
