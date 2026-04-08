import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AuthService from "../../api/AuthService";
import { AdminButton, AdminCard, AdminScreen, Banner, Field } from "../admin/AdminCommon";

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

export default function SellerRegister({
  onSuccess,
  onLogin,
}: {
  onSuccess?: () => void;
  onLogin?: () => void;
}) {
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (name: keyof typeof formData, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const passwordRequirements = useMemo(
    () => ({
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /\d/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*]/.test(formData.password),
      hasMinLength: formData.password.length >= 8,
    }),
    [formData.password]
  );

  const passwordIsValid = strongPasswordRegex.test(formData.password);

  const handleSignup = async () => {
    setMessage("");

    if (
      !formData.companyName.trim() ||
      !formData.name.trim() ||
      !formData.phoneNumber.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setMessage("All fields are required.");
      return;
    }

    if (!validateEmail(formData.email.trim())) {
      setMessage("Enter a valid email address.");
      return;
    }

    if (!passwordIsValid) {
      setMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setSubmitting(true);
      await AuthService.registerUser({
        companyName: formData.companyName.trim(),
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: "ROLE_SELLER",
      });
      setMessage("Registration successful. Continue to login.");
      onSuccess?.();
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminScreen title="Seller Registration" subtitle="Open your store on CuttyPaws">
      <Banner
        message={message}
        tone={message.includes("successful") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Seller Onboarding</Text>
          <Text style={styles.heroTitle}>Launch your seller account from mobile</Text>
          <Text style={styles.heroBody}>
            Create your store identity, add your business contact details, and get ready to list
            products from the seller hub.
          </Text>
        </View>

        <View style={styles.heroPoints}>
          <View style={styles.pointCard}>
            <Text style={styles.pointLabel}>Store profile</Text>
            <Text style={styles.pointText}>Set up your seller name and owner identity.</Text>
          </View>
          <View style={styles.pointCard}>
            <Text style={styles.pointLabel}>Secure access</Text>
            <Text style={styles.pointText}>Use a strong password that meets backend rules.</Text>
          </View>
        </View>
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Business Details</Text>
        <Field
          label="Seller Name"
          value={formData.companyName}
          onChangeText={(value) => updateField("companyName", value)}
          placeholder="Enter seller or company name"
        />
        <Field
          label="Owner Name"
          value={formData.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="Enter full legal name"
        />
        <Field
          label="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(value) => updateField("phoneNumber", value)}
          placeholder="Enter phone number"
        />
        <Field
          label="Business Email"
          value={formData.email}
          onChangeText={(value) => updateField("email", value)}
          placeholder="Enter business email"
          keyboardType="email-address"
        />
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Account Security</Text>
        <View style={styles.passwordBlock}>
          <Text style={styles.passwordLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={formData.password}
              onChangeText={(value) => updateField("password", value)}
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.helperText}>
          Your password must satisfy the same backend rules used by the web app.
        </Text>

        <View style={styles.requirementsGrid}>
          <Requirement label="8+ characters" met={passwordRequirements.hasMinLength} />
          <Requirement label="Uppercase letter" met={passwordRequirements.hasUpperCase} />
          <Requirement label="Lowercase letter" met={passwordRequirements.hasLowerCase} />
          <Requirement label="Number" met={passwordRequirements.hasNumber} />
          <Requirement label="Special character" met={passwordRequirements.hasSpecialChar} />
        </View>
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Ready to Continue?</Text>
        <Text style={styles.helperText}>
          When registration succeeds, you can move into login and complete seller setup from the
          mobile seller flow.
        </Text>
        <View style={styles.actionStack}>
          <AdminButton
            label={submitting ? "Creating Seller Account..." : "Create Seller Account"}
            onPress={handleSignup}
            disabled={submitting}
          />
          <AdminButton label="Login" variant="secondary" onPress={onLogin} />
        </View>
      </AdminCard>
    </AdminScreen>
  );
}

function Requirement({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={[styles.requirementChip, met ? styles.requirementMet : styles.requirementPending]}>
      <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 18,
    backgroundColor: "#102A43",
  },
  heroTextBlock: {
    gap: 8,
  },
  eyebrow: {
    color: "#FBD38D",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
  },
  heroBody: {
    color: "#D9E2EC",
    lineHeight: 22,
  },
  heroPoints: {
    gap: 10,
  },
  pointCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  pointLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  pointText: {
    color: "#BCCCDC",
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#102A43",
  },
  passwordBlock: {
    gap: 6,
  },
  passwordLabel: {
    fontWeight: "700",
    color: "#243B53",
  },
  passwordRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  passwordToggle: {
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  passwordToggleText: {
    color: "#102A43",
    fontWeight: "800",
  },
  helperText: {
    color: "#64748B",
    lineHeight: 20,
  },
  requirementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  requirementChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  requirementPending: {
    backgroundColor: "#E2E8F0",
  },
  requirementMet: {
    backgroundColor: "#DCFCE7",
  },
  requirementText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  requirementTextMet: {
    color: "#166534",
  },
  actionStack: {
    gap: 10,
  },
});
