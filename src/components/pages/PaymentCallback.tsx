import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OrderService from "../../api/OrderService";
import PaymentService from "../../api/PaymentService";
import Footer from "../../components/common/Footer";
import { useCart } from "../../components/context/CartContext";
import keyValueStorage from "../../utils/keyValueStorage";

const PENDING_PAYMENT_KEY = "pendingPayment";

type PendingPayment = {
  paymentId?: string;
  reference?: string;
  cart?: Array<{
    id: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
  }>;
  totalPrice?: number;
};

type PaymentStage =
  | "processing"
  | "verifying"
  | "creating-order"
  | "success"
  | "failed";

export default function PaymentCallbackPage({
  reference,
  callbackUrl,
  onNavigate,
  onPaymentSuccess,
  onPaymentFailed,
}: {
  reference?: string | null;
  callbackUrl?: string | null;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onPaymentSuccess?: (payload: { orderId?: string | number; message: string }) => void;
  onPaymentFailed?: (payload: { message: string }) => void;
}) {
  const { dispatch } = useCart();
  const hasProcessedRef = useRef(false);

  const [stage, setStage] = useState<PaymentStage>("processing");
  const [message, setMessage] = useState("Preparing your payment callback...");
  const [orderId, setOrderId] = useState<string | number | null>(null);
  const [resolvedReference, setResolvedReference] = useState<string>("");
  const [paymentId, setPaymentId] = useState<string>("");

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const processPaymentCallback = async () => {
      let pendingPayment: PendingPayment | null = null;

      try {
        setStage("processing");
        setMessage("Looking up your payment reference...");

        const initialUrl = callbackUrl || (await Linking.getInitialURL()) || "";
        const params = initialUrl ? Linking.parse(initialUrl).queryParams || {} : {};
        const pendingRaw = await keyValueStorage.getItem(PENDING_PAYMENT_KEY);
        pendingPayment = pendingRaw ? (JSON.parse(pendingRaw) as PendingPayment) : null;

        const extractedReference = String(
          reference || params.reference || params.trxref || pendingPayment?.reference || ""
        ).trim();

        if (!extractedReference) {
          throw new Error("Payment reference not found.");
        }

        setResolvedReference(extractedReference);

        setStage("verifying");
        setMessage("Verifying payment with Stripe...");

        const verificationResponse = await PaymentService.getPaymentStatus(extractedReference);
        if (
          verificationResponse?.status !== 200 ||
          verificationResponse?.paymentStatus !== "PAID"
        ) {
          throw new Error(
            verificationResponse?.message || "Payment has not been confirmed yet."
          );
        }

        setMessage("Payment verified. Preparing your order...");

        if (!pendingPayment) {
          throw new Error("Pending payment details not found.");
        }

        const activePaymentId =
          verificationResponse?.paymentId ||
          pendingPayment.paymentId ||
          "";

        if (!activePaymentId) {
          throw new Error("Payment ID not found for order creation.");
        }

        if (
          !pendingPayment.cart?.length ||
          pendingPayment.totalPrice === undefined ||
          pendingPayment.totalPrice === null
        ) {
          throw new Error("Incomplete pending payment details.");
        }

        setPaymentId(activePaymentId);
        setStage("creating-order");
        setMessage("Creating your order and clearing checkout state...");

        const orderResponse = await OrderService.createOrderAfterPayment(
          activePaymentId,
          pendingPayment.cart,
          pendingPayment.totalPrice
        );

        if (orderResponse?.status && orderResponse.status !== 200) {
          throw new Error(orderResponse?.message || "Order creation failed.");
        }

        const nextOrderId = orderResponse?.orderId || orderResponse?.id || null;

        dispatch({ type: "CLEAR_CART" });
        await keyValueStorage.removeItem(PENDING_PAYMENT_KEY);

        setOrderId(nextOrderId);
        setStage("success");
        setMessage("Your payment is confirmed and the order has been created successfully.");

        onPaymentSuccess?.({
          orderId: nextOrderId,
          message: "Your order has been placed successfully.",
        });
      } catch (error: any) {
        console.error("[PaymentCallbackPage] Payment callback error", error);
        setStage("failed");
        setMessage(error?.message || "Payment processing failed.");
        await keyValueStorage.removeItem(PENDING_PAYMENT_KEY);
        onPaymentFailed?.({
          message: error?.message || "Payment processing failed.",
        });
      }
    };

    processPaymentCallback();
  }, [callbackUrl, dispatch, onPaymentFailed, onPaymentSuccess, reference]);

  const progress = useMemo(() => {
    if (stage === "processing") return 18;
    if (stage === "verifying") return 52;
    if (stage === "creating-order") return 82;
    if (stage === "success") return 100;
    return 100;
  }, [stage]);

  const statusTone = stage === "failed" ? "failed" : stage === "success" ? "success" : "active";

  const handleGoHome = () => {
    onNavigate?.("home");
  };

  const handleRetryPayment = () => {
    onNavigate?.("cart-view");
  };

  const handleViewOrders = () => {
    onNavigate?.("orders");
  };

  const handleContactSupport = () => {
    onNavigate?.("customer-support");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroBadge}>
            <MaterialCommunityIcons
              name={stage === "failed" ? "close-circle-outline" : "credit-card-check-outline"}
              size={16}
              color="#0F172A"
            />
            <Text style={styles.heroBadgeText}>Payment callback</Text>
          </View>

          <Text style={styles.heroTitle}>
            {stage === "success"
              ? "Payment completed"
              : stage === "failed"
                ? "Payment could not be completed"
                : "Finishing checkout"}
          </Text>

          <Text style={styles.heroSubtitle}>
            {stage === "success"
              ? "Your payment has been confirmed and your order is now in the system."
              : stage === "failed"
                ? "Something interrupted the verification or order creation flow."
                : "Please wait while we verify the payment and create the order for your cart."}
          </Text>

          <View style={styles.progressRail}>
            <View
              style={[
                styles.progressFill,
                statusTone === "failed" && styles.progressFillFailed,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <View style={styles.progressLabels}>
            <StagePill label="Verify" active={progress >= 20} failed={statusTone === "failed"} />
            <StagePill label="Create Order" active={progress >= 70} failed={statusTone === "failed"} />
            <StagePill label="Complete" active={progress === 100} failed={statusTone === "failed"} />
          </View>
        </View>

        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIconWrap,
              stage === "success" && styles.statusIconSuccess,
              stage === "failed" && styles.statusIconFailed,
            ]}
          >
            {stage === "success" ? (
              <Feather name="check" size={30} color="#065F46" />
            ) : stage === "failed" ? (
              <Feather name="x" size={30} color="#991B1B" />
            ) : (
              <ActivityIndicator size="large" color="#0F766E" />
            )}
          </View>

          <Text style={styles.statusTitle}>
            {stage === "success"
              ? "Order confirmed"
              : stage === "failed"
                ? "Payment failed"
                : "Payment processing"}
          </Text>

          <Text style={styles.statusMessage}>{message}</Text>

          <View style={styles.metaGrid}>
            <MetaTile
              label="Reference"
              value={resolvedReference || "Unavailable"}
              icon="hash"
            />
            <MetaTile
              label="Payment ID"
              value={paymentId || "Pending"}
              icon="credit-card"
            />
            <MetaTile
              label="Order ID"
              value={orderId ? String(orderId) : stage === "success" ? "Created" : "Pending"}
              icon="shopping-bag"
            />
            <MetaTile
              label="Status"
              value={
                stage === "success"
                  ? "Success"
                  : stage === "failed"
                    ? "Failed"
                    : "In progress"
              }
              icon="activity"
            />
          </View>
        </View>

        {stage === "success" ? (
          <View style={styles.successCard}>
            <Text style={styles.sectionTitle}>What happens next</Text>
            <InfoRow text="Your cart has been cleared to prevent duplicate checkout." />
            <InfoRow text="Your order is saved and should appear in your order history." />
            <InfoRow text="You can continue shopping or open your orders to track fulfillment." />

            <View style={styles.actionColumn}>
              <Pressable style={styles.primaryButton} onPress={handleViewOrders}>
                <Text style={styles.primaryButtonText}>View Orders</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {stage === "failed" ? (
          <View style={styles.failedCard}>
            <Text style={styles.sectionTitleDark}>Possible reasons</Text>
            <InfoRowDark text="The payment reference was missing or invalid." />
            <InfoRowDark text="Payment verification failed or returned an unexpected status." />
            <InfoRowDark text="Pending checkout details were missing before order creation." />

            <View style={styles.actionColumn}>
              <Pressable style={styles.primaryDangerButton} onPress={handleRetryPayment}>
                <Text style={styles.primaryButtonText}>Retry Payment</Text>
              </Pressable>
              <Pressable style={styles.ghostButton} onPress={handleContactSupport}>
                <Text style={styles.ghostButtonText}>Contact Support</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {stage !== "success" && stage !== "failed" ? (
          <View style={styles.processingCard}>
            <Text style={styles.sectionTitle}>Please keep this screen open</Text>
            <Text style={styles.processingText}>
              We are verifying the provider response, matching the payment record, and creating
              the order from your saved checkout payload.
            </Text>
          </View>
        ) : null}

        <Footer onNavigate={(route) => onNavigate?.(route)} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StagePill({
  label,
  active,
  failed,
}: {
  label: string;
  active: boolean;
  failed?: boolean;
}) {
  return (
    <View style={[styles.stagePill, active && styles.stagePillActive, failed && styles.stagePillFailed]}>
      <Text
        style={[
          styles.stagePillText,
          active && styles.stagePillTextActive,
          failed && styles.stagePillTextFailed,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function MetaTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.metaTile}>
      <View style={styles.metaTileIcon}>
        <Feather name={icon} size={16} color="#0F766E" />
      </View>
      <Text style={styles.metaTileLabel}>{label}</Text>
      <Text style={styles.metaTileValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({ text }: { text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name="checkmark-circle" size={18} color="#0F766E" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function InfoRowDark({ text }: { text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name="alert-circle" size={18} color="#FCA5A5" />
      <Text style={styles.infoTextDark}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#F5FAF8",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    gap: 16,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -28,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -46,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(20,184,166,0.14)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#CCFBF1",
  },
  heroBadgeText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    lineHeight: 22,
    fontSize: 15,
  },
  progressRail: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2DD4BF",
  },
  progressFillFailed: {
    backgroundColor: "#F87171",
  },
  progressLabels: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  stagePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stagePillActive: {
    backgroundColor: "#CCFBF1",
  },
  stagePillFailed: {
    backgroundColor: "#FEE2E2",
  },
  stagePillText: {
    color: "#CBD5E1",
    fontWeight: "800",
    fontSize: 12,
  },
  stagePillTextActive: {
    color: "#0F172A",
  },
  stagePillTextFailed: {
    color: "#991B1B",
  },
  statusCard: {
    alignItems: "center",
    gap: 14,
    padding: 22,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  statusIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
  },
  statusIconSuccess: {
    backgroundColor: "#D1FAE5",
  },
  statusIconFailed: {
    backgroundColor: "#FEE2E2",
  },
  statusTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  statusMessage: {
    color: "#486581",
    lineHeight: 22,
    textAlign: "center",
  },
  metaGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaTile: {
    width: "47%",
    minWidth: 148,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  metaTileIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  metaTileLabel: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  metaTileValue: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  successCard: {
    borderRadius: 26,
    padding: 20,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  failedCard: {
    borderRadius: 26,
    padding: 20,
    gap: 14,
    backgroundColor: "#7F1D1D",
  },
  processingCard: {
    borderRadius: 26,
    padding: 20,
    gap: 10,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
  },
  sectionTitleDark: {
    color: "#FEE2E2",
    fontSize: 22,
    fontWeight: "900",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: "#334E68",
    lineHeight: 21,
  },
  infoTextDark: {
    flex: 1,
    color: "#FECACA",
    lineHeight: 21,
  },
  actionColumn: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  primaryDangerButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  secondaryButtonText: {
    color: "#0F766E",
    fontWeight: "900",
  },
  ghostButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(254,202,202,0.25)",
  },
  ghostButtonText: {
    color: "#FEE2E2",
    fontWeight: "900",
  },
  processingText: {
    color: "#0F766E",
    lineHeight: 22,
  },
});
