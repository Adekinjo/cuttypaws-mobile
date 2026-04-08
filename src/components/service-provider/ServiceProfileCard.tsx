import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  profile?: Record<string, any> | null;
};

function formatCurrency(value?: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatType(value?: string) {
  if (!value) return "Service Provider";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getLocation(profile?: Record<string, any> | null) {
  return [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ");
}

function DetailTile({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string | null;
  onPress?: () => void;
}) {
  if (!value) return null;

  const isFeather = icon in Feather.glyphMap;
  return (
    <View style={styles.detailTile}>
      <View style={styles.detailTop}>
        <View style={styles.detailIcon}>
          {isFeather ? (
            <Feather name={icon as keyof typeof Feather.glyphMap} size={15} color="#1D4ED8" />
          ) : (
            <MaterialCommunityIcons
              name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={16}
              color="#1D4ED8"
            />
          )}
        </View>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text style={[styles.detailValue, styles.link]} numberOfLines={2}>
            {value}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.detailValue} numberOfLines={3}>
          {value}
        </Text>
      )}
    </View>
  );
}

export default function ServiceProfileCard({ profile }: Props) {
  if (!profile) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyTitle}>No service profile yet</Text>
        <Text style={styles.emptyBody}>
          Your approved service details will appear here once the profile is available.
        </Text>
      </View>
    );
  }

  const pricing =
    profile.priceFrom != null || profile.priceTo != null
      ? `${profile.priceFrom != null ? formatCurrency(profile.priceFrom) : "Custom"}${
          profile.priceTo != null ? ` - ${formatCurrency(profile.priceTo)}` : ""
        }`
      : profile.pricingNote || null;
  const serviceType = formatType(profile.serviceType);
  const title = profile.businessName || profile.ownerName || "Service Profile";
  const subhead = [serviceType, getLocation(profile)].filter(Boolean).join(" • ");
  const rating = Number(profile.averageRating || 0).toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <View style={styles.identityRow}>
          {profile.ownerProfileImageUrl ? (
            <Image source={{ uri: profile.ownerProfileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Feather name="user" size={26} color="#1D4ED8" />
            </View>
          )}

          <View style={styles.identityCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {profile.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={13} color="#047857" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.meta}>{subhead}</Text>
            {profile.tagline ? <Text style={styles.tagline}>{profile.tagline}</Text> : null}
          </View>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingRow}>
            <Feather name="star" size={15} color="#F59E0B" />
            <Text style={styles.ratingValue}>{rating} / 5</Text>
          </View>
          <Text style={styles.ratingMeta}>{profile.reviewCount || 0} reviews</Text>
        </View>
      </View>

      {profile.description ? <Text style={styles.description}>{profile.description}</Text> : null}

      <View style={styles.detailGrid}>
        <DetailTile icon="briefcase" label="Service Type" value={serviceType} />
        <DetailTile icon="map-pin" label="Location" value={getLocation(profile)} />
        <DetailTile icon="crosshairs-gps" label="Service Area" value={profile.serviceArea} />
        <DetailTile icon="dollar-sign" label="Pricing" value={pricing} />
        <DetailTile
          icon="clock"
          label="Experience"
          value={profile.yearsOfExperience != null ? `${profile.yearsOfExperience} years` : null}
        />
        <DetailTile
          icon="home"
          label="Home Visits"
          value={profile.acceptsHomeVisits ? "Available" : "Unavailable"}
        />
        <DetailTile
          icon="shield-alert-outline"
          label="Emergency"
          value={profile.offersEmergencyService ? "Available" : "Unavailable"}
        />
        <DetailTile icon="calendar" label="Approved Date" value={formatDate(profile.approvedAt)} />
        <DetailTile
          icon="globe"
          label="Website"
          value={profile.websiteUrl}
          onPress={() => Linking.openURL(profile.websiteUrl)}
        />
        <DetailTile
          icon="message-circle"
          label="WhatsApp"
          value={profile.whatsappNumber}
          onPress={() =>
            Linking.openURL(
              `https://wa.me/${String(profile.whatsappNumber || "").replace(/[^\d]/g, "")}`
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E7ECF5",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#0EA5E9",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },
  header: {
    gap: 16,
    marginBottom: 16,
  },
  identityRow: {
    flexDirection: "row",
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#E8F1FF",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  identityCopy: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#047857",
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
    fontWeight: "700",
  },
  ratingCard: {
    alignSelf: "flex-start",
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#9A3412",
  },
  ratingMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#7C2D12",
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#334155",
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailTile: {
    width: "48%",
    minWidth: 150,
    flexGrow: 1,
    borderRadius: 18,
    backgroundColor: "#F7F9FD",
    padding: 14,
    borderWidth: 1,
    borderColor: "#E7ECF5",
  },
  detailTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  detailValue: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "#0F172A",
    fontWeight: "700",
  },
  link: {
    color: "#1D4ED8",
  },
});
