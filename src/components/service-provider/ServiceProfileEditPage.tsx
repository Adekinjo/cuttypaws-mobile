import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import AppVideo from "../common/AppVideo";

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

const SERVICE_PROFILE_FIELDS = [
  "serviceType",
  "businessName",
  "tagline",
  "description",
  "city",
  "state",
  "country",
  "zipcode",
  "serviceArea",
  "addressLine",
  "latitude",
  "longitude",
  "priceFrom",
  "priceTo",
  "pricingNote",
  "yearsOfExperience",
  "licenseNumber",
  "websiteUrl",
  "whatsappNumber",
  "acceptsHomeVisits",
  "offersEmergencyService",
] as const;

const NUMBER_FIELDS = ["latitude", "longitude", "priceFrom", "priceTo", "yearsOfExperience"];

type ServiceProfile = Record<string, any> & {
  serviceType?: string;
  businessName?: string;
  tagline?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  serviceArea?: string;
  addressLine?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  priceFrom?: number | string | null;
  priceTo?: number | string | null;
  pricingNote?: string;
  yearsOfExperience?: number | string | null;
  licenseNumber?: string;
  websiteUrl?: string;
  whatsappNumber?: string;
  acceptsHomeVisits?: boolean;
  offersEmergencyService?: boolean;
  ownerName?: string;
  serviceMedia?: ServiceMedia[];
  coverMedia?: ServiceMedia | null;
};

type ServiceMedia = {
  id?: string | number;
  url?: string;
  type?: "IMAGE" | "VIDEO" | string;
  isCover?: boolean;
  thumbnailUrl?: string;
};

function normalizeOptionalNumber(value: any) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildServiceProfilePayload(profile: ServiceProfile) {
  return SERVICE_PROFILE_FIELDS.reduce((payload, field) => {
    const value = profile?.[field];

    if (NUMBER_FIELDS.includes(field)) {
      payload[field] = normalizeOptionalNumber(value);
      return payload;
    }

    payload[field] = value ?? (field === "serviceType" ? "" : null);
    return payload;
  }, {} as Record<string, any>);
}

function getReadableError(err: any) {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) return data.errors.join(", ");
  return "Unable to update service profile. Please check the form values and try again.";
}

