import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthService from "../src/api/AuthService";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [remainingTime, setRemainingTime] = useState("10:00");
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const normalizedEmail = formData.email.trim().toLowerCase();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (
      showVerificationPopup &&
      remainingTime !== "Expired" &&
      remainingTime !== "No code"
    ) {
      timer = setInterval(() => {
        const [minutes, seconds] = remainingTime.split(":").map(Number);
        const totalSeconds = minutes * 60 + seconds - 1;

        if (totalSeconds <= 0) {
          setRemainingTime("Expired");
          setVerificationError(
            "Verification code expired. Please request a new one."
          );
        } else {
          const newMinutes = Math.floor(totalSeconds / 60);
          const newSeconds = totalSeconds % 60;
          setRemainingTime(
            `${newMinutes.toString().padStart(2, "0")}:${newSeconds
              .toString()
              .padStart(2, "0")}`
          );
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showVerificationPopup, remainingTime]);

  const updateField = (name: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (message) setMessage("");
  };

  const handleLoginSuccess = async (response: any) => {
    setMessage("Login successful");
    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    setMessage("");
    setIsLoading(true);

    if (!normalizedEmail || !formData.password) {
      setMessage("Email and password are required");
      setIsLoading(false);
      return;
    }

    try {
      const loginData = {
        email: normalizedEmail,
        password: formData.password,
        rememberMe: formData.rememberMe,
      };

      const response = await AuthService.loginUser(loginData);

      if (response?.requiresVerification) {
        setShowVerificationPopup(true);
        setRemainingTime(response.remainingTime || "10:00");
        setRemainingAttempts(response.remainingAttempts || 5);
        setMessage(response.message || "Verification code sent to your email");
      } else if (response?.token) {
        await handleLoginSuccess(response);
      } else {
        setMessage(response?.message || "Login failed");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending || isLoading || !normalizedEmail || !formData.password) {
      return;
    }

    setIsResending(true);
    setVerificationError("");

    try {
      const response = await AuthService.resendVerificationCode({
        email: normalizedEmail,
        password: formData.password,
      });

      setRemainingTime(response?.remainingTime || "10:00");
      setRemainingAttempts(5);
      setVerificationCode("");
      setVerificationError("");
      setMessage("New verification code sent to your email");
    } catch (error: any) {
      setVerificationError(
        error?.response?.data?.message || "Failed to resend code"
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (isLoading) return;

    if (shouldShowRequestNewCode) {
      await handleResendCode();
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setVerificationError("");

    try {
      const verifyData = {
        email: normalizedEmail,
        password: formData.password,
        rememberMe: formData.rememberMe,
        verificationCode: verificationCode,
      };

      const response = await AuthService.verifyCode(verifyData);

      if (response?.token) {
        setShowVerificationPopup(false);
        setVerificationError("");
        await handleLoginSuccess(response);
      } else if (response?.requiresVerification) {
        setVerificationError(response.message || "Invalid verification code");
        setRemainingTime(response.remainingTime || remainingTime);
        setRemainingAttempts(
          response.remainingAttempts || Math.max(0, remainingAttempts - 1)
        );
      } else {
        setVerificationError(response?.message || "Verification failed");
      }
    } catch (error: any) {
      setVerificationError(
        error?.response?.data?.message ||
          "Invalid verification code. Please try again."
      );

      if (error?.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(error.response.data.remainingAttempts);
      } else {
        setRemainingAttempts((prev) => Math.max(0, prev - 1));
      }

      if (error?.response?.data?.remainingTime) {
        setRemainingTime(error.response.data.remainingTime);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeVerificationPopup = () => {
    setShowVerificationPopup(false);
    setVerificationCode("");
    setVerificationError("");
    setRemainingTime("10:00");
    setRemainingAttempts(5);
  };

  const shouldShowRequestNewCode =
    verificationError.includes("Too many wrong attempts") ||
    remainingAttempts <= 0;
  const isVerifyActionDisabled =
    isLoading ||
    (!shouldShowRequestNewCode &&
      (!verificationCode || verificationCode.length !== 6));

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Access your CuttyPaws account and continue where you left off.
            </Text>

            {!!message && (
              <View
                style={[
                  styles.messageBox,
                  message.toLowerCase().includes("successful")
                    ? styles.successBox
                    : styles.errorBox,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.toLowerCase().includes("successful")
                      ? styles.successText
                      : styles.errorText,
                  ]}
                >
                  {message}
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={formData.email}
                onChangeText={(value) => updateField("email", value)}
                placeholder="name@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={formData.password}
                  onChangeText={(value) => updateField("password", value)}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  style={[styles.input, styles.passwordInput]}
                  editable={!isLoading}
                />
                <Pressable
                  style={styles.toggleBtn}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Text style={styles.toggleBtnText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rememberRow}>
              <Text style={styles.rememberLabel}>Keep me signed in</Text>
              <Switch
                value={formData.rememberMe}
                onValueChange={(value) => updateField("rememberMe", value)}
              />
            </View>

            <Pressable
              style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Enter CuttyPaws</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.linkText}>
                New to CuttyPaws? Create your account
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <Modal
          visible={showVerificationPopup}
          animationType="slide"
          transparent
          onRequestClose={closeVerificationPopup}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEyebrow}>Secure sign-in</Text>
              <Text style={styles.modalTitle}>Device Verification Required</Text>
              <Text style={styles.modalText}>
                Enter the 6-digit code sent to your email.
              </Text>

              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>
                  {remainingTime === "Expired"
                    ? "Code expired"
                    : `Time left: ${remainingTime}`}
                </Text>
              </View>

              {remainingAttempts > 0 && remainingAttempts < 5 && (
                <Text style={styles.attemptText}>
                  {remainingAttempts} attempt
                  {remainingAttempts !== 1 ? "s" : ""} remaining
                </Text>
              )}

              <TextInput
                value={verificationCode}
                onChangeText={(value) => {
                  const clean = value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(clean);
                  setVerificationError("");
                }}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
                editable={!isLoading && !shouldShowRequestNewCode}
              />

              {!!verificationError && (
                <Text style={styles.errorInline}>{verificationError}</Text>
              )}

              <Pressable
                style={[
                  styles.secondaryBtn,
                  (isResending || isLoading) && styles.disabledBtn,
                ]}
                onPress={handleResendCode}
                disabled={isResending || isLoading}
              >
                {isResending ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.secondaryBtnText}>Resend Code</Text>
                )}
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    isVerifyActionDisabled && styles.disabledBtn,
                  ]}
                  onPress={handleVerificationSubmit}
                  disabled={isVerifyActionDisabled}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {shouldShowRequestNewCode ? "Request New Code" : "Verify Code"}
                    </Text>
                  )}
                </Pressable>

                <Pressable style={styles.cancelBtn} onPress={closeVerificationPopup}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#F7FBF9" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  eyebrow: {
    color: "#23B985",
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#102A43",
    marginBottom: 8,
  },
  subtitle: {
    color: "#5C6F82",
    lineHeight: 22,
    marginBottom: 18,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#102A43",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D9E2EC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  toggleBtnText: {
    color: "#23B985",
    fontWeight: "700",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  rememberLabel: {
    color: "#102A43",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#23B985",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#EEF7F3",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryBtnText: {
    color: "#102A43",
    fontWeight: "700",
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    color: "#7B8794",
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  linkText: {
    textAlign: "center",
    color: "#23B985",
    fontWeight: "700",
    marginTop: 16,
  },
  messageBox: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  successBox: {
    backgroundColor: "#E7F8EF",
  },
  errorBox: {
    backgroundColor: "#FDECEC",
  },
  messageText: {
    fontWeight: "600",
  },
  successText: {
    color: "#16794D",
  },
  errorText: {
    color: "#B42318",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(16,42,67,0.35)",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
  },
  modalEyebrow: {
    color: "#23B985",
    fontWeight: "700",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#102A43",
    marginBottom: 8,
  },
  modalText: {
    color: "#5C6F82",
    lineHeight: 21,
    marginBottom: 14,
  },
  badgeWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF4DB",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  badgeText: {
    fontWeight: "700",
    color: "#8A6116",
  },
  attemptText: {
    color: "#B54708",
    marginBottom: 10,
    fontWeight: "600",
  },
  errorInline: {
    color: "#B42318",
    marginTop: 8,
    fontWeight: "600",
  },
  modalActions: {
    marginTop: 8,
  },
});
