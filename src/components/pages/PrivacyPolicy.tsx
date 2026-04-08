import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Footer from "../common/Footer";

const policySections = [
  {
    title: "1. Information We Collect",
    body:
      "We may collect personal information such as your name, email address, phone number, and payment details when you create an account, place an order, or contact us.",
    icon: "database",
  },
  {
    title: "2. How We Use Your Information",
    body:
      "We use your information to process orders, provide customer support, improve our services, and send promotional offers when you choose to receive them.",
    icon: "target",
  },
  {
    title: "3. Sharing Your Information",
    body:
      "We do not sell your personal information. We only share data with service providers such as shipping partners and payment processors when that is necessary to fulfill your order.",
    icon: "share-2",
  },
  {
    title: "4. Data Security",
    body:
      "We use encryption and standard security practices to protect your data. No internet transmission method is perfectly secure, so protection is strong but never absolute.",
    icon: "shield",
  },
  {
    title: "5. Your Rights",
    body:
      "You may request access to, updates to, or deletion of your personal information. You can also opt out of promotional communications.",
    icon: "user-check",
  },
  {
    title: "6. Cookies",
    body:
      "We use cookies and similar technologies to improve browsing, remember preferences, and support core platform functionality. Disabling them may affect parts of the experience.",
    icon: "circle",
  },
  {
    title: "7. Changes to This Policy",
    body:
      "We may update this policy from time to time. When we do, the updated version should be reviewed so you understand the current terms.",
    icon: "refresh-cw",
  },
  {
    title: "8. Contact Us",
    body:
      "If you have any privacy-related questions, reach out to the support team and include enough detail for a faster review.",
    icon: "mail",
  },
];

export default function PrivacyPolicyPage({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const handleEmail = () => {
    Linking.openURL("mailto:privacy@example.com");
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
            <MaterialCommunityIcons name="shield-account-outline" size={16} color="#0F172A" />
            <Text style={styles.heroBadgeText}>Privacy policy</Text>
          </View>

          <Text style={styles.heroTitle}>Your data deserves plain language</Text>
          <Text style={styles.heroSubtitle}>
            This screen explains what information is collected, how it is used, when it is shared,
            and what control users have over their personal data.
          </Text>

          <View style={styles.heroStatsRow}>
            <InfoChip label="8 sections" />
            <InfoChip label="User rights" />
            <InfoChip label="Security basics" />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <SummaryRow text="Information is collected to support accounts, orders, support, and platform improvement." />
          <SummaryRow text="Data is shared only when needed for operations such as shipping and payment processing." />
          <SummaryRow text="Users can request updates, deletion, and changes to marketing preferences." />
        </View>

        <View style={styles.policyList}>
          {policySections.map((section) => (
            <View key={section.title} style={styles.policyCard}>
              <View style={styles.policyHeader}>
                <View style={styles.policyIconWrap}>
                  <Feather name={section.icon as keyof typeof Feather.glyphMap} size={18} color="#0F766E" />
                </View>
                <Text style={styles.policyTitle}>{section.title}</Text>
              </View>
              <Text style={styles.policyBody}>{section.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Need clarification?</Text>
          <Text style={styles.contactBody}>
            Privacy questions should go to the team with enough context to identify the request
            quickly and respond accurately.
          </Text>

          <Pressable style={styles.contactButton} onPress={handleEmail}>
            <Feather name="mail" size={18} color="#083344" />
            <Text style={styles.contactButtonText}>privacy@example.com</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => onNavigate?.("customer-support")}>
            <Text style={styles.secondaryButtonText}>Open Support</Text>
          </Pressable>
        </View>

        <Footer onNavigate={onNavigate} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

function SummaryRow({ text }: { text: string }) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryDot} />
      <Text style={styles.summaryText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8FC",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#F4F8FC",
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
    right: -12,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -42,
    left: -20,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(45,212,191,0.14)",
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
    fontSize: 15,
    lineHeight: 22,
  },
  heroStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  infoChipText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryCard: {
    borderRadius: 26,
    padding: 20,
    gap: 14,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  summaryDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: "#0F766E",
  },
  summaryText: {
    flex: 1,
    color: "#0F766E",
    lineHeight: 21,
  },
  policyList: {
    gap: 14,
  },
  policyCard: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  policyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  policyTitle: {
    flex: 1,
    color: "#102A43",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  policyBody: {
    color: "#486581",
    lineHeight: 22,
  },
  contactCard: {
    borderRadius: 26,
    padding: 20,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  contactBody: {
    color: "#486581",
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "#99F6E4",
  },
  contactButtonText: {
    color: "#083344",
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
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#102A43",
    fontWeight: "900",
  },
});
