import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import Footer from "../common/Footer";
import PasswordHelpTips from "../security/PasswordHelpTips";
import PasswordResetHeroIllustration from "../security/PasswordResetHeroIllustration";

export default function RequestPasswordPage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [resetEmail, setResetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [submitting, setSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      setMessageTone("error");
      setMessage("Email is required.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await AuthService.requestPasswordReset(resetEmail.trim());

      if (response?.status === 200) {
        setMessageTone("success");
        setMessage("Password reset link sent to your email.");
        setResetEmail("");
      } else {
        setMessageTone("error");
        setMessage("Failed to send reset link.");
      }
    } catch (error: any) {
      setMessageTone("error");

      if (error?.response?.status === 404) {
        setMessage("User not found.");
      } else {
        setMessage(error?.message || "Unable to send reset link.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="lock-reset" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Password help</Text>
            </View>

            <Text style={styles.heroTitle}>Request a reset link</Text>
            <Text style={styles.heroSubtitle}>
              Enter the email linked to your CuttyPaws account and we will send you a password
              reset link so you can regain access securely.
            </Text>

            <PasswordResetHeroIllustration />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Reset your password</Text>
            <Text style={styles.sectionSubtitle}>
              Use the same email address you registered with.
            </Text>

            {message ? (
              <View
                style={[
                  styles.messageBanner,
                  messageTone === "success" && styles.messageBannerSuccess,
                  messageTone === "error" && styles.messageBannerError,
                ]}
              >
                <Feather
                  name={
                    messageTone === "success"
                      ? "check-circle"
                      : messageTone === "error"
                        ? "alert-circle"
                        : "info"
                  }
                  size={16}
                  color={
                    messageTone === "success"
                      ? "#065F46"
                      : messageTone === "error"
                        ? "#991B1B"
                        : "#0F766E"
                  }
                />
                <Text
                  style={[
                    styles.messageText,
                    messageTone === "success" && styles.messageTextSuccess,
                    messageTone === "error" && styles.messageTextError,
                  ]}
                >
                  {message}
                </Text>
              </View>
            ) : null}

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={resetEmail}
                onChangeText={setResetEmail}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <Pressable
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={handleResetPassword}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Sending Reset Link..." : "Send Reset Link"}
              </Text>
            </Pressable>
          </View>

          <PasswordHelpTips
            items={[
              "Check your inbox and spam folder after submitting the request.",
              "Use the most recent reset email if you request multiple links.",
              "Return to login if you remembered your password before resetting.",
            ]}
          />

          <View style={styles.footerCard}>
            <Text style={styles.footerPrompt}>Remember your password?</Text>
            <Pressable style={styles.inlineLinkRow} onPress={() => onNavigate?.("login")}>
              <Feather name="arrow-left" size={16} color="#0F766E" />
              <Text style={styles.inlineLinkText}>Back to Login</Text>
            </Pressable>
          </View>

          <Footer onNavigate={(route) => onNavigate?.(route)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF8",
  },
  keyboardWrap: {
    flex: 1,
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
  formCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#64748B",
    lineHeight: 20,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#E6FFFB",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  messageBannerSuccess: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  messageBannerError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  messageText: {
    flex: 1,
    color: "#0F766E",
    lineHeight: 20,
    fontWeight: "600",
  },
  messageTextSuccess: {
    color: "#065F46",
  },
  messageTextError: {
    color: "#991B1B",
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: "#243B53",
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    color: "#102A43",
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  footerCard: {
    borderRadius: 24,
    padding: 18,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  footerPrompt: {
    color: "#486581",
    lineHeight: 20,
  },
  inlineLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineLinkText: {
    color: "#0F766E",
    fontWeight: "900",
  },
});
