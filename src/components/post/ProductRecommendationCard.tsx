import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type ProductRecommendation = {
  id?: string | number;
  category?: string;
  subCategory?: string;
  name?: string;
  productName?: string;
  description?: string;
  newPrice?: number | string;
  price?: number | string;
  thumbnailImageUrl?: string;
  imageUrl?: string;
  productImageUrl?: string;
  thumbnailUrl?: string;
  imageUrls?: Array<
    | string
    | {
        imageUrl?: string;
        url?: string;
        path?: string;
        secure_url?: string;
      }
  >;
};

export default function ProductRecommendationCard({
  product,
  onPress,
}: {
  product: ProductRecommendation;
  onPress?: (product: ProductRecommendation) => void;
}) {
  const { colors, isDark } = useTheme();
  if (!product?.id) return null;

  const imageUrl = getProductImage(product);
  const title = product?.name || product?.productName || "Pet Product";
  const category = product?.category || "Pet Accessories";
  const description =
    product?.description || "Quality pet product selected to match this moment and your interests.";
  const price = formatPrice(product?.newPrice ?? product?.price);

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.06,
          elevation: isDark ? 0 : 3,
        },
      ]}
      onPress={() => onPress?.(product)}
    >
      <View style={styles.layout}>
        <View
          style={[
            styles.mediaWrap,
            {
              backgroundColor: colors.backgroundMuted,
              borderRightColor: colors.borderSoft,
            },
          ]}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: colors.backgroundMuted }]}>
              <MaterialCommunityIcons name="paw" size={28} color={colors.success} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.eyebrow, { color: colors.textSoft }]}>Recommended for you</Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.category, { color: colors.textSoft }]} numberOfLines={1}>
            {category}
          </Text>
          <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
            {description}
          </Text>

          <View style={styles.footer}>
            <Text style={[styles.price, { color: colors.text }]}>{price}</Text>

            <View style={[styles.cta, { backgroundColor: isDark ? colors.accent : "#1F2937" }]}>
              <Text style={styles.ctaText}>View Product</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function getProductImage(product: ProductRecommendation) {
  const primaryImage = product?.imageUrls?.[0];

  if (typeof primaryImage === "string" && primaryImage.trim()) {
    return primaryImage;
  }

  if (primaryImage && typeof primaryImage === "object") {
    return (
      primaryImage.imageUrl ||
      primaryImage.url ||
      primaryImage.path ||
      primaryImage.secure_url ||
      null
    );
  }

  return (
    product?.thumbnailImageUrl ||
    product?.imageUrl ||
    product?.productImageUrl ||
    product?.thumbnailUrl ||
    null
  );
}

function formatPrice(value?: number | string) {
  if (value == null) return "Contact for price";
  const amount = Number(value);
  if (Number.isNaN(amount)) return `$${value}`;
  return `$${amount.toLocaleString("en-US")}`;
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  layout: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  mediaWrap: {
    width: 112,
    minWidth: 112,
    backgroundColor: "#F8FAFC",
    borderRightWidth: 1,
    borderRightColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: 132,
    padding: 10,
  },
  imageFallback: {
    width: "100%",
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  title: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  category: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  cta: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#1F2937",
  },
  ctaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
