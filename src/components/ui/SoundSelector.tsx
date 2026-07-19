import { ChevronLeft, ChevronRight, Play } from "lucide-react-native";
import { Text, View } from "react-native";

import { IconButton } from "@/components/ui/IconButton";
import { cardShadow } from "@/theme/shadow";

interface SoundOption {
  id: string;
  label: string;
}

interface SoundSelectorProps {
  label: string;
  options: SoundOption[];
  selectedId: string;
  onChange: (id: string) => void;
  onPreview: (id: string) => void;
}

export function SoundSelector({ label, options, selectedId, onChange, onPreview }: SoundSelectorProps) {
  const selectedIndex = Math.max(
    options.findIndex((option) => option.id === selectedId),
    0,
  );
  const selected = options[selectedIndex];

  function selectByOffset(offset: number) {
    const nextIndex = (selectedIndex + offset + options.length) % options.length;
    const next = options[nextIndex];
    onChange(next.id);
    onPreview(next.id);
  }

  return (
    <View style={cardShadow} className="rounded-3xl bg-surface px-5 py-4">
      <Text className="font-sans-bold text-base text-ink">{label}</Text>

      <View className="mt-3 flex-row items-center justify-between">
        <IconButton onPress={() => selectByOffset(-1)} className="h-11 w-11 bg-background">
          <ChevronLeft size={20} color="#2B2118" />
        </IconButton>

        <View className="flex-1 flex-row items-center justify-center gap-2">
          <Text className="font-sans-bold text-base text-ink">{selected?.label}</Text>
          <IconButton onPress={() => onPreview(selectedId)} className="h-8 w-8 bg-primary">
            <Play size={14} color="white" fill="white" />
          </IconButton>
        </View>

        <IconButton onPress={() => selectByOffset(1)} className="h-11 w-11 bg-background">
          <ChevronRight size={20} color="#2B2118" />
        </IconButton>
      </View>
    </View>
  );
}
