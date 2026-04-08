import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import ServiceProviderService from "../../api/ServiceProviderService";

type ServiceAd = {
  id?: string | number;
  userId?: string | number;
  businessName?: string;
  ownerName?: string;
  serviceType?: string;
  tagline?: string;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  acceptsHomeVisits?: boolean;
  offersEmergencyService?: boolean;
  yearsOfExperience?: number;
  priceFrom?: number | string;
  priceTo?: number | string;
  coverImageUrl?: string;
  coverMedia?: {
    type?: string;
    url?: string;
    thumbnailUrl?: string;
  };
  serviceMedia?: Array<{
    type?: string;
    url?: string;
    thumbnailUrl?: string;
  }>;
};

export default function ServiceAdsCard({
  serviceAd,
  onPress,
  onNavigate,
}: {
  serviceAd: ServiceAd;
  onPress?: (serviceAd: ServiceAd) => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<any>(null);

  const normalizedServiceAd = useMemo(
    () => ServiceProviderService.normalizeServiceProfile(serviceAd),
    [serviceAd]
  );

  const displayProfile = publicProfile || normalizedServiceAd || serviceAd;
  const profileTitle =
    displayProfile?.businessName || displayProfile?.ownerName || "Service Provider";

  const coverImageUrl = getServiceAdImage(displayProfile);
  const hasCoverImage = Boolean(coverImageUrl && failedCoverUrl !== coverImageUrl);

  const location = [displayProfile?.city, displayProfile?.state, displayProfile?.country]
    .filter(Boolean)
    .join(", ");

  const highlights = [
    displayProfile?.acceptsHomeVisits ? "Home visits available" : null,
    displayProfile?.offersEmergencyService ? "Emergency support" : null,
    displayProfile?.yearsOfExperience
      ? `${displayProfile.yearsOfExperience}+ years experience`
      : null,
  ].filter(Boolean);
  const targetUserId = displayProfile?.userId || serviceAd?.userId;

  const handleLearnMore = (event: any) => {
    event?.stopPropagation?.();
    if (!targetUserId) return;
    onNavigate?.("service-public-profile", { userId: String(targetUserId) });
  };

  useEffect(() => {
    let active = true;

    const loadPublicProfile = async () => {
      if (!serviceAd?.userId) return;

      try {
        const cached = await ServiceProviderService.getCachedPublicServiceProfile(
          String(serviceAd.userId)
        );

        if (cached?.status === 200 && active) {
          setPublicProfile(cached.serviceProfile || null);
        }

        const response = await ServiceProviderService.getPublicServiceProfile(
          String(serviceAd.userId)
        );

        if (active && response?.status === 200) {
          await ServiceProviderService.setCachedPublicServiceProfile(
            String(serviceAd.userId),
            response
          );
          setPublicProfile(response.serviceProfile || null);
        }
      } catch (error) {
        console.error("[ServiceAdsCardMobile] Failed to load public profile", error);
      }
    };

    loadPublicProfile();

    return () => {
      active = false;
    };
  }, [serviceAd?.userId]);

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(displayProfile)}>
      <View style={styles.mediaWrap}>
        <View style={styles.mediaGlow} />
        {hasCoverImage ? (
          <View style={styles.imageStage}>
            <Image
              source={{ uri: coverImageUrl! }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setFailedCoverUrl(coverImageUrl || null)}
            />
          </View>
        ) : (
          <View style={[styles.imageStage, styles.imageFallback]}>
            <MaterialCommunityIcons name="dog-side" size={28} color="#0F766E" />
            <Text style={styles.imageFallbackText} numberOfLines={2}>
              {profileTitle}
            </Text>
          </View>
        )}

        <View style={styles.adBadge}>
          <MaterialCommunityIcons name="bullhorn-outline" size={12} color="#155E75" />
          <Text style={styles.adBadgeText}>Public service ad</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>Trusted local support</Text>
        <Text style={styles.title} numberOfLines={2}>
          {profileTitle}
        </Text>
        <Text style={styles.type} numberOfLines={1}>
          {formatServiceType(displayProfile?.serviceType)}
        </Text>

        {location ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color="#64748B" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}

        <Text style={styles.tagline} numberOfLines={3}>
          {displayProfile?.tagline ||
            displayProfile?.description ||
            "Trusted pet care tailored to your location and service needs."}
        </Text>

        {highlights.length > 0 ? (
          <View style={styles.highlightWrap}>
            {highlights.map((item) => (
              <View key={item} style={styles.highlightChip}>
                <Text style={styles.highlightText}>{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Pricing</Text>
            <Text style={styles.price}>{formatPrice(displayProfile?.priceFrom, displayProfile?.priceTo)}</Text>
          </View>

          <Pressable style={styles.cta} onPress={handleLearnMore}>
            <Text style={styles.ctaText}>Learn More</Text>
            <Feather name="arrow-up-right" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function formatServiceType(value?: string) {
  if (!value) return "Service Provider";

  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPrice(priceFrom?: number | string, priceTo?: number | string) {
  if (priceFrom != null && priceTo != null) {
    return `From $${priceFrom} to $${priceTo}`;
  }
  if (priceFrom != null) {
    return `Starting at $${priceFrom}`;
  }
  if (priceTo != null) {
    return `Up to $${priceTo}`;
  }
  return "Contact for pricing";
}

function getServiceAdImage(profile: any) {
  if (!profile) return null;

  const coverCandidate =
    profile?.coverMedia?.type === "IMAGE"
      ? profile?.coverMedia?.url || profile?.coverMedia?.thumbnailUrl
      : null;

  if (coverCandidate) return coverCandidate;

  const mediaImage = (profile?.serviceMedia || []).find(
    (item: any) => item?.type === "IMAGE" && (item?.url || item?.thumbnailUrl)
  );

  return mediaImage?.url || mediaImage?.thumbnailUrl || profile?.coverImageUrl || null;
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  mediaWrap: {
    position: "relative",
    height: 216,
    padding: 14,
    backgroundColor: "#EAF8F6",
  },
  mediaGlow: {
    position: "absolute",
    top: -20,
    right: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(20, 184, 166, 0.14)",
  },
  imageStage: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DDEEEB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F3FFFD",
  },
  imageFallbackText: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#134E4A",
  },
  adBadge: {
    position: "absolute",
    top: 24,
    left: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(236, 254, 255, 0.94)",
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#155E75",
  },
  content: {
    padding: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#0F766E",
  },
  title: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    color: "#0F172A",
  },
  type: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
  highlightWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  highlightChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#F0FDFA",
  },
  highlightText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F766E",
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#94A3B8",
  },
  price: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#111827",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
