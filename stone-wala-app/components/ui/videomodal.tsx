import { Feather } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useMemo } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VideoModalProps = {
  visible: boolean;
  videoUrl: string | null;
  onClose: () => void;
};

export default function VideoModal({
  visible,
  videoUrl,
  onClose,
}: VideoModalProps) {
  const insets = useSafeAreaInsets();

  // ✅ Stable URL (important)
  const finalUrl = useMemo(() => videoUrl ?? "", [videoUrl]);

  // ✅ Create player only when modal visible
  const player = useVideoPlayer(
    visible && finalUrl ? finalUrl : "",
    (player) => {
      player.loop = true;
      player.play();
    }
  );

  if (!visible || !videoUrl) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View className="flex-1 bg-black">

        {/* VIDEO */}
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />

        {/* CLOSE */}
        <View
          style={{ paddingTop: insets.top + 10 }}
          className="absolute top-0 left-0 right-0 px-5 flex-row justify-end"
        >
          <Pressable
            onPress={onClose}
            className="bg-white/10 border border-white/20 px-4 py-2 rounded-full flex-row items-center"
          >
            <Feather name="x" size={16} color="white" />
            <Text className="text-white ml-2 font-semibold text-sm">
              Close
            </Text>
          </Pressable>
        </View>

      </View>
    </Modal>
  );
}