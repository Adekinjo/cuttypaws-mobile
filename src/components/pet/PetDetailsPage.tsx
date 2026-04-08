import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PetService from "../../api/PetService";

type PetRecord = {
  id?: string | number;
  name?: string;
  type?: string;
  breed?: string;
  age?: string | number;
  gender?: string;
  description?: string;
  size?: string;
  color?: string;
  activityLevel?: string;
  temperament?: string;
  vaccinated?: boolean;
  neutered?: boolean;
  specialNeeds?: string;
  city?: string;
  state?: string;
  country?: string;
  tags?: string[];
  imageUrls?: string[];
};

const yesNo = (value?: boolean) => (value ? "Yes" : "No");

export default function PetDetailsPage({
  petId,
  onNavigate,
}: {
  petId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [pet, setPet] = useState<PetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchPet = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await PetService.getPet(petId);
        const petData = response?.pet || response?.data?.pet || response?.data || response;

        if (!petData || !petData.id) {
          throw new Error("Pet not found.");
        }

        if (!mounted) return;
        setPet(petData);
      } catch (fetchError: any) {
        if (!mounted) return;
        setError(fetchError?.message || "Unable to load pet details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPet();
    return () => {
      mounted = false;
    };
  }, [petId]);

  const images = useMemo(() => {
    if (!pet) return [];
    return Array.isArray(pet.imageUrls) ? pet.imageUrls.filter(Boolean) : [];
  }, [pet]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Loading pet profile...</Text>
          <Text style={styles.centerText}>Fetching details, photos, and care information.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pet) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={styles.errorIconWrap}>
            <Feather name="alert-triangle" size={22} color="#991B1B" />
          </View>
          <Text style={styles.centerTitle}>Unable to open pet profile</Text>
          <Text style={styles.centerText}>{error || "Pet not found."}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => onNavigate?.("customer-profile")}
          >
            <Text style={styles.primaryButtonText}>Back to Profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topActionRow}>
          <Pressable style={styles.backButton} onPress={() => onNavigate?.("customer-profile")}>
            <Feather name="arrow-left" size={18} color="#DBEAFE" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            style={styles.editButton}
            onPress={() => onNavigate?.("edit-pet", { petId: pet.id })}
          >
            <Feather name="edit-3" size={16} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Pet</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="paw" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>{pet.type || "Pet"}</Text>
            </View>

            {pet.breed ? (
              <View style={styles.secondaryBadge}>
                <Text style={styles.secondaryBadgeText}>{pet.breed}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.heroTitle}>{pet.name || "Unnamed Pet"}</Text>
          <Text style={styles.heroSubtitle}>
            {pet.description || "A lovely member of the CuttyPaws family."}
          </Text>

          <View style={styles.metricGrid}>
            <MetricCard label="Age" value={String(pet.age || "N/A")} />
            <MetricCard label="Gender" value={pet.gender || "N/A"} />
            <MetricCard label="Size" value={pet.size || "N/A"} />
            <MetricCard label="Activity" value={pet.activityLevel || "N/A"} />
          </View>
        </View>

        <View style={styles.galleryCard}>
          {images.length > 0 ? (
            <>
              <Image source={{ uri: images[activeImageIndex] }} style={styles.mainImage} />
              {images.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                >
                  {images.map((url, index) => (
                    <Pressable
                      key={`${url}-${index}`}
                      onPress={() => setActiveImageIndex(index)}
                      style={[
                        styles.thumbnailWrap,
                        index === activeImageIndex && styles.thumbnailWrapActive,
                      ]}
                    >
                      <Image source={{ uri: url }} style={styles.thumbnailImage} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : (
            <View style={styles.imageFallback}>
              <MaterialCommunityIcons name="paw-outline" size={54} color="#94A3B8" />
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About {pet.name || "this pet"}</Text>
          <Text style={styles.sectionBody}>
            {pet.description || "No additional description provided yet."}
          </Text>

          <View style={styles.tagWrap}>
            {pet.temperament ? <Tag label={`Temperament: ${pet.temperament}`} tone="neutral" /> : null}
            {pet.color ? <Tag label={`Color: ${pet.color}`} tone="neutral" /> : null}
            {pet.specialNeeds ? <Tag label={`Special needs: ${pet.specialNeeds}`} tone="warning" /> : null}
            {Array.isArray(pet.tags)
              ? pet.tags.map((tag) => <Tag key={tag} label={`#${tag}`} tone="dark" />)
              : null}
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Health</Text>
            <InfoRow label="Vaccinated" value={yesNo(pet.vaccinated)} />
            <InfoRow label="Neutered" value={yesNo(pet.neutered)} />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Location</Text>
            <Text style={styles.locationText}>
              {[pet.city, pet.state, pet.country].filter(Boolean).join(", ") || "No location provided."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  );
}

function Tag({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "warning" | "dark";
}) {
  return (
    <View
      style={[
        styles.tag,
        tone === "warning" && styles.tagWarning,
        tone === "dark" && styles.tagDark,
      ]}
    >
      <Text
        style={[
          styles.tagText,
          tone === "warning" && styles.tagTextWarning,
          tone === "dark" && styles.tagTextDark,
        ]}
      >
        {label}
      </Text>
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
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: "#F5FAF8",
  },
  centerTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  centerText: {
    color: "#486581",
    lineHeight: 22,
    textAlign: "center",
  },
  errorIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  topActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#102A43",
  },
  backButtonText: {
    color: "#DBEAFE",
    fontWeight: "800",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#0F766E",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
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
    bottom: -42,
    left: -20,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.14)",
  },
  heroBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
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
  secondaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  secondaryBadgeText: {
    color: "#E2E8F0",
    fontWeight: "800",
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
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    minWidth: 120,
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  metricLabel: {
    color: "#99F6E4",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  galleryCard: {
    borderRadius: 24,
    padding: 14,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  mainImage: {
    width: "100%",
    height: 320,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
  },
  thumbnailRow: {
    gap: 10,
  },
  thumbnailWrap: {
    width: 82,
    height: 82,
    borderRadius: 16,
    padding: 3,
    backgroundColor: "#E2E8F0",
  },
  thumbnailWrapActive: {
    backgroundColor: "#0F766E",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  imageFallback: {
    height: 280,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
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
  sectionBody: {
    color: "#486581",
    lineHeight: 22,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagWarning: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  tagDark: {
    backgroundColor: "#102A43",
    borderColor: "#102A43",
  },
  tagText: {
    color: "#334E68",
    fontWeight: "800",
    fontSize: 12,
  },
  tagTextWarning: {
    color: "#92400E",
  },
  tagTextDark: {
    color: "#F8FAFC",
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  infoTitle: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "900",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  infoRowLabel: {
    color: "#64748B",
    fontWeight: "700",
  },
  infoRowValue: {
    color: "#102A43",
    fontWeight: "800",
  },
  locationText: {
    color: "#486581",
    lineHeight: 22,
  },
  primaryButton: {
    minWidth: 170,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
