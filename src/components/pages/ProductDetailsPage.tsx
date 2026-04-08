import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AuthService from "../../api/AuthService";
import ProductService from "../../api/ProductService";
import ReviewService from "../../api/ReviewService";
import WishlistService from "../../api/WishlistService";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

type ProductColor = {
  name?: string;
  code?: string;
};

type ProductRelation = {
  id?: string | number;
  name?: string;
  title?: string;
  categoryId?: string | number;
  subCategoryId?: string | number;
};

type ReviewItem = {
  id?: string | number;
  rating?: number;
  comment?: string;
  userName?: string;
  timestamp?: string;
  createdAt?: string;
  user?: {
    id?: string | number;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
};

type Product = {
  id?: string | number;
  productId?: string | number;
  name?: string;
  description?: string;
  imageUrls?: string[];
  thumbnailImageUrl?: string;
  oldPrice?: number;
  newPrice?: number;
  colors?: ProductColor[];
  sizes?: string[] | string;
  likes?: number;
  stockQuantity?: number;
  stock?: number;
  sellerName?: string;
  sellerBusinessName?: string;
  shippingInfo?: string;
  category?: string | ProductRelation;
  subCategory?: string | ProductRelation;
  categoryId?: string | number;
  subCategoryId?: string | number;
  category_id?: string | number;
  sub_category_id?: string | number;
  categoryName?: string;
  subCategoryName?: string;
};

type ProductDetailsResponse = {
  productDetails?: {
    product?: Product | null;
    relatedProducts?: Product[];
    otherRelatedProducts?: Product[];
  };
};

type ProductLookupResponse = {
  product?: Product | null;
  productDetails?: {
    product?: Product | null;
  };
};

const formatMoney = (value?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

const normalizeSizes = (sizes?: string[] | string) => {
  if (Array.isArray(sizes)) {
    return sizes.map((size) => String(size || "").trim()).filter(Boolean);
  }

  if (typeof sizes === "string") {
    return sizes
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean);
  }

  return [] as string[];
};

const getProductId = (product: Product | null | undefined) =>
  String(product?.id ?? product?.productId ?? "");

const getReviewAuthor = (review: ReviewItem) =>
  review.user?.name ||
  `${review.user?.firstName || ""} ${review.user?.lastName || ""}`.trim() ||
  review.userName ||
  "Anonymous";

const getReviewDate = (review: ReviewItem) => {
  const raw = review.timestamp || review.createdAt;
  if (!raw) return "";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getInitials = (review: ReviewItem) => {
  const parts = getReviewAuthor(review).split(" ").filter(Boolean);
  if (!parts.length) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

const getEntityName = (value: any, ...fallbacks: any[]) => {
  const candidates = [
    typeof value === "string" ? value : value?.name || value?.title,
    ...fallbacks,
  ];

  const matched = candidates.find((candidate) => String(candidate || "").trim() !== "");
  return matched ? String(matched).trim().toLowerCase() : "";
};

const resolveEntityId = (
  value?:
    | string
    | number
    | { id?: string | number; categoryId?: string | number; subCategoryId?: string | number }
    | null,
  ...fallbacks: Array<string | number | null | undefined>
) => {
  const candidates = [
    typeof value === "object" && value !== null
      ? value.id || value.categoryId || value.subCategoryId
      : value,
    ...fallbacks,
  ];

  const matched = candidates.find((candidate) => String(candidate || "").trim() !== "");
  return matched ? String(matched).trim() : "";
};

function ProductRail({
  title,
  products,
  onOpenProduct,
  colors,
}: {
  title: string;
  products: Product[];
  onOpenProduct: (product: Product) => void;
  colors: {
    text: string;
    textMuted: string;
    border: string;
    borderSoft: string;
    card: string;
    backgroundMuted: string;
    accent: string;
  };
}) {
  if (!products.length) {
    return null;
  }

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
      >
        {products.map((item) => {
          const resolvedId = getProductId(item);
          const imageUrl = item.imageUrls?.[0] || item.thumbnailImageUrl;
          return (
            <Pressable
              key={resolvedId || item.name}
              style={[
                styles.railCard,
                {
                  backgroundColor: colors.backgroundMuted,
                  borderColor: colors.borderSoft,
                },
              ]}
              onPress={() => onOpenProduct(item)}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.railImage} />
              ) : (
                <View
                  style={[
                    styles.railImage,
                    styles.imageFallback,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <MaterialCommunityIcons name="paw-outline" size={28} color="#94A3B8" />
                </View>
              )}

              <View style={styles.railBody}>
                <Text numberOfLines={1} style={[styles.railTitle, { color: colors.text }]}>
                  {item.name || "Product"}
                </Text>
                {Number(item.oldPrice || 0) > 0 ? (
                  <Text style={styles.railOldPrice}>{formatMoney(item.oldPrice)}</Text>
                ) : null}
                <Text style={[styles.railNewPrice, { color: colors.accent }]}>
                  {formatMoney(item.newPrice)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function ProductDetailsPage({
  productId,
  onNavigate,
  onOpenProduct,
}: {
  productId: string;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenProduct?: (product: Product) => void;
}) {
  const { cart, dispatch } = useCart();
  const { colors, isDark } = useTheme();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [otherRelatedProducts, setOtherRelatedProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [likes, setLikes] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [shareOpen, setShareOpen] = useState(false);

  const normalizedProductId = String(productId || "");
  const isInWishlist = wishlist.some(
    (item) => String(item?.productId ?? item?.id) === normalizedProductId
  );
  const availableStock = Number(product?.stockQuantity ?? product?.stock ?? 0);
  const normalizedSizes = useMemo(() => normalizeSizes(product?.sizes), [product?.sizes]);

  const imageUrls = useMemo(() => {
    if (!product) return [] as string[];
    const merged = [...(product.imageUrls || [])];
    if (product.thumbnailImageUrl && !merged.includes(product.thumbnailImageUrl)) {
      merged.unshift(product.thumbnailImageUrl);
    }
    return merged.filter(Boolean);
  }, [product]);

  const cartItem = useMemo(() => {
    const matchingItems = cart.filter((item) => String(item.id) === normalizedProductId);
    if (!matchingItems.length) {
      return undefined;
    }

    return matchingItems.find(
      (item) =>
        String(item.size || "") === selectedSize &&
        String(item.color || "") === selectedColor
    ) || matchingItems[0];
  }, [cart, normalizedProductId, selectedColor, selectedSize]);

  const activeImage = imageUrls[activeImageIndex] || imageUrls[0] || "";

  useEffect(() => {
    let mounted = true;

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setReviewError("");
        setReviewSuccess("");
        setActiveImageIndex(0);
        setSelectedColor("");
        setSelectedSize("");

        if (!normalizedProductId || normalizedProductId === "undefined" || normalizedProductId === "null") {
          throw new Error("Invalid product ID.");
        }

        const [detailsRes, wishlistRes, reviewsRes] = await Promise.all([
          ProductService.getProductDetails(normalizedProductId).catch(() => null),
          WishlistService.getWishlist().catch(() => []),
          ReviewService.getReviewsByProductId(normalizedProductId).catch(() => []),
        ]);

        if (!mounted) return;

        const details = (detailsRes as ProductDetailsResponse | null)?.productDetails || {};
        let mainProduct = details.product || null;
        let nextRelatedProducts = Array.isArray(details.relatedProducts)
          ? details.relatedProducts
          : [];
        let nextOtherRelatedProducts = Array.isArray(details.otherRelatedProducts)
          ? details.otherRelatedProducts
          : [];

        if (!mainProduct) {
          const fallbackRes = (await ProductService.getProductById(
            normalizedProductId
          )) as ProductLookupResponse;

          mainProduct =
            fallbackRes?.productDetails?.product ||
            fallbackRes?.product ||
            null;
        }

        if (!mainProduct) {
          throw new Error("Product details not found.");
        }

        if (!nextRelatedProducts.length || !nextOtherRelatedProducts.length) {
          const resolvedSubCategoryId = resolveEntityId(
            mainProduct.subCategory,
            mainProduct.subCategoryId,
            mainProduct.sub_category_id
          );
          const resolvedSubCategoryName = getEntityName(
            mainProduct.subCategory,
            mainProduct.subCategoryName
          );
          const resolvedCategoryId = resolveEntityId(
            mainProduct.category,
            mainProduct.categoryId,
            mainProduct.category_id
          );

          if (!nextRelatedProducts.length && resolvedSubCategoryId) {
            const subCategoryRes = await ProductService.getAllProductsBySubCategory(
              resolvedSubCategoryId
            ).catch(() => null);

            nextRelatedProducts = Array.isArray(subCategoryRes?.productList)
              ? subCategoryRes.productList.filter(
                  (item: Product) => getProductId(item) !== normalizedProductId
                )
              : [];
          }

          if (!nextOtherRelatedProducts.length && resolvedCategoryId) {
            const categoryRes = await ProductService.getAllProductByCategoryId(
              resolvedCategoryId
            ).catch(() => null);

            const categoryProducts = Array.isArray(categoryRes?.productList)
              ? categoryRes.productList.filter(
                  (item: Product) => getProductId(item) !== normalizedProductId
                )
              : [];

            nextOtherRelatedProducts = categoryProducts;

            if (!nextRelatedProducts.length && resolvedSubCategoryName) {
              nextRelatedProducts = categoryProducts.filter(
                (item: Product) =>
                  getEntityName(item.subCategory, item.subCategoryName) ===
                  resolvedSubCategoryName
              );
            }
          }
        }

        setProduct(mainProduct);
        setRelatedProducts(nextRelatedProducts);
        setOtherRelatedProducts(nextOtherRelatedProducts);
        setWishlist(Array.isArray(wishlistRes) ? wishlistRes : []);
        setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
        setLikes(Number(mainProduct.likes || 0));
        setReviewLoading(false);

        void ProductService.trackProductView(normalizedProductId);
      } catch (fetchError: any) {
        if (!mounted) return;
        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            "Unable to load product details."
        );
        setReviewLoading(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProductDetails();
    return () => {
      mounted = false;
    };
  }, [normalizedProductId]);

  const handleColorSelect = (color: ProductColor) => {
    setSelectedColor(color.name || "");

    const matchIndex = imageUrls.findIndex((imageUrl) =>
      imageUrl.toLowerCase().includes(String(color.name || "").toLowerCase())
    );

    setActiveImageIndex(matchIndex >= 0 ? matchIndex : 0);
  };

  const handleAddToCart = () => {
    if (!product) return;

    dispatch({
      type: "ADD_ITEM",
      payload: {
        ...product,
        id: normalizedProductId,
        quantity: 1,
        size: selectedSize || null,
        color: selectedColor || null,
        imageUrls,
      },
    });
  };

  const handleIncrementCart = () => {
    if (!cartItem) return;

    dispatch({
      type: "INCREMENT_ITEM",
      payload: {
        id: String(cartItem.id),
        size: cartItem.size || null,
        color: cartItem.color || null,
      },
    });
  };

  const handleDecrementCart = () => {
    if (!cartItem) return;

    dispatch({
      type: Number(cartItem?.quantity || 0) > 1 ? "DECREMENT_ITEM" : "REMOVE_ITEM",
      payload: {
        id: String(cartItem.id),
        size: cartItem.size || null,
        color: cartItem.color || null,
      },
    });
  };

  const toggleWishlist = async () => {
    const authenticated = await AuthService.isAuthenticated();
    if (!authenticated) {
      Alert.alert("Login required", "Please login to manage wishlist.");
      return;
    }

    try {
      if (isInWishlist) {
        await WishlistService.removeFromWishlist(normalizedProductId);
        setWishlist((prev) =>
          prev.filter((item) => String(item?.productId ?? item?.id) !== normalizedProductId)
        );
      } else {
        await WishlistService.addToWishlist(normalizedProductId);
        setWishlist((prev) => [...prev, { productId: normalizedProductId }]);
      }
    } catch (wishlistError: any) {
      Alert.alert("Wishlist", wishlistError?.message || "Wishlist update failed.");
    }
  };

  const handleLike = async () => {
    try {
      await ProductService.likeProduct(normalizedProductId);
      setLikes((prev) => prev + 1);
    } catch (likeError: any) {
      Alert.alert("Likes", likeError?.message || "Failed to like this product.");
    }
  };

  const handleReviewSubmit = async () => {
    try {
      setReviewError("");
      setReviewSuccess("");

      if (!rating) {
        setReviewError("Please select a rating.");
        return;
      }

      setSubmitting(true);

      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error("Please log in to submit a review.");
      }

      const currentUser = await AuthService.getLoggedInInfo();
      if (!currentUser?.user?.id) {
        throw new Error("Unable to verify your account.");
      }

      await ReviewService.addReview({
        productId: Number(normalizedProductId),
        userId: currentUser.user.id,
        rating,
        comment,
      });

      const updatedReviews = await ReviewService.getReviewsByProductId(normalizedProductId);
      setReviews(Array.isArray(updatedReviews) ? updatedReviews : []);
      setRating(0);
      setComment("");
      setReviewSuccess("Thank you for your review!");
    } catch (submitError: any) {
      setReviewError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Failed to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async (platform?: string) => {
    if (!product) return;

    try {
      const message = `${product.name || "Product"}\n${product.description || ""}`.trim();
      await Share.share({
        message: platform ? `${message}\nShared via ${platform}` : message,
      });
      setShareOpen(false);
    } catch (shareError) {
      console.error("[ProductDetailsPage] share failed", shareError);
    }
  };

  const openProduct = (nextProduct: Product) => {
    const nextId = getProductId(nextProduct);
    if (!nextId) return;

    if (onOpenProduct) {
      onOpenProduct({ ...nextProduct, id: nextId });
      return;
    }

    onNavigate?.("product-details", { productId: nextId });
  };

  if (loading) {
    return (
      <View style={[styles.stateWrap, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Loading product...</Text>
      </View>
    );
  }

  if (!product || error) {
    return (
      <View style={[styles.stateWrap, { backgroundColor: colors.background }]}> 
        <Text style={[styles.stateTitle, { color: colors.text }]}>Could not load product</Text>
        <Text style={[styles.stateBody, { color: colors.textMuted }]}>
          {error || "Product details are unavailable right now."}
        </Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={() => onNavigate?.("back")}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <Pressable style={styles.headerIconButton} onPress={() => onNavigate?.("back")}>
          <Feather name="arrow-left" size={18} color={colors.text} />
        </Pressable>

        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}> 
          {product.name || "Product details"}
        </Text>

        <Pressable
          style={styles.headerIconButton}
          onPress={() => setShareOpen((prev) => !prev)}
        >
          <Feather name="share-2" size={18} color={colors.text} />
        </Pressable>
      </View>

      {shareOpen ? (
        <View
          style={[
            styles.sharePanel,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {[
            { key: "facebook", icon: <FontAwesome name="facebook" size={16} color="#1877F2" /> },
            { key: "twitter", icon: <FontAwesome name="twitter" size={16} color="#1D9BF0" /> },
            { key: "whatsapp", icon: <FontAwesome name="whatsapp" size={16} color="#25D366" /> },
            { key: "linkedin", icon: <FontAwesome name="linkedin" size={16} color="#0A66C2" /> },
            { key: "tiktok", icon: <MaterialCommunityIcons name="music-note" size={16} color={colors.text} /> },
          ].map((item) => (
            <Pressable
              key={item.key}
              style={[styles.shareChip, { backgroundColor: colors.backgroundMuted }]}
              onPress={() => handleShare(item.key)}
            >
              {item.icon}
              <Text style={[styles.shareChipText, { color: colors.text }]}>{item.key}</Text>
            </Pressable>
          ))}

          <Pressable
            style={[styles.shareChip, { backgroundColor: colors.accentSoft }]}
            onPress={() => handleShare()}
          >
            <Feather name="send" size={16} color={colors.accent} />
            <Text style={[styles.shareChipText, { color: colors.accent }]}>More</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.galleryWrap}>
          {activeImage ? (
            <Image source={{ uri: activeImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.imageFallback, { backgroundColor: colors.backgroundMuted }]}>
              <MaterialCommunityIcons name="paw-outline" size={42} color="#94A3B8" />
            </View>
          )}

          {imageUrls.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {imageUrls.map((imageUrl, index) => (
                <Pressable
                  key={`${imageUrl}-${index}`}
                  onPress={() => setActiveImageIndex(index)}
                  style={[
                    styles.thumbnailShell,
                    {
                      borderColor:
                        index === activeImageIndex ? colors.accent : colors.borderSoft,
                    },
                  ]}
                >
                  <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.detailsWrap}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.productTitle, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.sellerText, { color: colors.textMuted }]}>
                {product.sellerBusinessName || product.sellerName || "Cutty Paws Store"}
              </Text>
            </View>

            <Pressable
              style={[
                styles.bookmarkButton,
                {
                  backgroundColor: isInWishlist ? "#FEF3C7" : colors.backgroundMuted,
                  borderColor: isInWishlist ? "#F59E0B" : colors.borderSoft,
                },
              ]}
              onPress={toggleWishlist}
            >
              <Feather
                name="bookmark"
                size={18}
                color={isInWishlist ? "#B45309" : colors.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.priceWrap}>
            {Number(product.oldPrice || 0) > 0 ? (
              <Text style={styles.oldPrice}>{formatMoney(product.oldPrice)}</Text>
            ) : null}
            <Text style={[styles.newPrice, { color: colors.accent }]}>
              {formatMoney(product.newPrice)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: colors.backgroundMuted }]}>
              <FontAwesome name="heart" size={13} color={likes > 0 ? "#DC2626" : colors.textMuted} />
              <Text style={[styles.metaPillText, { color: colors.text }]}>{likes} likes</Text>
            </View>

            <View style={[styles.metaPill, { backgroundColor: colors.backgroundMuted }]}>
              <Feather name="package" size={13} color={colors.textMuted} />
              <Text style={[styles.metaPillText, { color: colors.text }]}> 
                {availableStock > 0
                  ? `${availableStock} in stock`
                  : "Stock not specified"}
              </Text>
            </View>
          </View>

          {product.colors?.length ? (
            <View style={styles.optionBlock}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Colors</Text>
              <View style={styles.colorRow}>
                {product.colors.map((color, index) => {
                  const active = selectedColor === color.name;
                  return (
                    <Pressable
                      key={`${color.name || "color"}-${index}`}
                      style={styles.colorChoice}
                      onPress={() => handleColorSelect(color)}
                    >
                      <View
                        style={[
                          styles.colorSwatch,
                          {
                            backgroundColor: color.code || "#CBD5E1",
                            borderColor: active ? colors.accent : colors.borderSoft,
                          },
                        ]}
                      />
                      <Text style={[styles.colorLabel, { color: active ? colors.accent : colors.textMuted }]}>
                        {color.name || "Color"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {normalizedSizes.length ? (
            <View style={styles.optionBlock}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Size</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sizeRow}>
                  {normalizedSizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <Pressable
                        key={size}
                        style={[
                          styles.sizeChip,
                          {
                            backgroundColor: active ? colors.accent : colors.backgroundMuted,
                            borderColor: active ? colors.accent : colors.borderSoft,
                          },
                        ]}
                        onPress={() => setSelectedSize(size)}
                      >
                        <Text
                          style={[
                            styles.sizeChipText,
                            { color: active ? "#FFFFFF" : colors.text },
                          ]}
                        >
                          {size}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            {cartItem ? (
              <View style={[styles.quantityPanel, { borderColor: colors.border }]}> 
                <Pressable style={styles.quantityButton} onPress={handleDecrementCart}>
                  <Text style={[styles.quantityButtonText, { color: colors.text }]}>-</Text>
                </Pressable>
                <Text style={[styles.quantityValue, { color: colors.text }]}>{cartItem.quantity}</Text>
                <Pressable style={styles.quantityButton} onPress={handleIncrementCart}>
                  <Text style={[styles.quantityButtonText, { color: colors.text }]}>+</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.cartButton, { backgroundColor: colors.accent }]}
                onPress={handleAddToCart}
              >
                <Text style={styles.cartButtonText}>Add to Cart</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.likeButton, { backgroundColor: colors.backgroundMuted }]}
              onPress={handleLike}
            >
              <FontAwesome name="heart" size={18} color={likes > 0 ? "#DC2626" : colors.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.descriptionPanel, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}>
            <Text style={[styles.descriptionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.textMuted }]}> 
              {product.description || "No description has been added for this product yet."}
            </Text>
            {product.shippingInfo ? (
              <Text style={[styles.shippingText, { color: isDark ? colors.textSoft : "#475569" }]}>
                Shipping: {product.shippingInfo}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ProductRail
        title="Related Products"
        products={relatedProducts}
        onOpenProduct={openProduct}
        colors={colors}
      />
      <ProductRail
        title="Other Related Products"
        products={otherRelatedProducts}
        onOpenProduct={openProduct}
        colors={colors}
      />

      <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Reviews</Text>

        <View style={[styles.reviewComposer, { backgroundColor: colors.card, borderColor: colors.borderSoft }]}> 
          <Text style={[styles.reviewComposerTitle, { color: colors.text }]}>Write a Review</Text>

          <View style={styles.reviewStarsRow}>
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return (
                <Pressable key={value} onPress={() => setRating(value)}>
                  <FontAwesome
                    name="star"
                    size={24}
                    color={value <= rating ? "#F59E0B" : "#E5E7EB"}
                  />
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this product..."
            placeholderTextColor={colors.textSoft}
            multiline
            textAlignVertical="top"
            style={[
              styles.reviewInput,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          />

          {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}
          {reviewSuccess ? <Text style={styles.reviewSuccess}>{reviewSuccess}</Text> : null}

          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: colors.accent },
              submitting && styles.primaryButtonDisabled,
            ]}
            onPress={handleReviewSubmit}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Text>
          </Pressable>
        </View>

        {reviewLoading ? (
          <View style={styles.reviewState}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.reviewStateText, { color: colors.textMuted }]}>Loading reviews...</Text>
          </View>
        ) : reviews.length ? (
          <View style={styles.reviewList}>
            {reviews.map((review) => (
              <View
                key={String(review.id)}
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.card, borderColor: colors.borderSoft },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: colors.accentSoft }]}> 
                    <Text style={[styles.reviewAvatarText, { color: colors.accent }]}>
                      {getInitials(review)}
                    </Text>
                  </View>

                  <View style={styles.reviewMeta}>
                    <Text style={[styles.reviewAuthor, { color: colors.text }]}>
                      {getReviewAuthor(review)}
                    </Text>
                    <View style={styles.reviewStarsInline}>
                      {Array.from({ length: 5 }, (_, index) => (
                        <FontAwesome
                          key={index}
                          name="star"
                          size={13}
                          color={index < Number(review.rating || 0) ? "#F59E0B" : "#E5E7EB"}
                        />
                      ))}
                    </View>
                  </View>

                  {!!getReviewDate(review) && (
                    <Text style={[styles.reviewDate, { color: colors.textSoft }]}>
                      {getReviewDate(review)}
                    </Text>
                  )}
                </View>

                <Text style={[styles.reviewComment, { color: colors.textMuted }]}> 
                  {review.comment || "No comment provided."}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.reviewState}>
            <Text style={[styles.reviewStateText, { color: colors.textMuted }]}> 
              No reviews yet. Be the first to review this product.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  stateBody: {
    textAlign: "center",
    lineHeight: 21,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  sharePanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  shareChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  shareChipText: {
    textTransform: "capitalize",
    fontWeight: "700",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  galleryWrap: {
    padding: 14,
    gap: 12,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailRow: {
    gap: 10,
    paddingRight: 14,
  },
  thumbnailShell: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  detailsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  productTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  sellerText: {
    fontSize: 14,
  },
  bookmarkButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  priceWrap: {
    gap: 5,
  },
  oldPrice: {
    fontSize: 15,
    color: "#DC2626",
    textDecorationLine: "line-through",
    fontWeight: "600",
  },
  newPrice: {
    fontSize: 28,
    fontWeight: "900",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaPillText: {
    fontWeight: "600",
  },
  optionBlock: {
    gap: 10,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorChoice: {
    alignItems: "center",
    gap: 6,
    width: 68,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
  },
  colorLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  sizeRow: {
    flexDirection: "row",
    gap: 10,
  },
  sizeChip: {
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sizeChipText: {
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  cartButton: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  likeButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityPanel: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  quantityButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  quantityButtonText: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  descriptionPanel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  descriptionTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  descriptionText: {
    lineHeight: 22,
    fontSize: 14,
  },
  shippingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  railContent: {
    gap: 14,
    paddingRight: 6,
  },
  railCard: {
    width: 176,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  railImage: {
    width: "100%",
    height: 148,
    backgroundColor: "#E2E8F0",
  },
  railBody: {
    padding: 12,
    gap: 4,
  },
  railTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  railOldPrice: {
    color: "#DC2626",
    textDecorationLine: "line-through",
    fontSize: 12,
  },
  railNewPrice: {
    fontSize: 15,
    fontWeight: "900",
  },
  reviewComposer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  reviewComposerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  reviewStarsRow: {
    flexDirection: "row",
    gap: 8,
  },
  reviewInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  reviewError: {
    color: "#DC2626",
    fontWeight: "600",
  },
  reviewSuccess: {
    color: "#15803D",
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  reviewState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  reviewStateText: {
    textAlign: "center",
  },
  reviewList: {
    gap: 12,
  },
  reviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: {
    fontWeight: "900",
  },
  reviewMeta: {
    flex: 1,
    gap: 4,
  },
  reviewAuthor: {
    fontWeight: "800",
    fontSize: 14,
  },
  reviewStarsInline: {
    flexDirection: "row",
    gap: 3,
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewComment: {
    lineHeight: 21,
  },
});
