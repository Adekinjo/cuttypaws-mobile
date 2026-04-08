import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ApiService from "../../api/ApiService";
import ServiceProviderService from "../../api/ServiceProviderService";
import ServiceBookingModal from "./ServiceBookingModal";
import ServiceMediaGallery from "./ServiceMediaGallery";

type Review = {
  id?: string | number;
  rating?: number;
  comment?: string;
  userName?: string;
  createdAt?: string;
};

type MediaItem = {
  id?: string | number;
  url?: string;
  type?: string;
  isCover?: boolean;
  thumbnailUrl?: string;
};

type ServiceProfile = {
  id?: string | number;
  businessName?: string;
  ownerName?: string;
  ownerProfileImageUrl?: string;
  coverImageUrl?: string;
  serviceType?: string;
  city?: string;
  state?: string;
  country?: string;
  tagline?: string;
  description?: string;
  serviceArea?: string;
  licenseNumber?: string;
  pricingNote?: string;
  priceFrom?: number | null;
  priceTo?: number | null;
  yearsOfExperience?: number | null;
  averageRating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  offersEmergencyService?: boolean;
  acceptsHomeVisits?: boolean;
  sponsoredUntil?: string;
  coverMedia?: MediaItem | null;
  serviceMedia?: MediaItem[];
};

