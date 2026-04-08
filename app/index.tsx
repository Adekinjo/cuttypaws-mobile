import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthService from "../src/api/AuthService";

export default function LandingPage() {
  useEffect(() => {
    let active = true;

    const redirectAuthenticatedUser = async () => {
      try {
        const authenticated = await AuthService.isAuthenticated();
        if (active && authenticated) {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("[LandingPage] Failed auth redirect check", error);
      }
    };

    redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroSection}>
          <Text style={styles.brand}>CuttyPaws</Text>
          <Text style={styles.title}>
            One app for pet social life, trusted services, and shopping.
          </Text>
          <Text style={styles.subtitle}>
            Share pet moments, discover providers, and shop essentials in one place.
          </Text>
        </View>

        <View style={styles.cardRow}>
          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>🐾</Text>
            <Text style={styles.featureTitle}>Social Feed</Text>
            <Text style={styles.featureText}>
              Post photos and videos, react, comment, and follow pet lovers.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>🩺</Text>
            <Text style={styles.featureTitle}>Pet Services</Text>
            <Text style={styles.featureText}>
              Find walkers, groomers, daycare, and more.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureEmoji}>🛍️</Text>
            <Text style={styles.featureTitle}>Marketplace</Text>
            <Text style={styles.featureText}>
              Explore products, save favorites, and shop with confidence.
            </Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Log In</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FBF9",
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#23B985",
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
    color: "#102A43",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: "#486581",
  },
  cardRow: {
    gap: 14,
    marginBottom: 28,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 26,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#102A43",
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5C6F82",
  },
  ctaSection: {
    gap: 12,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#23B985",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CFE9DF",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "700",
  },
});
