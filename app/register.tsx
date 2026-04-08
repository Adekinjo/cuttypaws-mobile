import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import AuthService from "../src/api/AuthService";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = useMemo(() => {
    const password = formData.password;
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password),
    };
  }, [formData.password]);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePassword = (password: string) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleSubmit = async () => {
    setMessage("");

    if (
      !formData.email ||
      !formData.name ||
      !formData.phoneNumber ||
      !formData.password
    ) {
      setMessage("All fields are required");
      return;
    }

    if (!validatePassword(formData.password)) {
      setMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await AuthService.registerUser({
        ...formData,
      });

      if (response?.status === 200) {
        setMessage("User successfully registered");
        setTimeout(() => {
          router.replace("../");
        }, 1200);
      } else {
        setMessage(response?.message || "Unable to register user");
      }
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || "Unable to register user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const messageIsSuccess = message.toLowerCase().includes("success");

  const Requirement = ({
    label,
    ok,
  }: {
    label: string;
    ok: boolean;
  }) => (
    <Text style={[styles.requirementItem, ok && styles.requirementItemValid]}>
      {label}
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Join CuttyPaws</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start sharing, discovering providers, and shopping for your pets.
            </Text>

            {!!message && (
              <View
                style={[
                  styles.messageBox,
                  messageIsSuccess ? styles.successBox : styles.errorBox,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    messageIsSuccess ? styles.successText : styles.errorText,
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
                keyboardType="email-address"
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={formData.name}
                onChangeText={(value) => updateField("name", value)}
                placeholder="Enter your full name"
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                value={formData.phoneNumber}
                onChangeText={(value) => updateField("phoneNumber", value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
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
                  placeholder="Create a strong password"
                  secureTextEntry={!showPassword}
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

            <View style={styles.requirements}>
              <Requirement
                label="Uppercase letter"
                ok={passwordRequirements.hasUpperCase}
              />
              <Requirement
                label="Lowercase letter"
                ok={passwordRequirements.hasLowerCase}
              />
              <Requirement
                label="Number"
                ok={passwordRequirements.hasNumber}
              />
              <Requirement
                label="Special character"
                ok={passwordRequirements.hasSpecialChar}
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
                <Text style={styles.primaryBtnText}>Create account</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.linkText}>Already have an account? Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
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
  requirements: {
    marginTop: 4,
    marginBottom: 10,
    gap: 6,
  },
  requirementItem: {
    color: "#7B8794",
    fontWeight: "600",
  },
  requirementItemValid: {
    color: "#16794D",
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
});
