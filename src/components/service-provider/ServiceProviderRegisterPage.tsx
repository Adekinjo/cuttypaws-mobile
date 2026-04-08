import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ServiceProviderService from "../../api/ServiceProviderService";

const SERVICE_TYPES = [
  { value: "PET_WALKER", label: "Pet Walker" },
  { value: "GROOMER", label: "Groomer" },
  { value: "VETERINARIAN", label: "Veterinarian" },
  { value: "PET_SITTER", label: "Pet Sitter" },
  { value: "PET_DAYCARE", label: "Pet Daycare" },
  { value: "PET_TRAINER", label: "Pet Trainer" },
  { value: "BOARDING", label: "Boarding" },
  { value: "PET_TRANSPORT", label: "Pet Transport" },
  { value: "PET_PHOTOGRAPHER", label: "Pet Photographer" },
];

const initialForm = {
  user: {
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    companyName: "",
    businessRegistrationNumber: "",
  },
  serviceProfile: {
    serviceType: "",
    businessName: "",
    tagline: "",
    description: "",
    city: "",
    state: "",
    country: "USA",
    zipcode: "",
    serviceArea: "",
    addressLine: "",
    priceFrom: "",
    priceTo: "",
    pricingNote: "",
    yearsOfExperience: "",
    licenseNumber: "",
    websiteUrl: "",
    whatsappNumber: "",
    acceptsHomeVisits: false,
    offersEmergencyService: false,
  },
};

