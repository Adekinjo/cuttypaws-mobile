import { handleURLCallback } from "@stripe/stripe-react-native";

export async function handleStripeCallback(url: string) {
  return handleURLCallback(url);
}
