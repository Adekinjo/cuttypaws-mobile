import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import AuthService from "../../api/AuthService";
import PaymentService from "../../api/PaymentService";
import ProductService from "../../api/ProductService";
import keyValueStorage from "../../utils/keyValueStorage";
import { presentMobilePaymentSheet } from "../../utils/paymentSheet";
import { useCart } from "../context/CartContext";
import { AdminButton, AdminCard, Banner, EmptyState } from "../admin/AdminCommon";

const PENDING_PAYMENT_KEY = "pendingPayment";
const PAYMENT_SUCCESS_KEY = "paymentSuccessOrder";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);

export default function CartPage({
  onContinueShopping,
  onOpenProduct,
  onAddAddress,
  onNavigate,
}: {
  onContinueShopping?: () => void;
  onOpenProduct?: (product: any) => void;
  onAddAddress?: () => void;
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const { cart, dispatch, totalItemsInCart, totalCartValue } = useCart();
  const [message, setMessage] = useState<{ type: "success" | "warning" | "error" | ""; text: string }>({
    type: "",
    text: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const summary = useMemo(
    () => ({
      totalItems: totalItemsInCart,
      totalPrice: totalCartValue,
      shipping: 0,
    }),
    [totalCartValue, totalItemsInCart]
  );

  const validateCartItems = () => {
    const invalidItems = cart.filter((item) => !item.id || !item.quantity || !item.newPrice);

    if (invalidItems.length > 0) {
      setMessage({
        type: "error",
        text: `Some items in your cart are invalid. Please review: ${invalidItems
          .map((item) => item.name || "Unnamed item")
          .join(", ")}`,
      });
      return false;
    }

    return true;
  };

  const checkStock = async () => {
    try {
      for (const item of cart) {
        const productResponse = await ProductService.getProductById(item.id);
        const product = productResponse?.product || productResponse;

        if (!product) {
          throw new Error("Product not found");
        }

        if (Number(product.stock || 0) < Number(item.quantity || 0)) {
          setMessage({
            type: "warning",
            text: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          });
          return false;
        }
      }
      return true;
    } catch {
      setMessage({
        type: "error",
        text: "Failed to check product stock. Please try again.",
      });
      return false;
    }
  };

  const handleCheckout = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const authenticated = await AuthService.isAuthenticated();
      if (!authenticated) {
        setMessage({
          type: "warning",
          text: "You need to login before you can place an order.",
        });
        return;
      }

      if (!validateCartItems()) return;
      if (!(await checkStock())) return;

      const response = await AuthService.getLoggedInInfo();
      const user = response?.user;

      if (!user) {
        throw new Error("User not found. Please log in.");
      }

      const userAddress = user.address;
      if (
        !userAddress?.street ||
        !userAddress?.city ||
        !userAddress?.state ||
        !userAddress?.zipcode ||
        !userAddress?.country
      ) {
        setMessage({
          type: "warning",
          text: "Please add your shipping address before placing an order.",
        });
        onAddAddress?.();
        return;
      }

      const paymentResponse = await PaymentService.initializeOrderPayment(
        summary.totalPrice,
        "USD",
        user.email,
        user.id
      );

      await keyValueStorage.setItem(
        PENDING_PAYMENT_KEY,
        JSON.stringify({
          paymentId: paymentResponse.paymentId,
          reference: paymentResponse.reference,
          cart,
          totalPrice: summary.totalPrice,
          paymentPurpose: "ORDER",
        })
      );

      await presentMobilePaymentSheet(paymentResponse);

      if (!paymentResponse.reference) {
        throw new Error("Payment reference is missing.");
      }

      const paidPayment = await PaymentService.waitForPaidStatus(
        paymentResponse.reference
      );

      const resolvedPaymentId = String(
        paidPayment.paymentId || paymentResponse.paymentId || ""
      ).trim();

      if (!resolvedPaymentId) {
        throw new Error("Payment ID not found for order creation.");
      }

      const orderResponse = await PaymentService.createOrderAfterPayment(
        resolvedPaymentId,
        cart,
        summary.totalPrice
      );

      if (orderResponse?.status && orderResponse.status !== 200) {
        throw new Error(orderResponse?.message || "Order creation failed.");
      }

      dispatch({ type: "CLEAR_CART" });
      await keyValueStorage.removeItem(PENDING_PAYMENT_KEY);
      await keyValueStorage.setItem(
        PAYMENT_SUCCESS_KEY,
        JSON.stringify({
          orderId: orderResponse?.orderId || orderResponse?.id || null,
          reference: paymentResponse.reference,
          paymentId: resolvedPaymentId,
          totalPrice: summary.totalPrice,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrls?.[0] || null,
            quantity: item.quantity,
            price: item.newPrice,
            size: item.size || null,
            color: item.color || null,
          })),
        })
      );

      setMessage({
        type: "success",
        text: "Payment completed and your order has been placed successfully.",
      });

      onNavigate?.("payment-success");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.message || "Failed to process payment. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrement = (item: any) => {
    if (Number(item.quantity || 0) <= 1) {
      dispatch({ type: "REMOVE_ITEM", payload: item });
    } else {
      dispatch({ type: "DECREMENT_ITEM", payload: item });
    }
  };

  const handleRemoveItem = (item: any) => {
    dispatch({ type: "REMOVE_ITEM", payload: item });
  };

  if (!cart.length) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <EmptyState label="Your cart is empty." />
        <AdminCard>
          <Text style={styles.emptyTitle}>Start shopping to add items to your cart</Text>
          <AdminButton label="Continue Shopping" onPress={onContinueShopping} />
        </AdminCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner
        message={message.text}
        tone={
          message.type === "success"
            ? "success"
            : message.type === "warning"
              ? "info"
              : "error"
        }
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Shopping Cart</Text>
          <Text style={styles.heroTitle}>Review your order before checkout</Text>
          <Text style={styles.heroBody}>
            Adjust quantities, confirm pricing, and make sure your saved address is ready before
            payment starts.
          </Text>
        </View>

        <View style={styles.heroStats}>
          <StatCard label="Items" value={String(summary.totalItems)} />
          <StatCard label="Subtotal" value={formatCurrency(summary.totalPrice)} />
        </View>
      </View>

      <AdminCard>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cart Items</Text>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{cart.length} items</Text>
          </View>
        </View>

        <View style={styles.listWrap}>
          {cart.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Pressable onPress={() => onOpenProduct?.(item)} style={styles.imageWrap}>
                {item.imageUrls?.[0] ? (
                  <Image source={{ uri: item.imageUrls[0] }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.imageFallback]}>
                    <Text style={styles.imageFallbackText}>Item</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.itemContent}>
                <Pressable onPress={() => onOpenProduct?.(item)}>
                  <Text numberOfLines={1} style={styles.itemName}>
                    {item.name}
                  </Text>
                  {!!item.description && (
                    <Text numberOfLines={2} style={styles.itemDescription}>
                      {item.description}
                    </Text>
                  )}
                </Pressable>

                {(item.size || item.color) && (
                  <Text style={styles.itemMeta}>
                    {item.size ? `Size: ${item.size}` : ""}
                    {item.size && item.color ? " • " : ""}
                    {item.color ? `Color: ${item.color}` : ""}
                  </Text>
                )}

                <View style={styles.itemFooter}>
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyButton} onPress={() => handleDecrement(item)}>
                      <Text style={styles.qtyButtonText}>-</Text>
                    </Pressable>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <Pressable
                      style={styles.qtyButton}
                      onPress={() => dispatch({ type: "INCREMENT_ITEM", payload: item })}
                    >
                      <Text style={styles.qtyButtonText}>+</Text>
                    </Pressable>
                  </View>

                  <View style={styles.priceBlock}>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(Number(item.newPrice || 0) * Number(item.quantity || 1))}
                    </Text>
                    <Text style={styles.itemUnitPrice}>
                      {formatCurrency(Number(item.newPrice || 0))} each
                    </Text>
                  </View>
                </View>

                <Pressable style={styles.removeButton} onPress={() => handleRemoveItem(item)}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.totalPrice)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summarySuccess}>Free</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(summary.totalPrice)}</Text>
        </View>

        <AdminButton
          label={isLoading ? "Processing..." : "Proceed to Payment"}
          onPress={handleCheckout}
          disabled={isLoading}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Secure Payment</Text>
          <Text style={styles.infoText}>
            Your payment information is encrypted and handled through the payment provider.
          </Text>
        </View>
      </AdminCard>
    </ScrollView>
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
    lineHeight: 34,
  },
  heroBody: {
    color: "#D9E2EC",
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  statLabel: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "800",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  emptyTitle: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 18,
    fontWeight: "900",
  },
  countChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E0F2FE",
  },
  countChipText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 12,
  },
  listWrap: {
    gap: 12,
  },
  itemCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imageWrap: {
    width: 92,
  },
  itemImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
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
  itemContent: {
    flex: 1,
    gap: 8,
  },
  itemName: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "800",
  },
  itemDescription: {
    color: "#64748B",
    lineHeight: 18,
  },
  itemMeta: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    color: "#102A43",
    fontWeight: "900",
    fontSize: 16,
  },
  qtyValue: {
    color: "#102A43",
    fontWeight: "800",
  },
  priceBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemPrice: {
    color: "#1D4ED8",
    fontWeight: "900",
  },
  itemUnitPrice: {
    color: "#64748B",
    fontSize: 12,
  },
  removeButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
  },
  removeButtonText: {
    color: "#B91C1C",
    fontWeight: "800",
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#475569",
  },
  summaryValue: {
    color: "#102A43",
    fontWeight: "700",
  },
  summarySuccess: {
    color: "#059669",
    fontWeight: "800",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  totalLabel: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "900",
  },
  totalValue: {
    color: "#1D4ED8",
    fontSize: 20,
    fontWeight: "900",
  },
  infoBox: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#E0F2FE",
    gap: 4,
  },
  infoTitle: {
    color: "#0C4A6E",
    fontWeight: "800",
  },
  infoText: {
    color: "#0C4A6E",
    lineHeight: 19,
  },
});