export default function ServiceProviderRegisterPage({
  initialServiceType,
  onNavigate,
}: {
  initialServiceType?: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [formData, setFormData] = useState(() => ({
    ...initialForm,
    user: { ...initialForm.user },
    serviceProfile: {
      ...initialForm.serviceProfile,
      serviceType: initialServiceType || initialForm.serviceProfile.serviceType,
    },
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const selectedServiceLabel = useMemo(() => {
    return (
      SERVICE_TYPES.find((item) => item.value === formData.serviceProfile.serviceType)?.label ||
      "Choose your service"
    );
  }, [formData.serviceProfile.serviceType]);

  function setField(section: "user" | "serviceProfile", field: string, value: any) {
    setFormData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!formData.user.name.trim()) return "Full name is required.";
    if (!formData.user.email.trim()) return "Email is required.";
    if (!formData.user.phoneNumber.trim()) return "Phone number is required.";
    if (!formData.user.password.trim() || formData.user.password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    if (!formData.serviceProfile.serviceType) return "Please select a service type.";
    if (!formData.serviceProfile.description.trim()) return "Description is required.";

    const priceFrom = Number(formData.serviceProfile.priceFrom || 0);
    const priceTo = Number(formData.serviceProfile.priceTo || 0);
    if (formData.serviceProfile.priceFrom && formData.serviceProfile.priceTo && priceTo < priceFrom) {
      return "Price to cannot be less than price from.";
    }

    return "";
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        user: { ...formData.user },
        serviceProfile: {
          ...formData.serviceProfile,
          priceFrom: formData.serviceProfile.priceFrom
            ? Number(formData.serviceProfile.priceFrom)
            : null,
          priceTo: formData.serviceProfile.priceTo
            ? Number(formData.serviceProfile.priceTo)
            : null,
          yearsOfExperience: formData.serviceProfile.yearsOfExperience
            ? Number(formData.serviceProfile.yearsOfExperience)
            : null,
        },
      };

      const response = await ServiceProviderService.registerServiceProvider(payload);
      setSuccess(response?.message || "Application submitted successfully.");
      onNavigate?.("login");
    } catch (submitError: any) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to submit your application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <View style={styles.topRow}>
              <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
                <Feather name="arrow-left" size={18} color="#E2E8F0" />
              </Pressable>
              <View style={styles.heroBadge}>
                <MaterialCommunityIcons name="briefcase-plus-outline" size={15} color="#0F172A" />
                <Text style={styles.heroBadgeText}>CuttyPaws Services</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Register as a service provider</Text>
            <Text style={styles.heroSubtitle}>
              Submit your provider profile. Your application will remain pending until an admin approves it.
            </Text>

            <View style={styles.heroPill}>
              <Text style={styles.heroPillLabel}>Selected service</Text>
              <Text style={styles.heroPillValue}>{selectedServiceLabel}</Text>
            </View>
          </View>

          {error ? (
            <View style={[styles.banner, styles.errorBanner]}>
              <Feather name="alert-circle" size={16} color="#991B1B" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.banner, styles.successBanner]}>
              <Feather name="check-circle" size={16} color="#166534" />
              <Text style={styles.successBannerText}>{success}</Text>
            </View>
          ) : null}

          <SectionCard
            title="Account Details"
            subtitle="Create the account that will own your service profile."
          >
            <Field
              label="Full name"
              value={formData.user.name}
              onChangeText={(value) => setField("user", "name", value)}
              placeholder="Your full name"
            />
            <Field
              label="Email"
              value={formData.user.email}
              onChangeText={(value) => setField("user", "email", value)}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Phone number"
              value={formData.user.phoneNumber}
              onChangeText={(value) => setField("user", "phoneNumber", value)}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={formData.user.password}
                  onChangeText={(value) => setField("user", "password", value)}
                  placeholder="Create a password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable onPress={() => setShowPassword((value) => !value)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            </View>

            <Field
              label="Company name"
              value={formData.user.companyName}
              onChangeText={(value) => setField("user", "companyName", value)}
              placeholder="Optional company name"
            />
            <Field
              label="Business registration number"
              value={formData.user.businessRegistrationNumber}
              onChangeText={(value) =>
                setField("user", "businessRegistrationNumber", value)
              }
              placeholder="Optional registration number"
            />
          </SectionCard>

          <SectionCard
            title="Service Profile"
            subtitle="Show clients what you offer and how to reach you."
          >
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Service type</Text>
              <View style={styles.chipWrap}>
                {SERVICE_TYPES.map((option) => {
                  const active = formData.serviceProfile.serviceType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                      onPress={() => setField("serviceProfile", "serviceType", option.value)}
                    >
                      <Text
                        style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Field
              label="Business name"
              value={formData.serviceProfile.businessName}
              onChangeText={(value) => setField("serviceProfile", "businessName", value)}
              placeholder="Public-facing business name"
            />
            <Field
              label="Tagline"
              value={formData.serviceProfile.tagline}
              onChangeText={(value) => setField("serviceProfile", "tagline", value)}
              placeholder="Short phrase that defines your service"
            />
            <Field
              label="Description"
              value={formData.serviceProfile.description}
              onChangeText={(value) => setField("serviceProfile", "description", value)}
              placeholder="Describe your experience, care style, and services"
              multiline
            />
          </SectionCard>

          <SectionCard
            title="Location and Pricing"
            subtitle="Help customers understand where you operate and what pricing looks like."
          >
            <Field
              label="City"
              value={formData.serviceProfile.city}
              onChangeText={(value) => setField("serviceProfile", "city", value)}
              placeholder="City"
            />
            <Field
              label="State"
              value={formData.serviceProfile.state}
              onChangeText={(value) => setField("serviceProfile", "state", value)}
              placeholder="State"
            />
            <Field
              label="Zip code"
              value={formData.serviceProfile.zipcode}
              onChangeText={(value) => setField("serviceProfile", "zipcode", value)}
              placeholder="Zip code"
              keyboardType="number-pad"
            />
            <Field
              label="Service area"
              value={formData.serviceProfile.serviceArea}
              onChangeText={(value) => setField("serviceProfile", "serviceArea", value)}
              placeholder="Neighborhoods or zones served"
            />
            <Field
              label="Address line"
              value={formData.serviceProfile.addressLine}
              onChangeText={(value) => setField("serviceProfile", "addressLine", value)}
              placeholder="Street address"
            />
            <Field
              label="Price from"
              value={formData.serviceProfile.priceFrom}
              onChangeText={(value) => setField("serviceProfile", "priceFrom", value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Field
              label="Price to"
              value={formData.serviceProfile.priceTo}
              onChangeText={(value) => setField("serviceProfile", "priceTo", value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Field
              label="Pricing note"
              value={formData.serviceProfile.pricingNote}
              onChangeText={(value) => setField("serviceProfile", "pricingNote", value)}
              placeholder="Example: final quote depends on pet size and travel"
            />
          </SectionCard>

          <SectionCard
            title="Experience and Contact"
            subtitle="Add credentials and channels that build trust."
          >
            <Field
              label="Years of experience"
              value={formData.serviceProfile.yearsOfExperience}
              onChangeText={(value) =>
                setField("serviceProfile", "yearsOfExperience", value)
              }
              placeholder="0"
              keyboardType="number-pad"
            />
            <Field
              label="License number"
              value={formData.serviceProfile.licenseNumber}
              onChangeText={(value) => setField("serviceProfile", "licenseNumber", value)}
              placeholder="Optional license or certification number"
            />
            <Field
              label="Website URL"
              value={formData.serviceProfile.websiteUrl}
              onChangeText={(value) => setField("serviceProfile", "websiteUrl", value)}
              placeholder="https://yourbusiness.com"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Field
              label="WhatsApp number"
              value={formData.serviceProfile.whatsappNumber}
              onChangeText={(value) => setField("serviceProfile", "whatsappNumber", value)}
              placeholder="WhatsApp contact"
              keyboardType="phone-pad"
            />

            <SwitchRow
              label="Accepts home visits"
              description="Travel to the client or pet owner's location."
              value={formData.serviceProfile.acceptsHomeVisits}
              onValueChange={(value) =>
                setField("serviceProfile", "acceptsHomeVisits", value)
              }
            />
            <SwitchRow
              label="Offers emergency service"
              description="Provide urgent or short-notice support when needed."
              value={formData.serviceProfile.offersEmergencyService}
              onValueChange={(value) =>
                setField("serviceProfile", "offersEmergencyService", value)
              }
            />
          </SectionCard>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => onNavigate?.("login")}
              disabled={submitting}
            >
              <Text style={styles.secondaryButtonText}>Sign in instead</Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButtonWide, submitting && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonWideText}>Submit application</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "decimal-pad" | "number-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function SwitchRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#0F766E" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 42,
    gap: 16,
    backgroundColor: "#F5FAF8",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 20,
    gap: 14,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -32,
    right: -6,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(45,212,191,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -46,
    left: -28,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.14)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#CBD5E1",
    lineHeight: 22,
    fontSize: 15,
  },
  heroPill: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroPillLabel: {
    color: "#99F6E4",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroPillValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
  },
  successBanner: {
    backgroundColor: "#DCFCE7",
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#991B1B",
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  sectionCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#486581",
    lineHeight: 21,
    marginTop: 6,
  },
  sectionBody: {
    gap: 14,
    marginTop: 16,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    color: "#102A43",
    fontSize: 13,
    fontWeight: "800",
  },
  inputWrap: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
    color: "#102A43",
    fontSize: 14,
  },
  textarea: {
    minHeight: 120,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
  },
  choiceChipActive: {
    backgroundColor: "#0F766E",
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334E68",
  },
  choiceChipTextActive: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchLabel: {
    color: "#102A43",
    fontSize: 14,
    fontWeight: "800",
  },
  switchDescription: {
    color: "#486581",
    lineHeight: 20,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  secondaryButtonText: {
    color: "#334E68",
    fontSize: 14,
    fontWeight: "800",
  },
  primaryButtonWide: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#0F766E",
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonWideText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});
