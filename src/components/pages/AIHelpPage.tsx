import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AIService from "../../api/AIService";
import { AdminButton, AdminCard, Banner } from "../admin/AdminCommon";
import { useTheme } from "../context/ThemeContext";
import { storage } from "../../utils/storage";

type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

type AIResponse = {
  answer?: string;
  disclaimer?: string;
  followUpQuestions?: string[];
  recommendedProducts?: Array<{
    id?: string;
    name?: string;
    category?: string;
    subCategory?: string;
    description?: string;
    newPrice?: number | string;
    thumbnailImageUrl?: string;
  }>;
  recommendedServices?: Array<{
    id?: string;
    userId?: string;
    businessName?: string;
    ownerName?: string;
    displayLabel?: string;
    description?: string;
    city?: string;
    state?: string;
    priceFrom?: number | string;
    coverImageUrl?: string;
  }>;
};

type RecentAiView = {
  id: string;
  type: "product" | "service";
  title: string;
  subtitle?: string;
  imageUrl?: string;
};

const cleanText = (text?: string) => {
  if (!text) return "";
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const truncateText = (text?: string, limit = 110) => {
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

export default function AIHelpPage({
  selectedImage,
  onPickImage,
  onOpenProduct,
  onOpenService,
}: {
  selectedImage?: ImageFile | null;
  onPickImage?: () => void;
  onOpenProduct?: (product: any) => void;
  onOpenService?: (service: any) => void;
}) {
  const { colors, isDark } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [recentViews, setRecentViews] = useState<RecentAiView[]>([]);

  const cleanedAnswer = useMemo(() => cleanText(response?.answer), [response]);

  useEffect(() => {
    let mounted = true;

    const loadRecentViews = async () => {
      try {
        const items = await storage.getRecentAiViews<RecentAiView>();
        if (mounted) {
          setRecentViews(Array.isArray(items) ? items : []);
        }
      } catch {
        if (mounted) {
          setRecentViews([]);
        }
      }
    };

    loadRecentViews();
    return () => {
      mounted = false;
    };
  }, []);

  const pushRecentView = async (item: RecentAiView) => {
    try {
      const nextItems = [item, ...recentViews.filter((entry) => entry.id !== item.id)].slice(0, 6);
      setRecentViews(nextItems);
      await storage.setRecentAiViews(nextItems);
    } catch (persistError) {
      console.error("[AIHelpPage] Failed to store recent views", persistError);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError("Please enter your question.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResponse(null);

      const result = selectedImage
        ? await AIService.sendSupportMessageWithImage({
            prompt: prompt.trim(),
            image: selectedImage,
            city: city.trim() || null,
            state: stateValue.trim() || null,
          })
        : await AIService.sendSupportMessage(
            prompt.trim(),
            city.trim() || null,
            stateValue.trim() || null,
            25
          );

      setResponse(result);
    } catch (err: any) {
      setError(err?.message || "Unable to get AI help right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Banner message={error} tone="error" />

      <AdminCard>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ask your question</Text>
        <Text style={[styles.sectionCopy, { color: colors.textMuted }]}>
          Ask about pet care, products, services, orders, or payments. Add a location or image if
          you want more tailored help.
        </Text>
        <View
          style={[
            styles.promptShell,
            {
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
            },
          ]}
        >
          <TextInput
            style={[styles.promptInput, { color: colors.text }]}
            multiline
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask anything about your pet, products, services, orders, or payments..."
            placeholderTextColor={colors.textSoft}
            textAlignVertical="top"
          />

          <View style={styles.promptActions}>
            <View style={styles.uploadRow}>
              <Pressable
                style={[
                  styles.uploadButton,
                  { borderColor: colors.border, backgroundColor: colors.backgroundElevated },
                ]}
                onPress={onPickImage}
              >
                <Text style={[styles.uploadButtonText, { color: colors.text }]}>Upload image</Text>
              </Pressable>
              {selectedImage ? (
                <Text numberOfLines={1} style={[styles.uploadFileName, { color: colors.textMuted }]}>
                  {selectedImage.name}
                </Text>
              ) : null}
            </View>

            <AdminButton
              label={loading ? "Asking..." : "Ask"}
              onPress={handleSubmit}
              disabled={loading}
            />
          </View>
        </View>

        {selectedImage ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
          </View>
        ) : null}

        <Pressable style={styles.moreOptionsToggle} onPress={() => setShowMoreOptions((prev) => !prev)}>
          <Text style={[styles.moreOptionsText, { color: colors.textMuted }]}>
            {showMoreOptions ? "Hide more options" : "More options"}
          </Text>
        </Pressable>

        {showMoreOptions ? (
          <View style={styles.optionsGrid}>
            <View style={styles.optionField}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>City</Text>
              <TextInput
                style={[
                  styles.optionInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.text,
                  },
                ]}
                value={city}
                onChangeText={setCity}
                placeholder="Optional"
                placeholderTextColor={colors.textSoft}
              />
            </View>

            <View style={styles.optionField}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>State</Text>
              <TextInput
                style={[
                  styles.optionInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    color: colors.text,
                  },
                ]}
                value={stateValue}
                onChangeText={setStateValue}
                placeholder="Optional"
                placeholderTextColor={colors.textSoft}
              />
            </View>
          </View>
        ) : null}
      </AdminCard>

      {response ? (
        <AdminCard>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Response</Text>

          {cleanedAnswer ? <Text style={[styles.answerText, { color: colors.text }]}>{cleanedAnswer}</Text> : null}

          {response.disclaimer ? (
            <View
              style={[
                styles.disclaimerBox,
                { backgroundColor: isDark ? "rgba(245, 158, 11, 0.14)" : "#FEF3C7" },
              ]}
            >
              <Text style={[styles.disclaimerText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
                {response.disclaimer}
              </Text>
            </View>
          ) : null}

          {Array.isArray(response.followUpQuestions) && response.followUpQuestions.length > 0 ? (
            <View style={styles.responseBlock}>
              <Text style={[styles.blockTitle, { color: colors.text }]}>Helpful follow-up questions</Text>
              <View style={styles.followUpList}>
                {response.followUpQuestions.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.followUpItem}>
                    <Text style={styles.followUpBullet}>•</Text>
                    <Text style={[styles.followUpText, { color: colors.textMuted }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {Array.isArray(response.recommendedProducts) &&
          response.recommendedProducts.length > 0 ? (
            <View style={styles.responseBlock}>
              <Text style={[styles.blockTitle, { color: colors.text }]}>Recommended products</Text>
              <View style={styles.cardGrid}>
                {response.recommendedProducts.map((product, index) => (
                  <Pressable
                    key={`${product.id || product.name || index}`}
                    style={styles.recommendationCard}
                    onPress={() => {
                      void pushRecentView({
                        id: `product-${product.id || product.name || index}`,
                        type: "product",
                        title: product.name || "Product",
                        subtitle: product.category,
                        imageUrl: product.thumbnailImageUrl,
                      });
                      onOpenProduct?.(product);
                    }}
                  >
                    {product.thumbnailImageUrl ? (
                      <Image source={{ uri: product.thumbnailImageUrl }} style={styles.recommendationImage} />
                    ) : (
                      <View
                        style={[
                          styles.recommendationImage,
                          styles.imageFallback,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.imageFallbackText, { color: colors.textMuted }]}>Product</Text>
                      </View>
                    )}

                    <Text numberOfLines={1} style={[styles.recommendationTitle, { color: colors.text }]}>
                      {product.name || "Product"}
                    </Text>
                    {product.category ? (
                      <Text numberOfLines={1} style={[styles.recommendationMeta, { color: colors.textSoft }]}>
                        {product.category}
                      </Text>
                    ) : null}
                    {product.description ? (
                      <Text numberOfLines={3} style={[styles.recommendationText, { color: colors.textMuted }]}>
                        {truncateText(product.description)}
                      </Text>
                    ) : null}
                    {product.newPrice != null ? (
                      <Text style={[styles.recommendationPrice, { color: colors.accent }]}>{`$${product.newPrice}`}</Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {Array.isArray(response.recommendedServices) &&
          response.recommendedServices.length > 0 ? (
            <View style={styles.responseBlock}>
              <Text style={[styles.blockTitle, { color: colors.text }]}>Recommended service providers</Text>
              <View style={styles.cardGrid}>
                {response.recommendedServices.map((service, index) => (
                  <Pressable
                    key={`${service.id || service.userId || service.businessName || index}`}
                    style={styles.recommendationCard}
                    onPress={() => {
                      void pushRecentView({
                        id: `service-${service.id || service.userId || service.businessName || index}`,
                        type: "service",
                        title: service.businessName || service.ownerName || "Service provider",
                        subtitle:
                          service.displayLabel ||
                          [service.city, service.state].filter(Boolean).join(", "),
                        imageUrl: service.coverImageUrl,
                      });
                      onOpenService?.(service);
                    }}
                  >
                    {service.coverImageUrl ? (
                      <Image source={{ uri: service.coverImageUrl }} style={styles.recommendationImage} />
                    ) : (
                      <View
                        style={[
                          styles.recommendationImage,
                          styles.imageFallback,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.imageFallbackText, { color: colors.textMuted }]}>Service</Text>
                      </View>
                    )}

                    <Text numberOfLines={1} style={[styles.recommendationTitle, { color: colors.text }]}>
                      {service.businessName || service.ownerName || "Service provider"}
                    </Text>
                    {service.displayLabel ? (
                      <Text numberOfLines={1} style={[styles.recommendationMeta, { color: colors.textSoft }]}>
                        {service.displayLabel}
                      </Text>
                    ) : null}
                    {service.description ? (
                      <Text numberOfLines={3} style={[styles.recommendationText, { color: colors.textMuted }]}>
                        {truncateText(service.description)}
                      </Text>
                    ) : null}
                    <Text style={[styles.recommendationMeta, { color: colors.textSoft }]}>
                      {[service.city, service.state].filter(Boolean).join(", ")}
                    </Text>
                    {service.priceFrom != null ? (
                      <Text style={[styles.recommendationPrice, { color: colors.accent }]}>
                        Starting from: ${service.priceFrom}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </AdminCard>
      ) : null}

      <AdminCard>
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Views</Text>
          {recentViews.length ? (
            <Pressable
              onPress={async () => {
                setRecentViews([]);
                await storage.clearRecentAiViews();
              }}
            >
              <Text style={[styles.clearRecentText, { color: colors.success }]}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.sectionCopy, { color: colors.textMuted }]}>
          Products and service providers you open from AI help will appear here for quick return.
        </Text>

        {recentViews.length ? (
          <View style={styles.recentList}>
            {recentViews.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.recentCard,
                  { backgroundColor: colors.backgroundElevated, borderColor: colors.border },
                ]}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.recentImage} />
                ) : (
                  <View style={[styles.recentImage, styles.imageFallback, { backgroundColor: colors.border }]}>
                    <Text style={[styles.imageFallbackText, { color: colors.textMuted }]}>
                      {item.type === "product" ? "Product" : "Service"}
                    </Text>
                  </View>
                )}

                <View style={styles.recentContent}>
                  <Text numberOfLines={1} style={[styles.recentTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text numberOfLines={2} style={[styles.recentSubtitle, { color: colors.textMuted }]}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                  <Text style={[styles.recentType, { color: colors.success }]}>
                    {item.type === "product" ? "Recently viewed product" : "Recently viewed service"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.recentEmpty,
              { backgroundColor: colors.backgroundElevated, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.recentEmptyTitle, { color: colors.text }]}>No recent views yet</Text>
            <Text style={[styles.recentEmptyCopy, { color: colors.textMuted }]}>
              Open a recommended product or service from AI help and it will show up here.
            </Text>
          </View>
        )}
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: "#EEF3F8",
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 18,
    backgroundColor: "#102A43",
  },
  heroTextBlock: {
    gap: 8,
  },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
  },
  heroBody: {
    color: "#D9E2EC",
    lineHeight: 22,
  },
  heroTips: {
    gap: 10,
  },
  tipCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  tipLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  tipText: {
    color: "#CBD5E1",
    lineHeight: 19,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionCopy: {
    marginTop: 6,
    color: "#52606D",
    lineHeight: 20,
  },
  promptShell: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  promptInput: {
    minHeight: 100,
    color: "#102A43",
  },
  promptActions: {
    gap: 10,
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  uploadButtonText: {
    color: "#102A43",
    fontWeight: "700",
  },
  uploadFileName: {
    color: "#64748B",
    flexShrink: 1,
  },
  previewWrap: {
    paddingTop: 6,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  moreOptionsToggle: {
    paddingTop: 4,
  },
  moreOptionsText: {
    color: "#475569",
    fontWeight: "700",
  },
  optionsGrid: {
    gap: 12,
  },
  optionField: {
    gap: 6,
  },
  optionLabel: {
    color: "#243B53",
    fontWeight: "700",
  },
  optionInput: {
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  answerText: {
    color: "#102A43",
    lineHeight: 24,
  },
  disclaimerBox: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FEF3C7",
  },
  disclaimerText: {
    color: "#92400E",
    lineHeight: 20,
  },
  responseBlock: {
    gap: 12,
    paddingTop: 8,
  },
  blockTitle: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "800",
  },
  followUpList: {
    gap: 8,
  },
  followUpItem: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  followUpBullet: {
    color: "#2563EB",
    fontWeight: "900",
  },
  followUpText: {
    flex: 1,
    color: "#334E68",
    lineHeight: 20,
  },
  cardGrid: {
    gap: 12,
  },
  recommendationCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  recommendationImage: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageFallbackText: {
    color: "#64748B",
    fontWeight: "700",
  },
  recommendationTitle: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "800",
  },
  recommendationMeta: {
    color: "#64748B",
    lineHeight: 19,
  },
  recommendationText: {
    color: "#475569",
    lineHeight: 19,
  },
  recommendationPrice: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  clearRecentText: {
    color: "#0F766E",
    fontWeight: "800",
  },
  recentList: {
    gap: 12,
    marginTop: 14,
  },
  recentCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recentImage: {
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },
  recentContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  recentTitle: {
    color: "#102A43",
    fontSize: 15,
    fontWeight: "800",
  },
  recentSubtitle: {
    color: "#52606D",
    lineHeight: 18,
  },
  recentType: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "700",
  },
  recentEmpty: {
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  recentEmptyTitle: {
    color: "#102A43",
    fontSize: 15,
    fontWeight: "800",
  },
  recentEmptyCopy: {
    color: "#64748B",
    lineHeight: 20,
  },
});