const formatCurrency = (value?: number | null) => {
  if (value == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

const formatServiceType = (value?: string) => {
  if (!value) return "Service Provider";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const formatDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ServicePublicProfilePage({
  userId,
  onNavigate,
}: {
  userId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [profile, setProfile] = useState<ServiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [bookingNotice, setBookingNotice] = useState("");

  useEffect(() => {
    loadProfile();
  }, [userId]);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await ServiceProviderService.getPublicServiceProfile(userId);

      if (!response || response.status >= 400 || !response.serviceProfile) {
        setError(response?.message || "Service profile not available.");
        return;
      }

      setProfile(response.serviceProfile);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Unable to load service profile.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      setReviewsLoading(true);
      const response = await ServiceProviderService.getServiceReviews(userId);

      if (!response || response.status >= 400) {
        setReviewError(response?.message || "Unable to load reviews.");
        setReviews([]);
        return;
      }

      setReviews(response?.serviceReviews || []);
      setReviewError("");
    } catch (err: any) {
      console.error(err);
      setReviewError(err?.response?.data?.message || err?.message || "Unable to load reviews.");
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleSubmitReview() {
    if (!(await ApiService.isAuthenticated())) {
      onNavigate?.("login");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await ServiceProviderService.createOrUpdateReview(userId, reviewForm);

      if (!response || response.status >= 400) {
        setReviewError(response?.message || "Unable to submit review.");
        return;
      }

      const [refreshedReviews, refreshedProfile] = await Promise.all([
        ServiceProviderService.getServiceReviews(userId),
        ServiceProviderService.getPublicServiceProfile(userId),
      ]);

      setReviews(refreshedReviews?.serviceReviews || []);
      setProfile(refreshedProfile?.serviceProfile || profile);
      setReviewForm({ rating: 5, comment: "" });
      setReviewError("");
    } catch (err: any) {
      console.error(err);
      setReviewError(err?.response?.data?.message || err?.message || "Unable to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  const priceText = useMemo(() => {
    if (!profile) return "";
    if (profile.priceFrom != null && profile.priceTo != null) {
      return `${formatCurrency(profile.priceFrom)} - ${formatCurrency(profile.priceTo)}`;
    }
    if (profile.priceFrom != null) {
      return `Starting at ${formatCurrency(profile.priceFrom)}`;
    }
    if (profile.priceTo != null) {
      return `Up to ${formatCurrency(profile.priceTo)}`;
    }
    return "Contact for pricing";
  }, [profile]);

  const locationText = useMemo(
    () => [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", "),
    [profile]
  );

  const headline =
    profile?.tagline || `Trusted ${formatServiceType(profile?.serviceType)} for pet owners`;
  const profileTitle = profile?.businessName || profile?.ownerName || "Service Provider";
  const featuredUntil = formatDate(profile?.sponsoredUntil);
  const heroMedia = profile?.coverMedia;
  const logoUrl =
    profile?.ownerProfileImageUrl ||
    profile?.coverImageUrl ||
    profile?.coverMedia?.thumbnailUrl ||
    profile?.coverMedia?.url ||
    "https://via.placeholder.com/160x160?text=CuttyPaws";

  const highlights = [
    profile?.acceptsHomeVisits ? "Home visits available" : null,
    profile?.offersEmergencyService ? "Emergency support offered" : null,
    profile?.yearsOfExperience ? `${profile.yearsOfExperience}+ years experience` : null,
    profile?.licenseNumber ? "Licensed provider" : null,
    priceText,
  ].filter(Boolean) as string[];

  const bookingAmount = useMemo(() => {
    if (profile?.priceFrom != null) return Number(profile.priceFrom);
    if (profile?.priceTo != null) return Number(profile.priceTo);
    return 0;
  }, [profile]);

  async function handleOpenBookingModal() {
    if (!(await ApiService.isAuthenticated())) {
      onNavigate?.("login");
      return;
    }

    setShowBookingModal(true);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.centerTitle}>Loading service profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>Service profile unavailable</Text>
          <Text style={styles.centerCopy}>{error || "Service profile not found."}</Text>
          <Pressable style={styles.primaryButton} onPress={() => onNavigate?.("back")}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
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
        <Pressable style={styles.backButton} onPress={() => onNavigate?.("back")}>
          <Feather name="arrow-left" size={18} color="#0F172A" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <View style={styles.heroCard}>
          <View style={styles.headerBranding}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <ServiceAvatar uri={logoUrl} />
              </View>
              {profile.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <View style={styles.metaCopy}>
              <View style={styles.metaTop}>
                <Text style={styles.sponsoredText}>Sponsored</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.platformText}>CuttyPaws promoted listing</Text>
              </View>
              <Text style={styles.profileTitle}>{profileTitle}</Text>
              <Text style={styles.profileSubtitle}>
                {formatServiceType(profile.serviceType)}
                {locationText ? ` • ${locationText}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {profile.isVerified ? (
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            ) : null}
            {featuredUntil ? (
              <View style={styles.featuredPill}>
                <Text style={styles.featuredPillText}>Featured until {featuredUntil}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>Promoted service</Text>
              <Text style={styles.heroHeadline}>{headline}</Text>
              <Text style={styles.heroDescription}>
                {profile.description ||
                  "Professional pet care tailored to your routine, location, and service needs."}
              </Text>

              <View style={styles.highlightRow}>
                {highlights.map((item) => (
                  <View key={item} style={styles.highlightPill}>
                    <Text style={styles.highlightPillText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.visualCard}>
              <ServiceMediaGallery media={heroMedia ? [heroMedia] : []} title={profileTitle} compact />
              <View style={styles.visualOverlay}>
                <Text style={styles.visualPrice}>{priceText}</Text>
                <View style={styles.visualRating}>
                  <Feather name="star" size={12} color="#FACC15" />
                  <Text style={styles.visualRatingText}>
                    {profile.averageRating?.toFixed?.(1) || "0.0"}
                  </Text>
                  <Text style={styles.visualRatingMeta}>({profile.reviewCount || 0} reviews)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {bookingNotice ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeBannerText}>{bookingNotice}</Text>
          </View>
        ) : null}

        <View style={styles.gridCard}>
          <SectionTitle title="At a glance" />
          <View style={styles.statGrid}>
            <StatCard label="Service" value={formatServiceType(profile.serviceType)} />
            <StatCard label="Price" value={priceText} />
            <StatCard
              label="Experience"
              value={`${profile.yearsOfExperience || 0}+ years`}
            />
            <StatCard
              label="Rating"
              value={`${profile.averageRating?.toFixed?.(1) || "0.0"} / 5`}
            />
          </View>
        </View>

        <View style={styles.gridCard}>
          <SectionTitle title="Why people click this ad" />
          <View style={styles.reasonList}>
            <ReasonRow
              icon="map-pin"
              text={profile.serviceArea || locationText || "Service area available on request"}
            />
            <ReasonRow
              icon="shield"
              text={
                profile.licenseNumber
                  ? "Licensed and professionally listed"
                  : "Professional provider profile on CuttyPaws"
              }
            />
            <ReasonRow
              icon="clock"
              text={
                profile.offersEmergencyService
                  ? "Fast-response emergency support available"
                  : "Reliable scheduling for regular care"
              }
            />
          </View>
        </View>

        <View style={styles.gridCard}>
          <SectionTitle title="Gallery" />
          <ServiceMediaGallery
            media={profile.serviceMedia || []}
            title={profileTitle}
            emptyLabel="This provider has not uploaded promo media yet."
          />
        </View>

        <View style={styles.aboutGrid}>
          <View style={styles.storyCard}>
            <SectionTitle title="About this provider" />
            <Text style={styles.storyText}>
              {profile.description || "No description provided yet."}
            </Text>
            {profile.pricingNote ? (
              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>Pricing note</Text>
                <Text style={styles.noteText}>{profile.pricingNote}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.contactCard}>
            <SectionTitle title="Book on CuttyPaws" />
            <Text style={styles.contactText}>
              To protect bookings and keep payments traceable, provider contact actions stay inside the platform.
            </Text>

            <View style={styles.contactPills}>
              <ContactPill
                icon="shield-checkmark-outline"
                text="Secure payment flow"
              />
              <ContactPill icon="calendar-outline" text="Tracked booking schedule" />
              <ContactPill icon="receipt-outline" text="Platform booking record" />
            </View>

            <Pressable style={styles.bookButton} onPress={handleOpenBookingModal}>
              <Text style={styles.bookButtonText}>Book and Pay on CuttyPaws</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.gridCard}>
          <SectionTitle title="Customer reviews" />

          <View style={styles.reviewComposer}>
            <Text style={styles.reviewComposerTitle}>Share your experience</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <Pressable
                  key={rating}
                  onPress={() =>
                    setReviewForm((current) => ({ ...current, rating }))
                  }
                >
                  <Feather
                    name="star"
                    size={22}
                    color={rating <= reviewForm.rating ? "#FACC15" : "#CBD5E1"}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={reviewForm.comment}
              onChangeText={(comment) => setReviewForm((current) => ({ ...current, comment }))}
              placeholder="Write a review about your booking experience"
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.reviewInput}
              textAlignVertical="top"
            />

            {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}

            <Pressable
              style={styles.submitReviewButton}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitReviewButtonText}>Submit review</Text>
              )}
            </Pressable>
          </View>

          {reviewsLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#0F766E" />
            </View>
          ) : reviews.length ? (
            <View style={styles.reviewList}>
              {reviews.map((review) => (
                <View key={String(review.id)} style={styles.reviewCard}>
                  <View style={styles.reviewTopRow}>
                    <View>
                      <Text style={styles.reviewUser}>{review.userName || "CuttyPaws user"}</Text>
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt) || "Recent review"}</Text>
                    </View>
                    <View style={styles.reviewRatingPill}>
                      <Feather name="star" size={12} color="#FACC15" />
                      <Text style={styles.reviewRatingText}>{review.rating || 0}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment || "No comment provided."}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyReviewCard}>
              <Text style={styles.emptyReviewText}>No reviews yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ServiceBookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        serviceProfile={profile}
        defaultAmount={bookingAmount}
        onNavigate={onNavigate}
        onBookingCreated={(booking) => {
          setBookingNotice(
            booking?.paymentReference
              ? `Booking confirmed for reference ${booking.paymentReference}.`
              : "Booking payment completed successfully."
          );
        }}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function ServiceAvatar({ uri }: { uri: string }) {
  return (
    <View style={styles.avatarImageWrap}>
      <View style={styles.avatarImagePlaceholder}>
        <Text style={styles.avatarEmoji}>🐾</Text>
      </View>
      <Image source={{ uri }} style={styles.avatarImageReal} />
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ReasonRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.reasonRow}>
      <Feather name={icon} size={15} color="#0F766E" />
      <Text style={styles.reasonText}>{text}</Text>
    </View>
  );
}

function ContactPill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.contactPill}>
      <Ionicons name={icon} size={15} color="#0F172A" />
      <Text style={styles.contactPillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4FAF7",
  },
  screen: {
    flex: 1,
  },
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
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  heroCard: {
    borderRadius: 30,
    padding: 20,
    backgroundColor: "#0F172A",
    gap: 16,
  },
  headerBranding: {
    gap: 14,
  },
  avatarWrap: {
    alignSelf: "flex-start",
    position: "relative",
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  avatarImageWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
    overflow: "hidden",
    backgroundColor: "#1E293B",
  },
  avatarImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  avatarImageReal: {
    width: "100%",
    height: "100%",
  },
  verifiedBadge: {
    position: "absolute",
    right: -4,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  metaCopy: {
    gap: 6,
  },
  metaTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sponsoredText: {
    color: "#FDE68A",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dot: {
    color: "#CBD5E1",
  },
  platformText: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  profileTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  profileSubtitle: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  verifiedPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#DCFCE7",
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#166534",
  },
  featuredPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
  },
  featuredPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
  },
  heroBody: {
    gap: 16,
  },
  heroCopy: {
    gap: 10,
  },
  heroKicker: {
    color: "#99F6E4",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroHeadline: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  heroDescription: {
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 22,
  },
  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  highlightPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  highlightPillText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
  },
  visualCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  visualOverlay: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  visualPrice: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  visualRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  visualRatingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  visualRatingMeta: {
    color: "#CBD5E1",
    fontSize: 12,
  },
  noticeBanner: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#DBEAFE",
  },
  noticeBannerText: {
    color: "#1D4ED8",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  gridCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
    gap: 14,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "900",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47.8%",
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    marginTop: 6,
    color: "#102A43",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  reasonList: {
    gap: 12,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  reasonText: {
    flex: 1,
    color: "#486581",
    fontSize: 14,
    lineHeight: 21,
  },
  aboutGrid: {
    gap: 16,
  },
  storyCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
    gap: 14,
  },
  storyText: {
    color: "#486581",
    fontSize: 14,
    lineHeight: 22,
  },
  noteCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFF7ED",
  },
  noteTitle: {
    color: "#9A3412",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  noteText: {
    marginTop: 6,
    color: "#7C2D12",
    fontSize: 13,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "#0F766E",
    gap: 14,
  },
  contactText: {
    color: "#E6FFFB",
    fontSize: 14,
    lineHeight: 22,
  },
  contactPills: {
    gap: 10,
  },
  contactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#CCFBF1",
  },
  contactPillText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  bookButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  bookButtonText: {
    color: "#0F766E",
    fontSize: 14,
    fontWeight: "900",
  },
  reviewComposer: {
    gap: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  reviewComposerTitle: {
    color: "#102A43",
    fontSize: 15,
    fontWeight: "900",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
  },
  reviewInput: {
    minHeight: 110,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
    color: "#102A43",
    fontSize: 14,
  },
  reviewError: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
  },
  submitReviewButton: {
    alignSelf: "flex-start",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
  },
  submitReviewButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  reviewUser: {
    color: "#102A43",
    fontSize: 14,
    fontWeight: "900",
  },
  reviewDate: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
  },
  reviewRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFF7ED",
  },
  reviewRatingText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "800",
  },
  reviewComment: {
    marginTop: 10,
    color: "#486581",
    fontSize: 13,
    lineHeight: 20,
  },
  emptyReviewCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  emptyReviewText: {
    color: "#64748B",
    fontSize: 13,
  },
});
