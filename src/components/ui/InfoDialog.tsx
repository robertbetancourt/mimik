import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Modal, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { buttonShadow, overlayShadow } from "@/theme/shadow";

interface InfoDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  onClose: () => void;
}

const PRIMARY_GRADIENT = ["#FF9A6B", "#FF7A45", "#E8552A"] as const;

export function InfoDialog({
  visible,
  title,
  message,
  buttonLabel,
  onClose,
}: InfoDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center">
        <BlurView
          intensity={40}
          tint="dark"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </BlurView>

        <View
          style={overlayShadow}
          className="w-[85%] max-w-sm rounded-3xl border border-white/10 bg-[#14111E] p-6"
        >
          <Text className="text-center font-sans-bold text-xl text-white">{title}</Text>
          <Text className="mt-3 text-center font-sans-medium text-base text-white/70 leading-6">
            {message}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={buttonShadow}
            className="mt-6 overflow-hidden rounded-full"
          >
            <LinearGradient
              colors={PRIMARY_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center py-3.5"
            >
              <Text className="font-sans-bold text-base text-white">{buttonLabel}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
