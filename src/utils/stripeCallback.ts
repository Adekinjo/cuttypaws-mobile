import { Platform } from "react-native";

export async function handleStripeCallback(url: string) {
  if (Platform.OS === "web") {
    return false;
  }

  const { handleURLCallback } = await import("@stripe/stripe-react-native");
  return handleURLCallback(url);
}