export default function ServiceProfileEditPage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [serviceMedia, setServiceMedia] = useState<ServiceMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaActionId, setMediaActionId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
    loadMedia();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await ServiceProviderService.getMyServiceProfile();
      setProfile(response?.serviceProfile || {});
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to load service profile.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMedia() {
    try {
      setMediaLoading(true);
      const response = await ServiceProviderService.getMyServiceMedia();
      setServiceMedia(response?.serviceMedia || []);
      setMediaError("");
    } catch (err: any) {
      setMediaError(err?.response?.data?.message || err?.message || "Unable to load service media.");
    } finally {
      setMediaLoading(false);
    }
  }

  const selectedServiceLabel = useMemo(() => {
    return (
      SERVICE_TYPES.find((item) => item.value === profile?.serviceType)?.label ||
      "Select service type"
    );
  }, [profile?.serviceType]);

  function setField(field: keyof ServiceProfile, value: any) {
    setProfile((current) => ({ ...(current || {}), [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleMediaUpload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setMediaError("Media library permission is required to upload service media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 10,
      videoMaxDuration: 90,
    });

    if (result.canceled || !result.assets.length) return;

    try {
      setMediaUploading(true);
      setMediaError("");

      const files = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `service-media-${Date.now()}-${index}`,
        type: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg"),
      }));

      const response = await ServiceProviderService.uploadMyServiceMedia(files);
      if (response?.status >= 400) {
        throw new Error(response?.message || "Unable to upload service media.");
      }

      setSuccess(response?.message || "Service media uploaded successfully.");
      await Promise.all([loadMedia(), loadProfile()]);
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message || "Unable to upload service media.";
      setMediaError(message);
    } finally {
      setMediaUploading(false);
    }
  }

  async function handleDeleteMedia(mediaId?: string | number) {
    if (!mediaId) return;
    try {
      setMediaActionId(mediaId);
      setMediaError("");
      const response = await ServiceProviderService.deleteMyServiceMedia(String(mediaId));
      if (response?.status >= 400) {
        throw new Error(response?.message || "Unable to delete service media.");
      }
      setSuccess(response?.message || "Media deleted.");
      await Promise.all([loadMedia(), loadProfile()]);
    } catch (err: any) {
      setMediaError(err?.message || err?.response?.data?.message || "Unable to delete service media.");
    } finally {
      setMediaActionId(null);
    }
  }

  async function handleSetCover(mediaId?: string | number) {
    if (!mediaId) return;
    try {
      setMediaActionId(mediaId);
      setMediaError("");
      const response = await ServiceProviderService.setMyServiceMediaCover(String(mediaId));
      if (response?.status >= 400) {
        throw new Error(response?.message || "Unable to set cover media.");
      }
      setSuccess(response?.message || "Cover media updated.");
      await Promise.all([loadMedia(), loadProfile()]);
    } catch (err: any) {
      setMediaError(err?.message || err?.response?.data?.message || "Unable to set cover media.");
    } finally {
      setMediaActionId(null);
    }
  }

  async function handleSubmit() {
    if (!profile) return;

    try {
      setSaving(true);
      setError("");
      const payload = buildServiceProfilePayload(profile);
      const response = await ServiceProviderService.updateMyServiceProfile(payload);
      setProfile(response?.serviceProfile || profile);
      await ServiceProviderService.refreshDashboard();
      setSuccess(response?.message || "Service profile updated successfully.");
    } catch (err: any) {
      setError(getReadableError(err));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    loadProfile();
  }

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading service profile...</Text>
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
          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <View style={styles.heroTopRow}>
              <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
                <Feather name="arrow-left" size={18} color="#FFFFFF" />
              </Pressable>

              <View style={styles.heroBadge}>
                <MaterialCommunityIcons
                  name="briefcase-edit-outline"
                  size={15}
                  color="#0F172A"
                />
                <Text style={styles.heroBadgeText}>Service Provider Dashboard</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Edit service profile</Text>
            <Text style={styles.heroSubtitle}>
              Refine how your business appears to customers, then refresh your ad and public profile media.
            </Text>

            <View style={styles.heroStatRow}>
              <HeroStat
                label="Service"
                value={selectedServiceLabel}
                icon={<Feather name="briefcase" size={15} color="#0F172A" />}
              />
              <HeroStat
                label="Media"
                value={`${serviceMedia.length} items`}
                icon={<Feather name="image" size={15} color="#0F172A" />}
              />
            </View>
          </View>

          {error ? (
            <Banner tone="error" title="Unable to save service profile" message={error} />
          ) : null}
          {success ? (
            <Banner tone="success" title="Saved" message={success} />
          ) : null}

          <SectionCard
            title="Profile Details"
            subtitle="Update how your business appears across the service marketplace."
          >
            <FieldBlock label="Service type">
              <View style={styles.chipWrap}>
                {SERVICE_TYPES.map((option) => {
                  const active = profile.serviceType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.choiceChip, active && styles.choiceChipActive]}
                      onPress={() => setField("serviceType", option.value)}
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
            </FieldBlock>

            <Field
              label="Business name"
              value={String(profile.businessName ?? "")}
              onChangeText={(value) => setField("businessName", value)}
              placeholder="Business name"
            />
            <Field
              label="Tagline"
              value={String(profile.tagline ?? "")}
              onChangeText={(value) => setField("tagline", value)}
              placeholder="Short promise or positioning statement"
            />
            <Field
              label="Description"
              value={String(profile.description ?? "")}
              onChangeText={(value) => setField("description", value)}
              placeholder="Tell clients what makes your service stand out"
              multiline
            />
            <Field
              label="City"
              value={String(profile.city ?? "")}
              onChangeText={(value) => setField("city", value)}
              placeholder="City"
            />
            <Field
              label="State"
              value={String(profile.state ?? "")}
              onChangeText={(value) => setField("state", value)}
              placeholder="State"
            />
            <Field
              label="Country"
              value={String(profile.country ?? "")}
              onChangeText={(value) => setField("country", value)}
              placeholder="Country"
            />
            <Field
              label="Zip code"
              value={String(profile.zipcode ?? "")}
              onChangeText={(value) => setField("zipcode", value)}
              placeholder="Zip code"
              keyboardType="number-pad"
            />
            <Field
              label="Service area"
              value={String(profile.serviceArea ?? "")}
              onChangeText={(value) => setField("serviceArea", value)}
              placeholder="Neighborhoods, regions, or coverage area"
            />
            <Field
              label="Address line"
              value={String(profile.addressLine ?? "")}
              onChangeText={(value) => setField("addressLine", value)}
              placeholder="Street address or office line"
            />
            <Field
              label="Price from"
              value={String(profile.priceFrom ?? "")}
              onChangeText={(value) => setField("priceFrom", value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Field
              label="Price to"
              value={String(profile.priceTo ?? "")}
              onChangeText={(value) => setField("priceTo", value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <Field
              label="Pricing note"
              value={String(profile.pricingNote ?? "")}
              onChangeText={(value) => setField("pricingNote", value)}
              placeholder="Explain what affects the final quote"
            />
            <Field
              label="Years of experience"
              value={String(profile.yearsOfExperience ?? "")}
              onChangeText={(value) => setField("yearsOfExperience", value)}
              placeholder="0"
              keyboardType="number-pad"
            />
            <Field
              label="License number"
              value={String(profile.licenseNumber ?? "")}
              onChangeText={(value) => setField("licenseNumber", value)}
              placeholder="Certification or license number"
            />
            <Field
              label="Website URL"
              value={String(profile.websiteUrl ?? "")}
              onChangeText={(value) => setField("websiteUrl", value)}
              placeholder="https://yourbusiness.com"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Field
              label="WhatsApp number"
              value={String(profile.whatsappNumber ?? "")}
              onChangeText={(value) => setField("whatsappNumber", value)}
              placeholder="WhatsApp number"
              keyboardType="phone-pad"
            />

            <SwitchRow
              label="Accepts home visits"
              description="Travel to the customer's home when needed."
              value={Boolean(profile.acceptsHomeVisits)}
              onValueChange={(value) => setField("acceptsHomeVisits", value)}
            />
            <SwitchRow
              label="Offers emergency service"
              description="Support urgent or same-day requests."
              value={Boolean(profile.offersEmergencyService)}
              onValueChange={(value) => setField("offersEmergencyService", value)}
            />

            <View style={styles.actionRow}>
              <Pressable
                style={styles.primaryAction}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="save" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>Save changes</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={styles.secondaryAction}
                onPress={handleReset}
                disabled={saving}
              >
                <Text style={styles.secondaryActionText}>Reset</Text>
              </Pressable>
            </View>
          </SectionCard>

          <SectionCard
            title="Ad and Profile Media"
            subtitle="Upload photos or videos for your public profile and choose one cover item."
          >
            <View style={styles.mediaHeaderRow}>
              <Text style={styles.mediaHint}>
                The cover item appears on your ads card and public profile header.
              </Text>
              <Pressable
                style={[styles.uploadButton, mediaUploading && styles.uploadButtonDisabled]}
                onPress={handleMediaUpload}
                disabled={mediaUploading}
              >
                {mediaUploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="upload" size={15} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>Upload ad media</Text>
                  </>
                )}
              </Pressable>
            </View>

            {mediaError ? (
              <Banner tone="error" title="Media action failed" message={mediaError} compact />
            ) : null}

            {mediaLoading ? (
              <View style={styles.mediaLoadingWrap}>
                <ActivityIndicator size="large" color="#0F766E" />
              </View>
            ) : serviceMedia.length ? (
              <View style={styles.mediaList}>
                {serviceMedia.map((item) => {
                  const isVideo = String(item.type || "").toUpperCase().includes("VIDEO");
                  const busy = mediaActionId === item.id;
                  return (
                    <View key={String(item.id)} style={styles.mediaCard}>
                      <View style={styles.mediaPreviewWrap}>
                        {isVideo ? (
                          <AppVideo
                            uri={item.url || ""}
                            style={styles.mediaPreview}
                            posterUri={item.thumbnailUrl}
                            shouldPlay={false}
                            isMuted
                            contentFit="cover"
                          />
                        ) : (
                          <Image
                            source={{ uri: item.url || item.thumbnailUrl || "" }}
                            style={styles.mediaPreview}
                          />
                        )}
                        <View style={styles.mediaTypeBadge}>
                          <Text style={styles.mediaTypeBadgeText}>
                            {isVideo ? "Video" : "Image"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.mediaInfo}>
                        <Text style={styles.mediaUrl} numberOfLines={2}>
                          {item.url}
                        </Text>
                        <View style={styles.mediaActionRow}>
                          <Pressable
                            style={[
                              styles.coverButton,
                              item.isCover && styles.coverButtonActive,
                            ]}
                            disabled={Boolean(item.isCover) || busy}
                            onPress={() => handleSetCover(item.id)}
                          >
                            {busy ? (
                              <ActivityIndicator
                                size="small"
                                color={item.isCover ? "#FFFFFF" : "#0F172A"}
                              />
                            ) : (
                              <Text
                                style={[
                                  styles.coverButtonText,
                                  item.isCover && styles.coverButtonTextActive,
                                ]}
                              >
                                {item.isCover ? "Used as ad cover" : "Use as ad cover"}
                              </Text>
                            )}
                          </Pressable>

                          <Pressable
                            style={styles.deleteButton}
                            disabled={busy}
                            onPress={() =>
                              Alert.alert("Delete media", "Remove this media item?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => handleDeleteMedia(item.id),
                                },
                              ])
                            }
                          >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyMediaCard}>
                <View style={styles.emptyMediaIcon}>
                  <Feather name="image" size={22} color="#0F766E" />
                </View>
                <Text style={styles.emptyMediaTitle}>No media uploaded yet</Text>
                <Text style={styles.emptyMediaText}>
                  Upload your first image or video, then choose one image as the cover for your ads card and public profile.
                </Text>
              </View>
            )}
          </SectionCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeroStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <View style={styles.heroStatCard}>
      <View style={styles.heroStatIcon}>{icon}</View>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
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

function Banner({
  tone,
  title,
  message,
  compact = false,
}: {
  tone: "error" | "success";
  title: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === "error" ? styles.bannerError : styles.bannerSuccess,
        compact && styles.bannerCompact,
      ]}
    >
      <Text style={[styles.bannerTitle, tone === "error" ? styles.bannerTitleError : styles.bannerTitleSuccess]}>
        {title}
      </Text>
      <Text style={styles.bannerMessage}>{message}</Text>
    </View>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
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
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: "#F4FAF7",
  },
  screen: { flex: 1 },
  contentContainer: {
    padding: 16,
    paddingBottom: 44,
    gap: 16,
    backgroundColor: "#F4FAF7",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
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
    right: -12,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.14)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -48,
    left: -24,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.12)",
  },
  heroTopRow: {
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
    letterSpacing: 0.6,
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
  heroStatRow: {
    flexDirection: "row",
    gap: 12,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroStatIcon: {
    marginBottom: 8,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "#99F6E4",
    fontWeight: "700",
  },
  heroStatValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  banner: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerCompact: {
    marginTop: 4,
  },
  bannerError: {
    backgroundColor: "#FEE2E2",
  },
  bannerSuccess: {
    backgroundColor: "#DCFCE7",
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "900",
  },
  bannerTitleError: {
    color: "#991B1B",
  },
  bannerTitleSuccess: {
    color: "#166534",
  },
  bannerMessage: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
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
    marginTop: 4,
  },
  primaryAction: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#0F766E",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryAction: {
    flex: 0.8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  secondaryActionText: {
    color: "#334E68",
    fontSize: 14,
    fontWeight: "800",
  },
  mediaHeaderRow: {
    gap: 12,
  },
  mediaHint: {
    fontSize: 13,
    lineHeight: 20,
    color: "#486581",
  },
  uploadButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  uploadButtonDisabled: {
    opacity: 0.75,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  mediaLoadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  mediaList: {
    gap: 14,
  },
  mediaCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  mediaPreviewWrap: {
    position: "relative",
    height: 220,
    backgroundColor: "#E2E8F0",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaTypeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(15,23,42,0.82)",
  },
  mediaTypeBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  mediaInfo: {
    padding: 14,
    gap: 12,
  },
  mediaUrl: {
    color: "#486581",
    fontSize: 12,
    lineHeight: 18,
  },
  mediaActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  coverButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "#E2E8F0",
  },
  coverButtonActive: {
    backgroundColor: "#0F172A",
  },
  coverButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  coverButtonTextActive: {
    color: "#FFFFFF",
  },
  deleteButton: {
    flex: 0.7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "#FEE2E2",
  },
  deleteButtonText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "800",
  },
  emptyMediaCard: {
    alignItems: "center",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  emptyMediaIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  emptyMediaTitle: {
    marginTop: 12,
    color: "#102A43",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyMediaText: {
    marginTop: 8,
    color: "#486581",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
