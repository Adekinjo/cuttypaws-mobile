import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AppVideo from "../common/AppVideo";

type MediaItem = {
  id?: string | number;
  url?: string;
  type?: string;
  alt?: string;
  isCover?: boolean;
  thumbnailUrl?: string;
};

export default function ServiceMediaGallery({
  media = [],
  title = "Service media",
  compact = false,
  emptyLabel = "No service media uploaded yet.",
}: {
  media?: MediaItem[];
  title?: string;
  compact?: boolean;
  emptyLabel?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeIndex = useMemo(() => {
    return media[selectedIndex] ? selectedIndex : 0;
  }, [media, selectedIndex]);

  const selectedItem = media[activeIndex];

  if (!media.length) {
    return (
      <View style={[styles.emptyCard, compact && styles.emptyCardCompact]}>
        <Feather name="image" size={20} color="#0F766E" />
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.gallery, compact && styles.galleryCompact]}>
      <View style={styles.stage}>
        {selectedItem?.type === "VIDEO" ? (
          <AppVideo
            uri={selectedItem.url || ""}
            style={styles.stageItem}
            posterUri={selectedItem.thumbnailUrl}
            nativeControls
            contentFit="cover"
          />
        ) : (
          <Image
            source={{ uri: selectedItem?.url || selectedItem?.thumbnailUrl || "" }}
            style={styles.stageItem}
            accessibilityLabel={selectedItem?.alt || title}
          />
        )}

        {selectedItem?.isCover ? (
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>Cover</Text>
          </View>
        ) : null}
      </View>

      {media.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
        >
          {media.map((item, index) => {
            const isActive = index === activeIndex;
            const isVideo = item.type === "VIDEO";
            return (
              <Pressable
                key={String(item.id || `${item.url}-${index}`)}
                style={[styles.thumbButton, isActive && styles.thumbButtonActive]}
                onPress={() => setSelectedIndex(index)}
                accessibilityLabel={`View ${isVideo ? "video" : "image"} ${index + 1}`}
              >
                {isVideo ? (
                  <>
                    <AppVideo
                      uri={item.url || item.thumbnailUrl || ""}
                      style={styles.thumbItem}
                      posterUri={item.thumbnailUrl}
                      shouldPlay={false}
                      isMuted
                      contentFit="cover"
                    />
                    <View style={styles.thumbPlayWrap}>
                      <Feather name="play" size={12} color="#FFFFFF" />
                    </View>
                  </>
                ) : (
                  <Image
                    source={{ uri: item.thumbnailUrl || item.url || "" }}
                    style={styles.thumbItem}
                    accessibilityLabel={item.alt || title}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: {
    gap: 12,
  },
  galleryCompact: {
    gap: 10,
  },
  stage: {
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  stageItem: {
    width: "100%",
    height: 280,
  },
  coverBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
  },
  coverBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  thumbRow: {
    gap: 10,
  },
  thumbButton: {
    width: 92,
    height: 92,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#E2E8F0",
  },
  thumbButtonActive: {
    borderColor: "#0F766E",
  },
  thumbItem: {
    width: "100%",
    height: "100%",
  },
  thumbPlayWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 26,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  emptyCardCompact: {
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#486581",
    textAlign: "center",
  },
});
