import { View } from "react-native";

import { PlayerAvatar } from "@/features/players/PlayerAvatar";
import type { Player } from "@/types/player";

interface PlayerGridProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
}

export function PlayerGrid({ players, onSelectPlayer }: PlayerGridProps) {
  return (
    <View className="flex-row flex-wrap gap-x-[4%] gap-y-4">
      {players.map((player) => (
        <PlayerAvatar key={player.id} player={player} onPress={() => onSelectPlayer(player)} />
      ))}
    </View>
  );
}
