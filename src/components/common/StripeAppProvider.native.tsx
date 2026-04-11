import { StripeProvider } from "@stripe/stripe-react-native";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function StripeAppProvider({ children }: Props) {
  return (
    <StripeProvider
      publishableKey="pk_test_your_key_here"
      urlScheme="cuttypawsmobile"
    >
      {children}
    </StripeProvider>
  );
}
