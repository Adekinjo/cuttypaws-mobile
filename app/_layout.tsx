import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { useEffect } from "react";
import AuthService from "../src/api/AuthService";
import StripeAppProvider from "../src/components/common/StripeAppProvider";
import { CartProvider } from "../src/components/context/CartContext";
import { ThemeProvider } from "../src/components/context/ThemeContext";
import { handleStripeCallback } from "../src/utils/stripeCallback";

const STRIPE_RETURN_URL_PREFIX = "cuttypawsmobile://stripe-redirect";

export default function RootLayout() {
  useEffect(() => {
    AuthService.initializeApp(() => {
      console.warn("[RootLayout] User became unauthorized.");
    }).catch((error) => {
      console.error("[RootLayout] Failed to initialize auth state", error);
    });
  }, []);

  useEffect(() => {
    const processStripeUrl = async (url?: string | null) => {
      if (!url || !url.startsWith(STRIPE_RETURN_URL_PREFIX)) return;

      try {
        await handleStripeCallback(url);
      } catch (error) {
        console.warn("[RootLayout] Stripe callback unavailable in current app binary", error);
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        processStripeUrl(url);
      })
      .catch((error) => {
        console.warn("[RootLayout] Failed to read initial URL", error);
      });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      processStripeUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <StripeAppProvider>
      <ThemeProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </CartProvider>
      </ThemeProvider>
    </StripeAppProvider>
  );
}
