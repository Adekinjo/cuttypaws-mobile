declare module "./StripeAppProvider" {
  import type { ReactNode } from "react";

  type Props = {
    children: ReactNode;
  };

  export default function StripeAppProvider(props: Props): ReactNode;
}
