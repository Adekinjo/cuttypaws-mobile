import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Footer from "../common/Footer";
import ChoiceFeatureList from "../service-provider/ChoiceFeatureList";
import ServiceChoiceHeroIllustration from "../service-provider/ServiceChoiceHeroIllustration";
import { SERVICE_TYPES } from "../../utils/serviceProvider";

const featuredServices = [
  "PET_WALKER",
  "GROOMER",
  "VETERINARIAN",
  "PET_SITTER",
  "PET_DAYCARE",
  "PET_TRAINER",
];

export default function RegisterServiceChoicePage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const handleServiceSelect = (serviceType: string) => {
    onNavigate?.("service-provider/register", { serviceType });
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
            <MaterialCommunityIcons name="briefcase-plus-outline" size={16} color="#0F172A" />
            <Text style={styles.heroBadgeText}>Register your business</Text>
          </View>

          <Text style={styles.heroTitle}>Choose how you want to join CuttyPaws</Text>
          <Text style={styles.heroSubtitle}>
            Pick the onboarding path that matches your business. Sellers can open a storefront,
            while service providers can register for care, wellness, training, and support roles.
          </Text>

          <ServiceChoiceHeroIllustration />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Marketplace</Text>
          <Text style={styles.sectionTitle}>Seller</Text>
          <Text style={styles.sectionBody}>
            Open a product storefront to sell pet goods, accessories, food, toys, and daily care
            supplies in the marketplace.
          </Text>

          <ChoiceFeatureList
            items={[
              "Set up a storefront for product-based sales.",
              "Manage inventory, orders, and product visibility.",
              "Reach pet owners already browsing the marketplace.",
            ]}
          />

          <Pressable
            style={[styles.primaryButton, styles.sellerButton]}
            onPress={() => onNavigate?.("seller-register-page")}
          >
            <Text style={styles.primaryButtonText}>Continue to Seller Registration</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Service Provider</Text>
          <Text style={styles.sectionTitle}>Pet Services</Text>
          <Text style={styles.sectionBody}>
            Apply as a provider such as a pet walker, groomer, vet, daycare business, boarder, or
            trainer. Start with a featured service or view the full registration flow.
          </Text>

          <View style={styles.serviceTagWrap}>
            {SERVICE_TYPES.filter((item: any) => featuredServices.includes(item.value)).map(
              (service: any) => (
                <Pressable
                  key={service.value}
                  style={styles.serviceTag}
                  onPress={() => handleServiceSelect(service.value)}
                >
                  <Text style={styles.serviceTagText}>{service.label}</Text>
                </Pressable>
              )
            )}
          </View>

          <Pressable
            style={[styles.primaryButton, styles.serviceButton]}
            onPress={() => onNavigate?.("service-provider/register")}
          >
            <Text style={styles.primaryButtonText}>View All Service Provider Options</Text>
          </Pressable>
        </View>

        <View style={styles.footerActionsCard}>
          <Pressable style={styles.linkRow} onPress={() => onNavigate?.("register")}>
            <Feather name="arrow-left" size={16} color="#0F766E" />
            <Text style={styles.linkText}>Back to personal account registration</Text>
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => onNavigate?.("login")}>
            <Feather name="log-in" size={16} color="#0F766E" />
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </Pressable>
        </View>

        <Footer onNavigate={(route) => onNavigate?.(route)} />
      </ScrollView>
    </SafeAreaView>
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
    top: -30,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(45,212,191,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -42,
    left: -24,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.14)",
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
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  sectionEyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
  },
  sectionBody: {
    color: "#486581",
    lineHeight: 22,
  },
  serviceTagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  serviceTag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  serviceTagText: {
    color: "#0F766E",
    fontWeight: "800",
    fontSize: 12,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerButton: {
    backgroundColor: "#0F766E",
  },
  serviceButton: {
    backgroundColor: "#1D4ED8",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },
  footerActionsCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkText: {
    color: "#0F766E",
    fontWeight: "800",
    lineHeight: 20,
    flex: 1,
  },
});
