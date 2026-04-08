import { useEffect } from "react";

export default function SeoMeta({
  title,
}: {
  title?: string;
}) {
  useEffect(() => {
    if (title) {
      console.debug("[SeoMeta] Ignored on React Native:", title);
    }
  }, [title]);

  return null;
}
