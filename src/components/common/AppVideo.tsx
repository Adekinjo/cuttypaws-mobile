import { useVideoPlayer, VideoView, type VideoContentFit } from "expo-video";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export default function AppVideo({
  uri,
  style,
  contentFit = "cover",
  posterUri,
  shouldPlay = false,
  isMuted = false,
  isLooping = false, 
  nativeControls = false,
}: {
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: VideoContentFit;
  posterUri?: string | null;
  shouldPlay?: boolean;
  isMuted?: boolean;
  isLooping?: boolean;
  nativeControls?: boolean;
}) {
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);
  const player = useVideoPlayer(uri ? { uri } : null, (instance) => {
    instance.loop = isLooping;
    instance.muted = isMuted;
    if (shouldPlay) {
      instance.play();
    }
  });

  useEffect(() => {
    setHasRenderedFrame(false);
  }, [uri]);

  useEffect(() => {
    player.loop = isLooping;
  }, [isLooping, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, shouldPlay]);

  if (!uri) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        nativeControls={nativeControls}
        surfaceType={Platform.OS === "android" ? "textureView" : undefined}
        onFirstFrameRender={() => setHasRenderedFrame(true)}
      />
      {posterUri && !hasRenderedFrame ? (
        <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#0F172A",
  },
});
