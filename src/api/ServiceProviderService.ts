import ApiService from "./ApiService";
import AuthService from "./AuthService";
import keyValueStorage from "../utils/keyValueStorage";
import { storage } from "../utils/storage";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

const SERVICE_DASHBOARD_KEY = "serviceDashboard";
const PUBLIC_PROFILE_CACHE_PREFIX = "servicePublicProfile_";
const PUBLIC_PROFILE_MEMORY_CACHE = new Map<string, Promise<any> | any>();

function getPublicProfileCacheKey(userId: string) {
  const normalizedUserId = String(userId || "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${PUBLIC_PROFILE_CACHE_PREFIX}${normalizedUserId}`;
}

function compactDashboardForStorage(dashboard: any) {
  if (!dashboard || typeof dashboard !== "object") return dashboard;

  const serviceProfile = dashboard?.serviceProfile
    ? {
        userId: dashboard.serviceProfile.userId,
        ownerId: dashboard.serviceProfile.ownerId,
        businessName: dashboard.serviceProfile.businessName,
        ownerName: dashboard.serviceProfile.ownerName,
        ownerProfileImageUrl: dashboard.serviceProfile.ownerProfileImageUrl,
        coverImageUrl: dashboard.serviceProfile.coverImageUrl,
        serviceType: dashboard.serviceProfile.serviceType,
        city: dashboard.serviceProfile.city,
        state: dashboard.serviceProfile.state,
        country: dashboard.serviceProfile.country,
        tagline: dashboard.serviceProfile.tagline,
        description: dashboard.serviceProfile.description,
        serviceArea: dashboard.serviceProfile.serviceArea,
        licenseNumber: dashboard.serviceProfile.licenseNumber,
        pricingNote: dashboard.serviceProfile.pricingNote,
        priceFrom: dashboard.serviceProfile.priceFrom,
        priceTo: dashboard.serviceProfile.priceTo,
        yearsOfExperience: dashboard.serviceProfile.yearsOfExperience,
        averageRating: dashboard.serviceProfile.averageRating,
        reviewCount: dashboard.serviceProfile.reviewCount,
        isVerified: dashboard.serviceProfile.isVerified,
        offersEmergencyService: dashboard.serviceProfile.offersEmergencyService,
        acceptsHomeVisits: dashboard.serviceProfile.acceptsHomeVisits,
        websiteUrl: dashboard.serviceProfile.websiteUrl,
        whatsappNumber: dashboard.serviceProfile.whatsappNumber,
        approvedAt: dashboard.serviceProfile.approvedAt,
        sponsoredUntil: dashboard.serviceProfile.sponsoredUntil,
        serviceMedia: ServiceProviderService.normalizeServiceMediaCollection(
          dashboard.serviceProfile
        ).slice(0, 8),
      }
    : null;

  const activeAdSubscription = dashboard?.activeAdSubscription
    ? {
        isActive: dashboard.activeAdSubscription.isActive,
        amount: dashboard.activeAdSubscription.amount,
        endsAt: dashboard.activeAdSubscription.endsAt,
        planType: dashboard.activeAdSubscription.planType,
      }
    : null;

  const bookingSummary = dashboard?.bookingSummary
    ? {
        totalBookings: dashboard.bookingSummary.totalBookings,
        monthlyEarnings: dashboard.bookingSummary.monthlyEarnings,
      }
    : null;

  const stats = dashboard?.stats
    ? {
        totalBookings: dashboard.stats.totalBookings,
        monthlyEarnings: dashboard.stats.monthlyEarnings,
        profileViews: dashboard.stats.profileViews,
      }
    : null;

  return {
    status: dashboard.status,
    statusMessage: dashboard.statusMessage,
    rejectionReason: dashboard.rejectionReason,
    canAccessDashboard: dashboard.canAccessDashboard,
    serviceProfile,
    activeAdSubscription,
    bookingSummary,
    stats,
  };
}

export default class ServiceProviderService extends ApiService {
  static normalizeServiceMediaItem(item: any, index = 0) {
    if (!item) return null;

    const url =
      item.url ||
      item.mediaUrl ||
      item.fileUrl ||
      item.secureUrl ||
      item.coverUrl ||
      null;

    if (!url) return null;

    const rawType = String(
      item.type ||
        item.mediaType ||
        item.fileType ||
        item.resourceType ||
        (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? "VIDEO" : "IMAGE")
    ).toUpperCase();

    return {
      id: item.id || item.mediaId || item.uuid || `${url}-${index}`,
      url,
      type: rawType.includes("VIDEO") ? "VIDEO" : "IMAGE",
      isCover: Boolean(item.isCover || item.cover || item.featured || item.primary),
      thumbnailUrl: item.thumbnailUrl || item.previewUrl || url,
      alt: item.alt || item.caption || item.title || "Service media",
    };
  }

  static normalizeServiceMediaCollection(payload: any) {
    const derivedCoverItem =
      payload?.coverMediaUrl || payload?.coverImageUrl
        ? [
            {
              id: payload?.coverMediaId || payload?.coverImageId || "cover-media",
              mediaUrl: payload?.coverMediaUrl || payload?.coverImageUrl,
              mediaType: payload?.coverMediaType || payload?.coverImageType || "IMAGE",
              isCover: true,
            },
          ]
        : [];

    const collection = [
      ...(Array.isArray(payload) ? payload : []),
      ...derivedCoverItem,
      ...(Array.isArray(payload?.serviceMedia) ? payload.serviceMedia : []),
      ...(Array.isArray(payload?.serviceMediaList) ? payload.serviceMediaList : []),
      ...(Array.isArray(payload?.serviceMedias) ? payload.serviceMedias : []),
      ...(Array.isArray(payload?.media) ? payload.media : []),
      ...(Array.isArray(payload?.mediaItems) ? payload.mediaItems : []),
      ...(Array.isArray(payload?.gallery) ? payload.gallery : []),
      ...(Array.isArray(payload?.galleryMedia) ? payload.galleryMedia : []),
      ...(Array.isArray(payload?.items) ? payload.items : []),
      ...(Array.isArray(payload?.data) ? payload.data : []),
    ];

    const seen = new Set<string>();

    return collection
      .map((item, index) => this.normalizeServiceMediaItem(item, index))
      .filter((item): item is NonNullable<typeof item> => {
        if (!item?.url) return false;
        const key = `${item.id}-${item.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  static normalizeServiceProfile(profile: any) {
    if (!profile) return profile;
    const serviceMedia = this.normalizeServiceMediaCollection(profile);
    const coverMedia = serviceMedia.find((item) => item.isCover) || serviceMedia[0] || null;

    return {
      ...profile,
      serviceMedia,
      coverMedia,
    };
  }

  static async isServiceProviderAccount() {
    const user = await AuthService.getStoredUser();
    const role = await storage.getRole();

    return Boolean(
      user?.isServiceProvider ||
        user?.role === "ROLE_SERVICE" ||
        user?.role === "ROLE_SERVICE_PROVIDER" ||
        user?.userRole === "ROLE_SERVICE" ||
        user?.userRole === "ROLE_SERVICE_PROVIDER" ||
        role === "ROLE_SERVICE" ||
        role === "ROLE_SERVICE_PROVIDER"
    );
  }

  static async registerServiceProvider(payload: Record<string, any>) {
    const response = await this.client.post("/auth/register-service-provider", payload);
    return response.data;
  }

  static async getMyServiceProfile() {
    const response = await this.client.get("/services/my-profile");
    if (response.data && typeof response.data === "object") {
      response.data.serviceProfile = this.normalizeServiceProfile(
        response.data?.serviceProfile
      );
    }
    return response.data;
  }

  static async updateMyServiceProfile(payload: Record<string, any>) {
    const response = await this.client.put("/services/my-profile", payload);
    if (response.data && typeof response.data === "object") {
      response.data.serviceProfile = this.normalizeServiceProfile(
        response.data?.serviceProfile
      );
    }
    return response.data;
  }

  static async getMyServiceDashboard() {
    const response = await this.client.get("/services/my-dashboard", {
      validateStatus: () => true,
    });
    return response.data;
  }

  static async getPublicServiceProfile(userId: string) {
    if (PUBLIC_PROFILE_MEMORY_CACHE.has(userId)) {
      return PUBLIC_PROFILE_MEMORY_CACHE.get(userId);
    }

    const request = this.client
      .get(`/services/public/${userId}`, { validateStatus: () => true })
      .then((response) => {
        if (response.data && typeof response.data === "object") {
          response.data.serviceProfile = this.normalizeServiceProfile(
            response.data?.serviceProfile
          );
        }
        return response.data;
      })
      .finally(() => {
        PUBLIC_PROFILE_MEMORY_CACHE.delete(userId);
      });

    PUBLIC_PROFILE_MEMORY_CACHE.set(userId, request);
    return request;
  }

  static async uploadMyServiceMedia(files: ReactNativeFile[]) {
    const formData = new FormData();
    (files || []).forEach((file) => {
      formData.append("files", file as unknown as Blob);
    });

    const response = await this.client.post("/services/my-profile/media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: () => true,
    });
    return response.data;
  }

  static async getMyServiceMedia() {
    const response = await this.client.get("/services/my-profile/media", {
      validateStatus: () => true,
    });

    return {
      ...response.data,
      serviceMedia: this.normalizeServiceMediaCollection(response.data),
    };
  }

  static async deleteMyServiceMedia(mediaId: string) {
    const response = await this.client.delete(`/services/my-profile/media/${mediaId}`, {
      validateStatus: () => true,
    });
    return response.data;
  }

  static async setMyServiceMediaCover(mediaId: string) {
    const response = await this.client.post(
      `/services/my-profile/media/${mediaId}/cover`,
      {},
      { validateStatus: () => true }
    );
    return response.data;
  }

  static async getPendingServiceRegistrations() {
    const response = await this.client.get("/services/admin/pending");
    return response.data;
  }

  static async approveServiceRegistration(userId: string) {
    const response = await this.client.post(`/services/admin/${userId}/approve`, {});
    return response.data;
  }

  static async rejectServiceRegistration(userId: string, reason: string) {
    const response = await this.client.post(
      `/services/admin/${userId}/reject`,
      {},
      { params: { reason } }
    );
    return response.data;
  }

  static async getServiceReviews(serviceUserId: string) {
    const response = await this.client.get(`/service-reviews/${serviceUserId}`, {
      validateStatus: () => true,
    });
    return response.data;
  }

  static async createOrUpdateReview(serviceUserId: string, payload: Record<string, any>) {
    const response = await this.client.post(`/service-reviews/${serviceUserId}`, payload);
    return response.data;
  }

  static async createAdSubscription(payload: Record<string, any>) {
    const response = await this.client.post("/service-ads/my-subscriptions", payload, {
      validateStatus: () => true,
    });
    return response.data;
  }

  static async confirmAdPayment(payload: Record<string, any>) {
    const response = await this.client.post(
      "/service-ads/my-subscriptions/confirm-payment",
      payload,
      { validateStatus: () => true }
    );
    return response.data;
  }

  static async getAdSubscriptions() {
    const response = await this.client.get("/service-ads/my-subscriptions");
    return response.data;
  }

  static async getActiveAdSubscription() {
    const response = await this.client.get("/service-ads/my-subscriptions/active");
    return response.data;
  }

  static async getStoredDashboard() {
    try {
      const raw = await keyValueStorage.getItem(SERVICE_DASHBOARD_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  static async setStoredDashboard(value: any) {
    if (!value) {
      await keyValueStorage.removeItem(SERVICE_DASHBOARD_KEY);
      return;
    }

    const compactValue = compactDashboardForStorage(value);
    const serialized = JSON.stringify(compactValue);

    await keyValueStorage.setItem(SERVICE_DASHBOARD_KEY, serialized);
  }

  static async clearStoredDashboard() {
    await keyValueStorage.removeItem(SERVICE_DASHBOARD_KEY);
  }

  static async refreshDashboard() {
    if (!(await this.isServiceProviderAccount())) {
      await this.clearStoredDashboard();
      return null;
    }

    const response = await this.getMyServiceDashboard();
    const dashboard = response?.serviceDashboard || null;
    await this.setStoredDashboard(dashboard);
    return dashboard;
  }

  static async getCachedPublicServiceProfile(userId: string) {
    try {
      const raw = await keyValueStorage.getItem(getPublicProfileCacheKey(userId));
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        parsed.serviceProfile = this.normalizeServiceProfile(parsed?.serviceProfile);
      }
      return parsed;
    } catch {
      return null;
    }
  }

  static async setCachedPublicServiceProfile(userId: string, payload: any) {
    const normalizedPayload =
      payload && typeof payload === "object"
        ? {
            ...payload,
            serviceProfile: this.normalizeServiceProfile(payload?.serviceProfile),
          }
        : payload;

    await keyValueStorage.setItem(
      getPublicProfileCacheKey(userId),
      JSON.stringify(normalizedPayload)
    );
  }
}
