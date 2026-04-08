import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const features = [
  { icon: "🚚", title: "Fast Delivery", text: "Swift and reliable shipping to your doorstep." },
  { icon: "🔒", title: "Secure Payments", text: "Protected checkout and trusted payment handling." },
  { icon: "🎧", title: "24/7 Support", text: "Support is available whenever customers need help." },
  { icon: "↩️", title: "Easy Returns", text: "A smoother return process when something is not right." },
  { icon: "🏷️", title: "Daily Offers", text: "Fresh deals and value-led offers across categories." },
  { icon: "🎁", title: "Rewards Program", text: "Shopping activity turns into long-term customer value." },
];

const values = [
  { icon: "🐾", title: "Pet First", text: "Everything is designed around better outcomes for pets and their owners." },
  { icon: "🤝", title: "Community", text: "We connect pet owners, trusted sellers, and useful services in one platform." },
  { icon: "💡", title: "Innovation", text: "The product keeps evolving to make pet shopping and care simpler." },
  { icon: "🌿", title: "Sustainability", text: "We aim for more responsible decisions in operations and partnerships." },
  { icon: "📈", title: "Growth", text: "We help customers discover better products and help businesses grow responsibly." },
  { icon: "⚖️", title: "Integrity", text: "Trust, transparency, and consistency matter across the full marketplace experience." },
];

export default function AboutUs({
  onOpenAchievements,
  onWatchVideo,
}: {
  onOpenAchievements?: () => void;
  onWatchVideo?: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroVisual}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>CuttyPaws</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>About the platform</Text>
          <Text style={styles.heroTitle}>A social commerce home for pet owners</Text>
          <Text style={styles.heroText}>
            CuttyPaws brings together shopping, discovery, community, and trusted pet-focused
            services. The goal is simple: make pet life easier, warmer, and more connected.
          </Text>

          <View style={styles.heroActions}>
            <Pressable style={styles.primaryButton} onPress={onOpenAchievements}>
              <Text style={styles.primaryButtonText}>Our Achievements</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onWatchVideo}>
              <Text style={styles.secondaryButtonText}>Watch Video</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <SectionHeader
        eyebrow="Why choose us"
        title="Built for a better pet marketplace"
        subtitle="The web page highlights core shopping strengths. This mobile version keeps those themes but presents them in a cleaner, more intentional way."
      />

      <View style={styles.grid}>
        {features.map((item) => (
          <View key={item.title} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.storyCard}>
        <View style={styles.storyCopy}>
          <Text style={styles.sectionEyebrowDark}>Our Story</Text>
          <Text style={styles.storyTitle}>From a simple idea to a growing pet ecosystem</Text>
          <Text style={styles.storyText}>
            CuttyPaws started with the belief that pet owners needed more than a store. They needed
            a place to discover quality products, connect with fellow animal lovers, and access
            dependable services without bouncing between disconnected platforms.
          </Text>
          <Text style={styles.storyText}>
            That idea grew into a mobile-first experience where commerce, care, and community can
            coexist in one product.
          </Text>
        </View>

        <View style={styles.storyStats}>
          <StatBox value="1M+" label="Pet owners reached" />
          <StatBox value="50+" label="Communities and markets served" />
        </View>
      </View>

      <SectionHeader
        eyebrow="Core values"
        title="What drives CuttyPaws"
        subtitle="These principles shape how the marketplace is built, how sellers show up, and how customers experience the platform."
      />

      <View style={styles.grid}>
        {values.map((item) => (
          <View key={item.title} style={styles.valueCard}>
            <Text style={styles.valueIcon}>{item.icon}</Text>
            <Text style={styles.valueTitle}>{item.title}</Text>
            <Text style={styles.valueText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 18,
    backgroundColor: "#EEF3F8",
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    gap: 18,
    backgroundColor: "#0F172A",
    overflow: "hidden",
  },
  heroVisual: {
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heroOrbLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "#1D4ED8",
    opacity: 0.35,
  },
  heroOrbSmall: {
    position: "absolute",
    right: 30,
    top: 18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F59E0B",
    opacity: 0.8,
  },
  heroBadge: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroCopy: {
    gap: 10,
  },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroText: {
    color: "#D9E2EC",
    lineHeight: 22,
    fontSize: 15,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 6,
  },
  primaryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  sectionHeader: {
    gap: 6,
  },
  sectionEyebrow: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 26,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#64748B",
    lineHeight: 21,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featureCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    color: "#102A43",
    fontWeight: "800",
    fontSize: 16,
  },
  featureText: {
    color: "#64748B",
    lineHeight: 20,
    fontSize: 13,
  },
  storyCard: {
    backgroundColor: "#1D4ED8",
    borderRadius: 26,
    padding: 20,
    gap: 18,
  },
  storyCopy: {
    gap: 10,
  },
  sectionEyebrowDark: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  storyTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  storyText: {
    color: "#E0E7FF",
    lineHeight: 22,
  },
  storyStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  statValue: {
    color: "#1D4ED8",
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: "#475569",
    lineHeight: 18,
  },
  valueCard: {
    width: "47%",
    borderRadius: 20,
    padding: 16,
    gap: 10,
    backgroundColor: "#102A43",
  },
  valueIcon: {
    fontSize: 24,
  },
  valueTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  valueText: {
    color: "#CBD5E1",
    lineHeight: 20,
    fontSize: 13,
  },
});
