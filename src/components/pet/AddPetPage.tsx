import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PetService from "../../api/PetService";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

type PetFormState = {
  name: string;
  type: string;
  breed: string;
  age: string;
  gender: string;
  description: string;
  size: string;
  color: string;
  activityLevel: string;
  temperament: string;
  vaccinated: boolean;
  neutered: boolean;
  specialNeeds: string;
  city: string;
  state: string;
  country: string;
  tags: string[];
  coverImageIndex: number;
  images: ReactNativeFile[];
};

const initialFormState: PetFormState = {
  name: "",
  type: "",
  breed: "",
  age: "",
  gender: "",
  description: "",
  size: "",
  color: "",
  activityLevel: "",
  temperament: "",
  vaccinated: false,
  neutered: false,
  specialNeeds: "",
  city: "",
  state: "",
  country: "",
  tags: [],
  coverImageIndex: 0,
  images: [],
};

const petTypes = [
  "Dog",
  "Cat",
  "Bird",
  "Fish",
  "Rabbit",
  "Hamster",
  "Guinea Pig",
  "Turtle",
  "Snake",
  "Lizard",
  "Other",
];
const genders = ["Male", "Female"];
const sizes = ["Small", "Medium", "Large"];
const activityLevels = ["Low", "Medium", "High"];

