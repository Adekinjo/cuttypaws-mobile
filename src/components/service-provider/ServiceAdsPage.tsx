import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import PaymentService from "../../api/PaymentService";
import ServiceProviderService from "../../api/ServiceProviderService";
import { presentMobilePaymentSheet } from "../../utils/paymentSheet";
import ActiveSubscriptionCard from "./ActiveSubscriptionCard";
import AdPlanCard from "./AdPlanCard";

const AD_PLAN_TYPES = [
  {
    value: "BASIC",
    label: "Basic Boost",
    durationDays: 7,
    price: 15,
    description: "A one-week visibility boost for new or quieter service profiles.",
  },
  {
    value: "BOOSTED",
    label: "Boosted Reach",
    durationDays: 14,
    price: 25,
    description: "Two weeks of improved placement to keep your profile in rotation.",
  },
  {
    value: "PREMIUM",
    label: "Premium Push",
    durationDays: 21,
    price: 40,
    description: "Extended promotion for providers who want steadier discovery momentum.",
  },
  {
    value: "FEATURED",
    label: "Featured Spotlight",
    durationDays: 30,
    price: 60,
    description: "Top-tier promotion with the longest campaign window and strongest visibility.",
  },
] as const;

type Props = {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
};

export default function ServiceAdsPage({ onNavigate }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<(typeof AD_PLAN_TYPES)[number]["value"]>(
    AD_PLAN_TYPES[0].value
  );
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedPlanData = useMemo(
    () => AD_PLAN_TYPES.find((plan) => plan.value === selectedPlan) || AD_PLAN_TYPES[0],
    [selectedPlan]
  );

  const loadSubscriptions = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [historyResponse, activeResponse] = await Promise.all([
        ServiceProviderService.getAdSubscriptions(),
        ServiceProviderService.getActiveAdSubscription(),
      ]);

      setSubscriptions(historyResponse?.serviceAdSubscriptions || []);
      setActiveSubscription(activeResponse?.serviceAdSubscription || null);
      setError("");
    } catch (loadError: any) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load advert subscriptions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleCreateSubscription = async () => {
    try {
      setCreating(true);
      setError("");
      setNotice("");

      const response = await ServiceProviderService.createAdSubscription({
        planType: selectedPlan,
      });

      if (!response || response.status >= 400) {
        throw new Error(response?.message || "Unable to create advert subscription.");
      }

      const subscription = response?.serviceAdSubscription || null;

      if (!subscription?.id) {
        throw new Error("Subscription was created but no subscription ID was returned.");
      }

      const userResponse = await AuthService.getLoggedInInfo();
      const user = userResponse?.user;

      if (!user?.id || !user?.email) {
        throw new Error("User not found. Please log in again.");
      }

      const paymentResponse = await PaymentService.initializeAdPayment(
        Number(subscription.amount || selectedPlanData.price || 0),
        "USD",
        user.email,
        user.id,
        subscription.id
      );

      await presentMobilePaymentSheet(paymentResponse);

      if (!paymentResponse.reference) {
        throw new Error("Advert payment reference was not returned.");
      }

      await PaymentService.waitForPaidStatus(paymentResponse.reference);
      await loadSubscriptions(true);
      await ServiceProviderService.refreshDashboard();

      setNotice("Advert payment completed successfully. Your promotion is now active.");
    } catch (createError: any) {
      setError(
        createError?.response?.data?.message ||
          createError?.message ||
          "Unable to create advert subscription."
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading && !subscriptions.length && !activeSubscription) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.centerTitle}>Loading advert subscriptions...</Text>
          <Text style={styles.centerBody}>
            Pulling your current promotion status and recent subscription history.
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
            onRefresh={() => loadSubscriptions(true)}
            tintColor="#1D4ED8"
          />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Service Advertising</Text>
          <Text style={styles.heroTitle}>Advert subscriptions</Text>
          <Text style={styles.heroBody}>
            Choose a promotion window, pay inside the app with Stripe Payment Sheet, and activate
            stronger visibility for your service profile.
          </Text>
        </View>

        {notice ? (
          <View style={[styles.banner, styles.successBanner]}>
            <Text style={styles.successBannerText}>{notice}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.banner, styles.errorBanner]}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Choose a plan</Text>
        <View style={styles.planGrid}>
          {AD_PLAN_TYPES.map((plan) => (
            <AdPlanCard
              key={plan.value}
              plan={plan}
              selected={selectedPlan === plan.value}
              onSelect={(value) =>
                setSelectedPlan(value as (typeof AD_PLAN_TYPES)[number]["value"])
              }
              disabled={creating}
            />
          ))}
        </View>

        <View style={styles.checkoutCard}>
          <Text style={styles.checkoutTitle}>Continue with {selectedPlanData.label}</Text>
          <Text style={styles.checkoutPrice}>${selectedPlanData.price.toFixed(2)}</Text>
          <Text style={styles.checkoutBody}>
            Payment stays inside the app. Once Stripe confirms the charge, the subscription updates
            automatically from the backend webhook.
          </Text>

          <Pressable
            style={[styles.primaryButton, creating && styles.buttonDisabled]}
            onPress={handleCreateSubscription}
            disabled={creating}
          >
            <Text style={styles.primaryButtonText}>
              {creating ? "Opening payment sheet..." : "Pay with Stripe"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Active promotion</Text>
        <ActiveSubscriptionCard subscription={activeSubscription} />

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Subscription history</Text>

          {!subscriptions.length ? (
            <Text style={styles.historyEmpty}>No advert subscriptions yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {subscriptions.map((subscription) => (
                <View key={String(subscription.id)} style={styles.historyRow}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyPlan}>{subscription.planType || "Plan"}</Text>
                    <Text style={styles.historyAmount}>
                      ${Number(subscription.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.historyMeta}>
                    {subscription.paymentStatus || "UNKNOWN"} •{" "}
                    {subscription.paymentReference || "No reference"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => onNavigate?.("services")}
        >
          <Text style={styles.secondaryButtonText}>Back to dashboard</Text>
        </Pressable>
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
    paddingBottom: 42,
    gap: 16,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: "#EEF4FF",
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
  banner: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  successBanner: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  successBannerText: {
    color: "#166534",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  errorBannerText: {
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#64748B",
    textTransform: "uppercase",
  },
  planGrid: {
    gap: 12,
  },
  checkoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
  },
  checkoutTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  checkoutPrice: {
    marginTop: 8,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  checkoutBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#375DFB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
  },
  historyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: "#0F172A",
  },
  historyEmpty: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  historyList: {
    marginTop: 14,
    gap: 12,
  },
  historyRow: {
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  historyPlan: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  historyMeta: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
});
