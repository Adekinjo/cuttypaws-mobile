import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const stats = [
  { value: "1M+", label: "Customers" },
  { value: "500K+", label: "Products" },
  { value: "Global", label: "Reach" },
];

const features = [
  {
    title: "Powerful Dashboard",
    text: "Track performance, sales, and store activity from one place.",
  },
  {
    title: "Smart Inventory",
    text: "Manage stock levels and product updates with less manual work.",
  },
  {
    title: "Instant Payments",
    text: "Move from order to payout with a fast and reliable payment flow.",
  },
  {
    title: "Seller Protection",
    text: "Operate with fraud checks, support coverage, and safer transactions.",
  },
  {
    title: "Growth Tools",
    text: "Use promotions, analytics, and insights to grow revenue over time.",
  },
  {
    title: "Mobile App",
    text: "Manage your business on the go from a phone-first workflow.",
  },
  {
    title: "Low Fees",
    text: "Competitive commission rates designed for sustainable selling.",
  },
  {
    title: "24/7 Support",
    text: "Reach support whenever you need help with your store operations.",
  },
  {
    title: "Logistics",
    text: "Work with delivery and order fulfillment flows built for scale.",
  },
  {
    title: "Innovative Tools",
    text: "Use better tooling to launch, test, and improve product listings.",
  },
  {
    title: "Easy Setup",
    text: "Get onboarded quickly without a complicated seller setup process.",
  },
  {
    title: "Verified Buyers",
    text: "Sell to trusted buyers with stronger marketplace confidence.",
  },
];

export default function LandingPage({
  onRegister,
}: {
  onRegister?: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>CP</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>CuttyPaws Seller Hub</Text>
            <Text style={styles.brandSubtitle}>Marketplace Growth Platform</Text>
          </View>
        </View>

        <Pressable style={styles.topButton} onPress={onRegister}>
          <Text style={styles.topButtonText}>Become a Seller</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Sell smarter on mobile</Text>
          <Text style={styles.heroTitle}>
            Grow your business with{" "}
            <Text style={styles.heroAccent}>CuttyPaws</Text>
          </Text>
          <Text style={styles.heroText}>
            Join a modern marketplace, reach more buyers, and manage your store
            with a mobile-first seller workflow built for speed.
          </Text>
          <Pressable style={styles.primaryButton} onPress={onRegister}>
            <Text style={styles.primaryButtonText}>Start Selling Today</Text>
          </Pressable>
        </View>

        <View style={styles.heroVisual}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroPanel}>
            <Text style={styles.heroPanelKicker}>Seller Snapshot</Text>
            <Text style={styles.heroPanelTitle}>Operate from one place</Text>
            <Text style={styles.heroPanelText}>
              Listings, orders, payments, and performance all live inside the
              same seller experience.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Why choose <Text style={styles.sectionAccent}>CuttyPaws</Text>?
        </Text>
        <Text style={styles.sectionText}>
          Everything the web seller page promises is carried into mobile here:
          visibility, control, fast management, and growth support.
        </Text>
      </View>

      <View style={styles.featureGrid}>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureCard}>
            <View style={styles.featureIconStub} />
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.ctaSection}>
        <Text style={styles.ctaEyebrow}>Ready to boost your sales?</Text>
        <Text style={styles.ctaTitle}>Join our seller community today</Text>
        <Text style={styles.ctaText}>
          Create your seller account and start listing products with a mobile
          experience that mirrors the intent of the web seller hub.
        </Text>
        <Pressable style={styles.ctaButton} onPress={onRegister}>
          <Text style={styles.ctaButtonText}>Get Started Now</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 18,
    backgroundColor: "#EFF4FA",
  },
  topBar: {
    backgroundColor: "#2563EB",
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF22",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  brandTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
  },
  brandSubtitle: {
    color: "#DBEAFE",
    fontSize: 13,
  },
  topButton: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  topButtonText: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    gap: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroCopy: {
    gap: 10,
  },
  eyebrow: {
    color: "#2563EB",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: "#0F172A",
  },
  heroAccent: {
    color: "#2563EB",
  },
  heroText: {
    color: "#475569",
    lineHeight: 22,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  heroVisual: {
    position: "relative",
    minHeight: 180,
    justifyContent: "center",
  },
  heroCircleLarge: {
    position: "absolute",
    right: 8,
    top: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#DBEAFE",
  },
  heroPanel: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 18,
    width: "82%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroPanelKicker: {
    color: "#93C5FD",
    fontWeight: "700",
    marginBottom: 6,
  },
  heroPanelTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 20,
    marginBottom: 8,
  },
  heroPanelText: {
    color: "#CBD5E1",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  statLabel: {
    color: "#64748B",
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#0F172A",
  },
  sectionAccent: {
    color: "#2563EB",
  },
  sectionText: {
    color: "#475569",
    lineHeight: 22,
  },
  featureGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  featureIconStub: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  featureText: {
    color: "#64748B",
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: "#2563EB",
    borderRadius: 26,
    padding: 22,
    gap: 10,
    marginBottom: 8,
  },
  ctaEyebrow: {
    color: "#DBEAFE",
    fontWeight: "800",
  },
  ctaTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 28,
    lineHeight: 34,
  },
  ctaText: {
    color: "#E0E7FF",
    lineHeight: 22,
  },
  ctaButton: {
    marginTop: 6,
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  ctaButtonText: {
    color: "#1D4ED8",
    fontWeight: "900",
  },
});