export default function AddPetPage({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState<PetFormState>(initialFormState);

  const completion = useMemo(() => {
    const checkpoints = [
      Boolean(formData.name.trim()),
      Boolean(formData.type),
      Boolean(formData.images.length),
      Boolean(formData.description.trim()),
      Boolean(formData.city.trim() || formData.country.trim()),
    ];
    return Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  }, [formData]);

  const updateField = <K extends keyof PetFormState>(key: K, value: PetFormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTagsChange = (value: string) => {
    setTagInput(value);
    updateField(
      "tags",
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    );
  };

  const pickImages = async () => {
    setError("");

    if (formData.images.length >= 5) {
      setError("You can upload maximum 5 images.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Media library permission is required to upload pet photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 5 - formData.images.length,
    });

    if (result.canceled) return;

    const nextFiles = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `pet-image-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || "image/jpeg",
    }));

    updateField("images", [...formData.images, ...nextFiles]);
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      coverImageIndex: prev.coverImageIndex > index ? prev.coverImageIndex - 1 : 0,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Pet name is required.");
      setLoading(false);
      return;
    }

    if (!formData.type) {
      setError("Please select a pet type.");
      setLoading(false);
      return;
    }

    if (!formData.images.length) {
      setError("Please upload at least one pet image.");
      setLoading(false);
      return;
    }

    try {
      await PetService.createPet(formData);
      setSuccess("Pet added successfully.");
      setFormData(initialFormState);
      setTagInput("");

      setTimeout(() => {
        onNavigate?.("customer-profile");
      }, 1500);
    } catch (submitError: any) {
      setError(
        submitError?.message ||
          submitError?.response?.data?.message ||
          "Failed to add pet. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.topRow}>
            <Pressable style={styles.backButton} onPress={() => onNavigate?.("customer-profile")}>
              <Feather name="arrow-left" size={18} color="#DBEAFE" />
            </Pressable>

            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="paw" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Pet profile</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Add New Pet</Text>
          <Text style={styles.heroSubtitle}>
            Build a richer pet profile for smarter recommendations, better matching, and more
            personalized support across the app.
          </Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.progressText}>{completion}% profile complete</Text>
          </View>
        </View>

        {error ? (
          <View style={[styles.messageBanner, styles.messageBannerError]}>
            <Feather name="alert-circle" size={16} color="#991B1B" />
            <Text style={[styles.messageText, styles.messageTextError]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.messageBanner, styles.messageBannerSuccess]}>
            <Feather name="check-circle" size={16} color="#065F46" />
            <Text style={[styles.messageText, styles.messageTextSuccess]}>{success}</Text>
          </View>
        ) : null}

        <SectionCard
          title="Pet Photos"
          subtitle="Upload up to 5 photos and choose the cover image for the profile."
        >
          <View style={styles.imageGrid}>
            {formData.images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.imageItem}>
                <Image source={{ uri: image.uri }} style={styles.previewImage} />

                <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Feather name="x" size={14} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  style={[
                    styles.coverChip,
                    formData.coverImageIndex === index && styles.coverChipActive,
                  ]}
                  onPress={() => updateField("coverImageIndex", index)}
                >
                  <Text
                    style={[
                      styles.coverChipText,
                      formData.coverImageIndex === index && styles.coverChipTextActive,
                    ]}
                  >
                    Cover
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {formData.images.length < 5 ? (
            <Pressable style={styles.uploadBox} onPress={pickImages}>
              <MaterialCommunityIcons name="image-plus" size={28} color="#64748B" />
              <Text style={styles.uploadTitle}>Upload pet photos</Text>
              <Text style={styles.uploadText}>Choose up to 5 images from your gallery.</Text>
            </Pressable>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Basic Information"
          subtitle="Add the core identity details that make the profile useful."
        >
          <Field
            label="Pet Name *"
            value={formData.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="Enter your pet's name"
          />

          <ChipGroup
            label="Pet Type *"
            options={petTypes}
            value={formData.type}
            onChange={(value) => updateField("type", value)}
          />

          <Field
            label="Breed"
            value={formData.breed}
            onChangeText={(value) => updateField("breed", value)}
            placeholder="Breed"
          />

          <Field
            label="Age"
            value={formData.age}
            onChangeText={(value) => updateField("age", value)}
            placeholder="Age"
            keyboardType="numeric"
          />

          <ChipGroup
            label="Gender"
            options={genders}
            value={formData.gender}
            onChange={(value) => updateField("gender", value)}
          />

          <ChipGroup
            label="Size"
            options={sizes}
            value={formData.size}
            onChange={(value) => updateField("size", value)}
          />
        </SectionCard>

        <SectionCard
          title="Traits & Lifestyle"
          subtitle="Capture how your pet behaves, looks, and interacts."
        >
          <Field
            label="Color"
            value={formData.color}
            onChangeText={(value) => updateField("color", value)}
            placeholder="Color"
          />

          <ChipGroup
            label="Activity Level"
            options={activityLevels}
            value={formData.activityLevel}
            onChange={(value) => updateField("activityLevel", value)}
          />

          <Field
            label="Temperament"
            value={formData.temperament}
            onChangeText={(value) => updateField("temperament", value)}
            placeholder="Friendly, playful, calm..."
          />

          <ToggleRow
            title="Vaccinated"
            subtitle="Indicate if your pet is vaccinated."
            value={formData.vaccinated}
            onValueChange={(value) => updateField("vaccinated", value)}
          />

          <ToggleRow
            title="Neutered"
            subtitle="Indicate if your pet is neutered."
            value={formData.neutered}
            onValueChange={(value) => updateField("neutered", value)}
          />
        </SectionCard>

        <SectionCard
          title="Care Details"
          subtitle="Add notes that help with matching and support."
        >
          <Field
            label="Special Needs"
            value={formData.specialNeeds}
            onChangeText={(value) => updateField("specialNeeds", value)}
            placeholder="Any care notes or special needs"
          />

          <Field
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateField("description", value)}
            placeholder="Tell us about your pet"
            multiline
          />

          <Field
            label="Tags"
            value={tagInput}
            onChangeText={handleTagsChange}
            placeholder="playful, friendly, puppy, indoor"
            helperText="Separate tags with commas."
          />
        </SectionCard>

        <SectionCard
          title="Location"
          subtitle="Add a location to improve local matching and recommendations."
        >
          <Field
            label="City"
            value={formData.city}
            onChangeText={(value) => updateField("city", value)}
            placeholder="City"
          />

          <Field
            label="State"
            value={formData.state}
            onChangeText={(value) => updateField("state", value)}
            placeholder="State"
          />

          <Field
            label="Country"
            value={formData.country}
            onChangeText={(value) => updateField("country", value)}
            placeholder="Country"
          />
        </SectionCard>

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => onNavigate?.("customer-profile")}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Adding..." : "Add Pet"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
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
  helperText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  helperText?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, value === option && styles.chipActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
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
    top: -28,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(45,212,191,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -44,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.14)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: "#CBD5E1",
    lineHeight: 22,
    fontSize: 15,
  },
  progressWrap: {
    gap: 8,
  },
  progressBar: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2DD4BF",
  },
  progressText: {
    color: "#CCFBF1",
    fontWeight: "800",
    fontSize: 12,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageBannerError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  messageBannerSuccess: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  messageText: {
    flex: 1,
    lineHeight: 20,
    fontWeight: "600",
  },
  messageTextError: {
    color: "#991B1B",
  },
  messageTextSuccess: {
    color: "#065F46",
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
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
    color: "#64748B",
    lineHeight: 20,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageItem: {
    width: "47%",
    position: "relative",
    gap: 8,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.7)",
  },
  coverChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D9E2EC",
  },
  coverChipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  coverChipText: {
    color: "#334E68",
    fontSize: 12,
    fontWeight: "800",
  },
  coverChipTextActive: {
    color: "#FFFFFF",
  },
  uploadBox: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
  },
  uploadTitle: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "900",
  },
  uploadText: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
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
  inputMultiline: {
    minHeight: 110,
  },
  helperText: {
    color: "#64748B",
    fontSize: 12,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D9E2EC",
  },
  chipActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  chipText: {
    color: "#334E68",
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 2,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    color: "#102A43",
    fontWeight: "800",
  },
  switchSubtitle: {
    color: "#64748B",
    lineHeight: 18,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: "#0F766E",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  secondaryButtonText: {
    color: "#102A43",
    fontWeight: "900",
  },
});
