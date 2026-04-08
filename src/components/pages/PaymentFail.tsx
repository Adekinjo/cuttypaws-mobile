import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Footer from "../../components/common/Footer";

export default function PaymentFailPage({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const handleRetryPayment = () => {
    onNavigate?.("cart-view");
  };

  const handleGoHome = () => {
    onNavigate?.("home");
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
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#7F1D1D" />
            <Text style={styles.heroBadgeText}>Payment failed</Text>
          </View>

          <Text style={styles.heroTitle}>Your payment did not go through</Text>
          <Text style={styles.heroSubtitle}>
            The checkout could not be completed. Review the issue below, then retry payment or
            contact support if the problem continues.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Feather name="x" size={34} color="#991B1B" />
          </View>

          <Text style={styles.statusTitle}>Payment unsuccessful</Text>
          <Text style={styles.statusBody}>
            We were unable to process your payment. Your order was not completed, and you can
            safely try again from the cart.
          </Text>

          <View style={styles.actionColumn}>
            <Pressable style={styles.primaryButton} onPress={handleRetryPayment}>
              <Text style={styles.primaryButtonText}>Retry Payment</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleGoHome}>
              <Text style={styles.secondaryButtonText}>Go Home</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.reasonCard}>
          <Text style={styles.sectionTitle}>What could have happened</Text>

          <ReasonRow
            icon="alert-circle"
            title="Insufficient funds"
            body="The card or payment method may not have had enough balance to complete the charge."
          />
          <ReasonRow
            icon="credit-card"
            title="Incorrect payment details"
            body="A mismatch in card details, expiration date, CVV, or billing information can stop checkout."
          />
          <ReasonRow
            icon="wifi-off"
            title="Network interruption"
            body="Temporary connection issues between the app, gateway, or bank can interrupt payment confirmation."
          />
          <ReasonRow
            icon="slash"
            title="Transaction declined"
            body="Your bank or payment provider may have blocked or declined the transaction for security reasons."
          />
        </View>

        <View style={styles.supportCard}>
          <Text style={styles.sectionTitle}>Need help?</Text>
          <Text style={styles.supportBody}>
            If payment keeps failing, contact support with the time of the attempt and the email
            used during checkout.
          </Text>

          <Pressable style={styles.supportButton} onPress={handleContactSupport}>
            <Ionicons name="headset-outline" size={18} color="#083344" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </Pressable>

          <View style={styles.emailPill}>
            <Feather name="mail" size={16} color="#0F766E" />
            <Text style={styles.emailText}>support@cuttypaws.com</Text>
          </View>
        </View>

        <Footer onNavigate={onNavigate} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ReasonRow({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.reasonRow}>
      <View style={styles.reasonIconWrap}>
        <Feather name={icon} size={18} color="#991B1B" />
      </View>
      <View style={styles.reasonContent}>
        <Text style={styles.reasonTitle}>{title}</Text>
        <Text style={styles.reasonBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F7",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#FFF7F7",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    gap: 14,
    backgroundColor: "#7F1D1D",
  },
  heroGlowOne: {
    position: "absolute",
    top: -26,
    right: -12,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(252,165,165,0.12)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -48,
    left: -18,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(254,202,202,0.1)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  heroBadgeText: {
    color: "#7F1D1D",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FEF2F2",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: "#FECACA",
    fontSize: 15,
    lineHeight: 22,
  },
  statusCard: {
    alignItems: "center",
    gap: 14,
    borderRadius: 26,
    padding: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  statusIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  statusTitle: {
    color: "#7F1D1D",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  statusBody: {
    color: "#7C2D12",
    lineHeight: 22,
    textAlign: "center",
  },
  actionColumn: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  secondaryButtonText: {
    color: "#991B1B",
    fontWeight: "900",
  },
  reasonCard: {
    borderRadius: 26,
    padding: 20,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reasonIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  reasonContent: {
    flex: 1,
    gap: 4,
  },
  reasonTitle: {
    color: "#7F1D1D",
    fontSize: 16,
    fontWeight: "800",
  },
  reasonBody: {
    color: "#64748B",
    lineHeight: 21,
  },
  supportCard: {
    borderRadius: 26,
    padding: 20,
    gap: 14,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  supportBody: {
    color: "#0F766E",
    lineHeight: 22,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "#99F6E4",
  },
  supportButtonText: {
    color: "#083344",
    fontWeight: "900",
  },
  emailPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCFBF1",
  },
  emailText: {
    color: "#0F766E",
    fontWeight: "800",
  },
});
