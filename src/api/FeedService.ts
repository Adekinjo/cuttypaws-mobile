import ApiService from "./ApiService";

type GetMixedFeedParams = {
  cursorCreatedAt?: string | null;
  cursorId?: number | null;
  limit?: number;
  timeoutMs?: number;
};

type GetVideoFeedParams = {
  cursorCreatedAt?: string | null;
  cursorId?: number | null;
  limit?: number;
};

export default class FeedService extends ApiService {
  static normalizeMixedFeedItems(data: any) {
    if (!data) return [];

    const payload =
      (data &&
      typeof data === "object" &&
      !Array.isArray(data?.data)
        ? data?.data
        : null) ||
      data?.payload ||
      data?.result ||
      data?.response ||
      data;

    const directItems = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.feedItems)
        ? payload.feedItems
        : Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload?.records)
            ? payload.records
            : Array.isArray(payload)
              ? payload
              : null;

    if (directItems) {
      return directItems.map((item: any, index: number) => {
        const normalizedType = String(item?.type || "").toUpperCase();

        if (normalizedType === "POST") {
          return {
            type: "POST",
            post: item.post || item,
            _debugIndex: index,
          };
        }

        if (normalizedType === "SERVICE_AD") {
          return {
            type: "SERVICE_AD",
            serviceAd: item.serviceAd || item,
            _debugIndex: index,
          };
        }

        if (
          normalizedType === "PRODUCT_RECOMMENDATION" ||
          normalizedType === "PRODUCT"
        ) {
          return {
            type: "PRODUCT_RECOMMENDATION",
            product: item.product || item,
            _debugIndex: index,
          };
        }

        if (item?.post || item?.caption || item?.ownerId || item?.postId) {
          return {
            type: "POST",
            post: item.post || item,
            _debugIndex: index,
          };
        }

        if (
          item?.serviceAd ||
          item?.serviceProfile ||
          item?.serviceType ||
          item?.businessName ||
          item?.ownerName
        ) {
          return {
            type: "SERVICE_AD",
            serviceAd: item.serviceAd || item.serviceProfile || item,
            _debugIndex: index,
          };
        }

        if (
          item?.product ||
          item?.productRecommendation ||
          item?.productName ||
          item?.productId ||
          item?.price != null ||
          item?.newPrice != null
        ) {
          return {
            type: "PRODUCT_RECOMMENDATION",
            product: item.product || item.productRecommendation || item,
            _debugIndex: index,
          };
        }

        return { ...item, _debugIndex: index };
      });
    }

    return [
      ...(Array.isArray(payload?.posts)
        ? payload.posts.map((post: any, index: number) => ({
            type: "POST",
            post,
            _debugIndex: index,
          }))
        : []),

      ...(Array.isArray(payload?.postList)
        ? payload.postList.map((post: any, index: number) => ({
            type: "POST",
            post,
            _debugIndex: index,
          }))
        : []),

      ...(Array.isArray(payload?.serviceAds)
        ? payload.serviceAds.map((serviceAd: any, index: number) => ({
            type: "SERVICE_AD",
            serviceAd,
            _debugIndex: index,
          }))
        : []),

      ...(Array.isArray(payload?.services)
        ? payload.services.map((serviceAd: any, index: number) => ({
            type: "SERVICE_AD",
            serviceAd,
            _debugIndex: index,
          }))
        : []),

      ...(Array.isArray(payload?.products)
        ? payload.products.map((product: any, index: number) => ({
            type: "PRODUCT_RECOMMENDATION",
            product,
            _debugIndex: index,
          }))
        : []),

      ...(Array.isArray(payload?.productRecommendations)
        ? payload.productRecommendations.map((product: any, index: number) => ({
            type: "PRODUCT_RECOMMENDATION",
            product,
            _debugIndex: index,
          }))
        : []),

      ...(Array.isArray(payload?.recommendedProducts)
        ? payload.recommendedProducts.map((product: any, index: number) => ({
            type: "PRODUCT_RECOMMENDATION",
            product,
            _debugIndex: index,
          }))
        : []),
    ];
  }

  static async getMixedFeed({
    cursorCreatedAt = null,
    cursorId = null,
    limit = 12,
    timeoutMs = 12000,
  }: GetMixedFeedParams = {}) {
    const response = await this.client.get("/feed/mixed", {
      params: {
        cursorCreatedAt,
        cursorId,
        limit,
      },
      timeout: timeoutMs,
      validateStatus: () => true,
    });

    return {
      ...response.data,
      items: this.normalizeMixedFeedItems(response.data),
      count: response.data?.count ?? 0,
      generatedAt: response.data?.generatedAt ?? null,
      nextCursorCreatedAt: response.data?.nextCursorCreatedAt ?? null,
      nextCursorId:
        response.data?.nextCursorId != null
          ? Number(response.data.nextCursorId)
          : null,
      hasMore: Boolean(response.data?.hasMore),
    };
  }

  static async getVideoFeed({
    cursorCreatedAt = null,
    cursorId = null,
    limit = 5,
  }: GetVideoFeedParams = {}) {
    const response = await this.client.get("/feed/videos", {
      params: {
        cursorCreatedAt,
        cursorId,
        limit,
      },
      timeout: 15000,
      validateStatus: () => true,
    });

    return response.data;
  }
}