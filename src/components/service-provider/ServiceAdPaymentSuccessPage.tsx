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

import ServiceProviderService from "../../api/ServiceProviderService";

type Props = {
  paymentReference?: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
};

type ResultState = "loading" | "success" | "warning" | "error";

export default function ServiceAdPaymentSuccessPage({
  paymentReference,
  onNavigate,
}: Props) {
  const [state, setState] = useState<ResultState>("loading");
  const [message, setMessage] = useState("Verifying your advert payment...");
  const [subscription, setSubscription] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setState("loading");
        setMessage("Verifying your advert payment...");

        const subscriptionsResponse = await ServiceProviderService.getAdSubscriptions();
        const subscriptions = subscriptionsResponse?.serviceAdSubscriptions || [];

        const targetSubscription =
          subscriptions.find(
            (item: any) => paymentReference && item?.paymentReference === paymentReference
          ) ||
          subscriptions.find(
            (item: any) =>
              item?.paymentStatus === "PENDING" || item?.paymentStatus === "PAID"
          ) ||
          null;

        if (!targetSubscription?.paymentReference) {
          if (!active) return;
          setState("warning");
          setSubscription(null);
          setMessage("Payment completed, but no matching advert subscription was found.");
          return;
        }

        const confirmResponse = await ServiceProviderService.confirmAdPayment({
          paymentReference: targetSubscription.paymentReference,
        });

        if (!active) return;

        setSubscription(targetSubscription);

        if (confirmResponse?.status >= 400) {
          setState("error");
          setMessage(confirmResponse?.message || "Payment verification failed.");
          return;
        }

        setState("success");
        setMessage(confirmResponse?.message || "Advert payment confirmed successfully.");
      } catch (error: any) {
        if (!active) return;
        setState("error");
        setMessage(error?.response?.data?.message || error?.message || "Unable to verify advert payment.");
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [paymentReference]);

  const tone =
    state === "success"
      ? {
          bg: "#DCFCE7",
          fg: "#166534",
          icon: <Feather name="check" size={28} color="#166534" />,
          title: "Payment confirmed",
        }
      : state === "error"
        ? {
            bg: "#FEE2E2",
            fg: "#B91C1C",
            icon: <Feather name="x" size={28} color="#B91C1C" />,
            title: "Verification failed",
          }
        : state === "warning"
          ? {
              bg: "#FEF3C7",
              fg: "#92400E",
              icon: <MaterialCommunityIcons name="alert-circle-outline" size={30} color="#92400E" />,
              title: "Payment completed",
            }
          : {
              bg: "#DBEAFE",
              fg: "#1D4ED8",
              icon: <ActivityIndicator size="small" color="#1D4ED8" />,
              title: "Processing payment",
            };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Advert Promotion</Text>
          <Text style={styles.heroTitle}>Service advert payment</Text>
          <Text style={styles.heroBody}>
            Finalize your advert purchase and activate stronger visibility for your service profile.
          </Text>
        </View>

        <View style={styles.mainCard}>
          <View style={[styles.statusIconWrap, { backgroundColor: tone.bg }]}>
            {tone.icon}
          </View>
          <Text style={[styles.statusTitle, { color: tone.fg }]}>{tone.title}</Text>
          <Text style={styles.statusMessage}>{message}</Text>

          {subscription ? (
            <View style={styles.metaPanel}>
              <View style={styles.metaTile}>
                <Text style={styles.metaLabel}>Plan</Text>
                <Text style={styles.metaValue}>{subscription.planType || "Promotion plan"}</Text>
              </View>
              <View style={styles.metaTile}>
                <Text style={styles.metaLabel}>Reference</Text>
                <Text style={styles.metaValue}>{subscription.paymentReference || "Not available"}</Text>
              </View>
              <View style={styles.metaTile}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.metaValue}>{subscription.paymentStatus || "Unknown"}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.actionStack}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => onNavigate?.("service-ads")}
            >
              <Text style={styles.primaryButtonText}>Back to advert subscriptions</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => onNavigate?.("service-dashboard")}
            >
              <Text style={styles.secondaryButtonText}>Go to dashboard</Text>
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
  statusIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    marginTop: 16,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  statusMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    textAlign: "center",
  },
  metaPanel: {
    width: "100%",
    marginTop: 18,
    gap: 10,
  },
  metaTile: {
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
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
