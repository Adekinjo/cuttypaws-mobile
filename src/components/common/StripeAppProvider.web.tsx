import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function StripeAppProvider({ children }: Props) {
  return <>{children}</>;
}
