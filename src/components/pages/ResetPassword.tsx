import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
import PasswordStrengthChecklist from "../security/PasswordStrengthChecklist";
import ResetPasswordHeroIllustration from "../security/ResetPasswordHeroIllustration";

export default function ResetPasswordPage({
  token,
  onNavigate,
}: {
  token?: string | null;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log("Reset token:", token);
  }, [token]);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessageTone("error");
      setMessage("Passwords do not match.");
      return;
    }

    if (!token) {
      setMessageTone("error");
      setMessage("Invalid or missing token.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await AuthService.resetPassword(token, newPassword);

      if (response?.status === 200) {
        setMessageTone("success");
        setMessage("Password reset successfully.");

        setTimeout(() => {
          onNavigate?.("login");
        }, 2000);
      } else {
        setMessageTone("error");
        setMessage("Failed to reset password.");
      }
    } catch (error: any) {
      setMessageTone("error");

      if (error?.response?.status === 400) {
        if (error?.response?.data?.message === "Token has expired") {
          setMessage("The password reset link has expired. Please request a new one.");
        } else {
          setMessage("Invalid or expired token.");
        }
      } else {
        setMessage(error?.message || "Unable to reset password.");
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
              <MaterialCommunityIcons name="shield-key-outline" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Secure reset</Text>
            </View>

            <Text style={styles.heroTitle}>Reset your password</Text>
            <Text style={styles.heroSubtitle}>
              Choose a new password for your CuttyPaws account. Make sure both fields match before
              submitting the reset.
            </Text>

            <ResetPasswordHeroIllustration />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create a new password</Text>
            <Text style={styles.sectionSubtitle}>
              Use a strong password you have not used before.
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
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                />
                <Pressable
                  style={styles.toggleButton}
                  onPress={() => setShowNewPassword((prev) => !prev)}
                >
                  <Text style={styles.toggleButtonText}>{showNewPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                />
                <Pressable
                  style={styles.toggleButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Text style={styles.toggleButtonText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
              onPress={handleResetPassword}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Resetting Password..." : "Reset Password"}
              </Text>
            </Pressable>
          </View>

          <PasswordStrengthChecklist
            items={[
              "Use at least 8 characters.",
              "Mix uppercase, lowercase, numbers, and symbols where possible.",
              "Avoid reusing passwords from other accounts.",
            ]}
          />

          <View style={styles.footerCard}>
            <Text style={styles.footerPrompt}>Remember your password?</Text>
            <Pressable style={styles.inlineLinkRow} onPress={() => onNavigate?.("login")}>
              <Feather name="log-in" size={16} color="#0F766E" />
              <Text style={styles.inlineLinkText}>Login here</Text>
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
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#102A43",
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toggleButtonText: {
    color: "#0F766E",
    fontWeight: "800",
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
