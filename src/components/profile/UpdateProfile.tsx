import { Feather, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
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

type UserInfo = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  businessRegistrationNumber?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  coverPhotoUrl?: string;
};

type FormState = {
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  businessRegistrationNumber: string;
};

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80";
const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80";

export default function UpdateProfile({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    businessRegistrationNumber: "",
  });
  const [profilePreview, setProfilePreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const loadUser = useCallback(async () => {
    try {
      setError("");
      setSuccess("");

      const [response, sellerRole] = await Promise.all([
        AuthService.getLoggedInInfo(),
        AuthService.isSeller(),
      ]);

      const user: UserInfo = response?.user || response?.data || response || {};

      setForm({
        name: user?.name || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        companyName: user?.companyName || "",
        businessRegistrationNumber: user?.businessRegistrationNumber || "",
      });

      setProfilePreview(user?.profileImageUrl || "");
      setCoverPreview(user?.coverImageUrl || user?.coverPhotoUrl || "");
      setIsSeller(Boolean(sellerRole));
    } catch (loadError: any) {
      console.error("[UpdateProfile] loadUser failed", loadError);
      setError(loadError?.response?.data?.message || loadError?.message || "Failed to load your profile.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        setLoading(true);
        await loadUser();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, [loadUser]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 2800);
    return () => clearTimeout(timer);
  }, [success]);

  const pageBusy = useMemo(
    () => loading || saving || uploadingProfile || uploadingCover,
    [loading, saving, uploadingCover, uploadingProfile]
  );

  function onChange(name: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  }

  function validate() {
    const name = form.name.trim();
    const phone = form.phoneNumber.trim();

    if (!name) return "Name is required.";
    if (phone && phone.length < 7) return "Phone number looks too short.";
    return "";
  }

  async function onSave() {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload: Record<string, any> = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
      };

      const response = await AuthService.updateUserProfile(payload);
      const updatedUser = response?.user || response?.data?.user || response?.data || null;

      if (updatedUser) {
        await AuthService.setStoredUser(updatedUser);
      }

      setSuccess(response?.message || "Profile updated successfully.");
    } catch (saveError: any) {
      console.error("[UpdateProfile] onSave failed", saveError);
      setError(saveError?.response?.data?.message || saveError?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function pickAndUpload(kind: "profile" | "cover") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Photo permission is required to update profile images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: kind === "cover" ? [16, 9] : [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    const localUri = asset.uri;
    const file = {
      uri: localUri,
      name: asset.fileName || `${kind}-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    } as any;

    if (kind === "profile") {
      setProfilePreview(localUri);
    } else {
      setCoverPreview(localUri);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setError("");
      setSuccess("");

      if (kind === "profile") {
        setUploadingProfile(true);
        const response = await AuthService.updateUserProfilePicture(formData);
        const updatedUser = response?.user || response?.data?.user || response?.data || null;
        if (updatedUser) {
          await AuthService.setStoredUser(updatedUser);
          setProfilePreview(updatedUser?.profileImageUrl || localUri);
        }
        setSuccess(response?.message || "Profile image updated.");
      } else {
        setUploadingCover(true);
        const response = await AuthService.updateCoverPicture(formData);
        const updatedUser = response?.user || response?.data?.user || response?.data || null;
        if (updatedUser) {
          await AuthService.setStoredUser(updatedUser);
          setCoverPreview(
            updatedUser?.coverImageUrl || updatedUser?.coverPhotoUrl || localUri
          );
        }
        setSuccess(response?.message || "Cover image updated.");
      }
    } catch (uploadError: any) {
      console.error("[UpdateProfile] image upload failed", uploadError);
      setError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          `Failed to upload ${kind} image.`
      );
      await loadUser();
    } finally {
      setUploadingProfile(false);
      setUploadingCover(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading your profile...</Text>
          <Text style={styles.centerCopy}>Preparing your details, photos, and account settings.</Text>
        </View>
      </SafeAreaView>
    );
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
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
                <Feather name="arrow-left" size={18} color="#0F172A" />
              </Pressable>
              <View>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Text style={styles.headerSubtitle}>Update your account information</Text>
              </View>
            </View>

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={onSave}
              disabled={saving || loading}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </Pressable>
          </View>

          {error ? (
            <View style={[styles.banner, styles.errorBanner]}>
              <Feather name="x-circle" size={16} color="#991B1B" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={[styles.banner, styles.successBanner]}>
              <Feather name="check-circle" size={16} color="#166534" />
              <Text style={styles.successBannerText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.coverWrap}>
              <Image
                source={{ uri: coverPreview || COVER_FALLBACK }}
                style={styles.coverImage}
              />
              <View style={styles.coverOverlay} />

              <Pressable
                style={styles.coverAction}
                onPress={() => pickAndUpload("cover")}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="camera" size={15} color="#FFFFFF" />
                    <Text style={styles.coverActionText}>Change cover</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.identityRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: profilePreview || AVATAR_FALLBACK }}
                  style={styles.avatar}
                />
                <Pressable
                  style={styles.avatarAction}
                  onPress={() => pickAndUpload("profile")}
                  disabled={uploadingProfile}
                >
                  {uploadingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="camera" size={14} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>

              <View style={styles.identityCopy}>
                <Text style={styles.identityName}>{form.name || "Your name"}</Text>
                <Text style={styles.identityEmail}>{form.email || "your@email.com"}</Text>
                {(uploadingProfile || uploadingCover) ? (
                  <Text style={styles.uploadHint}>Uploading image...</Text>
                ) : (
                  <Text style={styles.uploadHint}>Tap the camera buttons to replace your photos.</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Account details</Text>
            <Text style={styles.sectionCopy}>
              Keep your public profile current. Email stays read-only for account security.
            </Text>

            <Field
              label="Full Name"
              icon={<Feather name="user" size={16} color="#64748B" />}
              value={form.name}
              placeholder="Enter your full name"
              onChangeText={(value) => onChange("name", value)}
            />

            <Field
              label="Email"
              icon={<Feather name="mail" size={16} color="#64748B" />}
              value={form.email}
              placeholder="Email"
              editable={false}
              helperText="Email cannot be changed."
              onChangeText={(value) => onChange("email", value)}
            />

            <Field
              label="Phone Number"
              icon={<Feather name="phone" size={16} color="#64748B" />}
              value={form.phoneNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              onChangeText={(value) => onChange("phoneNumber", value)}
            />

            {isSeller ? (
              <View style={styles.sellerCard}>
                <View style={styles.sellerHeader}>
                  <Ionicons name="storefront-outline" size={18} color="#7C2D12" />
                  <Text style={styles.sellerTitle}>Seller profile</Text>
                </View>

                <Field
                  label="Seller Name"
                  value={form.companyName}
                  placeholder="Seller name"
                  onChangeText={(value) => onChange("companyName", value)}
                />

                <Field
                  label="Business Registration Number"
                  value={form.businessRegistrationNumber}
                  placeholder="Registration number"
                  onChangeText={(value) => onChange("businessRegistrationNumber", value)}
                />

                <Text style={styles.sellerNote}>
                  Your backend currently updates `name` and `phoneNumber` only. Seller fields are shown here for completeness.
                </Text>
              </View>
            ) : null}

            <View style={styles.footerActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => onNavigate?.("back")}
                disabled={pageBusy}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryAction, saving && styles.primaryActionDisabled]}
                onPress={onSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Save Changes</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  helperText,
  editable = true,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon?: ReactNode;
  helperText?: string;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, !editable && styles.inputWrapDisabled]}>
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          style={[styles.input, !editable && styles.inputDisabled]}
          placeholderTextColor="#94A3B8"
        />
      </View>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 42,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  centerCopy: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
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
  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  coverWrap: {
    position: "relative",
    height: 220,
    backgroundColor: "#E2E8F0",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.2)",
  },
  coverAction: {
    position: "absolute",
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(15,118,110,0.95)",
  },
  coverActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  identityRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    paddingBottom: 18,
    marginTop: -36,
    alignItems: "flex-end",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#F8FAFC",
  },
  avatarAction: {
    position: "absolute",
    right: -4,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  identityCopy: {
    flex: 1,
    gap: 5,
    paddingBottom: 6,
  },
  identityName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  identityEmail: {
    fontSize: 13,
    color: "#475569",
  },
  uploadHint: {
    fontSize: 12,
    color: "#0F766E",
    marginTop: 2,
  },
  formCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionCopy: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
  },
  inputWrapDisabled: {
    backgroundColor: "#F8FAFC",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 14,
  },
  inputDisabled: {
    color: "#64748B",
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
  },
  sellerCard: {
    marginTop: 4,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sellerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#7C2D12",
  },
  sellerNote: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9A3412",
    marginTop: 2,
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#F1F5F9",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  primaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: "#0F172A",
  },
  primaryActionDisabled: {
    opacity: 0.72,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
