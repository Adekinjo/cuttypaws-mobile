import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

const quickLinks = [
  { label: "Customer Support", route: "customer-support", icon: "🎧" },
  { label: "Privacy Policy", route: "privacy-policy", icon: "🛡️" },
  { label: "Shop Categories", route: "categories", icon: "📦" },
  { label: "About Us", route: "about-us", icon: "📍" },
  { label: "FAQs", route: "faqs", icon: "✉️" },
  { label: "Sell on CuttyPaws", route: "sellers-landing-page", icon: "🧑‍💼" },
];

const paymentMethods = ["Visa", "Mastercard", "Amex", "PayPal", "Paystack"];

const socialLinks = [
  { label: "Facebook", icon: "f", url: "https://www.facebook.com/share/1841FN7UDL/?mibextid=wwXIfr" },
  { label: "X", icon: "X", url: "https://x.com/CuttyPaws" },
  { label: "Instagram", icon: "◎", url: "https://www.instagram.com/cutty.paws" },
  { label: "TikTok", icon: "♪", url: "https://www.tiktok.com/@cuttypaws.com" },
  { label: "LinkedIn", icon: "in", url: "https://www.linkedin.com/in/cutty-paws-3b00603b6" },
];

export default function Footer({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>CP</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>CuttyPaws</Text>
            <Text style={styles.brandSubtitle}>Social commerce for pet lovers</Text>
          </View>
        </View>

        <Text style={styles.heroText}>
          CuttyPaws is a social and shopping space for pet owners. Discover trusted accessories,
          connect with fellow pet lovers, and shop essentials for happy pets.
        </Text>

        <View style={styles.paymentWrap}>
          {paymentMethods.map((method) => (
            <View key={method} style={styles.paymentChip}>
              <Text style={styles.paymentChipText}>{method}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.linkList}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.route}
              style={styles.linkRow}
              onPress={() => onNavigate?.(link.route)}
            >
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Pressable style={styles.contactRow} onPress={() => Linking.openURL("tel:+2348135072306")}>
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactText}>+234 813 507 2306</Text>
        </Pressable>
        <Pressable
          style={styles.contactRow}
          onPress={() => Linking.openURL("mailto:support@cuttypaws.com")}
        >
          <Text style={styles.contactIcon}>✉️</Text>
          <Text style={styles.contactText}>support@cuttypaws.com</Text>
        </Pressable>

        <Text style={styles.sectionSubtitle}>Follow Us</Text>
        <View style={styles.socialRow}>
          {socialLinks.map((social) => (
            <Pressable
              key={social.label}
              style={styles.socialButton}
              onPress={() => Linking.openURL(social.url)}
            >
              <Text style={styles.socialIcon}>{social.icon}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>
          © {new Date().getFullYear()} CuttyPaws. All rights reserved.
        </Text>
        <Text style={styles.bottomSubText}>Built for pet owners and animal lovers.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  brandText: {
    flex: 1,
    gap: 2,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "#94A3B8",
  },
  heroText: {
    color: "#CBD5E1",
    lineHeight: 21,
  },
  paymentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  paymentChipText: {
    color: "#E2E8F0",
    fontWeight: "700",
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#334E68",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  linkList: {
    gap: 10,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  linkIcon: {
    fontSize: 16,
  },
  linkText: {
    color: "#243B53",
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactIcon: {
    fontSize: 16,
  },
  contactText: {
    color: "#243B53",
    fontWeight: "700",
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  socialButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: {
    color: "#0F172A",
    fontWeight: "900",
  },
  bottomBar: {
    paddingTop: 8,
    gap: 4,
  },
  bottomText: {
    color: "#475569",
    fontWeight: "700",
    textAlign: "center",
  },
  bottomSubText: {
    color: "#64748B",
    textAlign: "center",
  },
});
