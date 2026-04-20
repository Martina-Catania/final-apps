import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type AvatarProps = {
  avatarUri?: string;
  size?: number;
  onPress?: () => void;
};

export const Avatar = ({ avatarUri, size = 72, onPress }: AvatarProps) => {
  const { colors, spacing, typography } = useThemeTokens();

  const avatarNode = (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: colors.primaryMuted,
          borderColor: colors.primary,
          height: size,
          width: size,
        },
      ]}
    >
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
      ) : (
        <Ionicons color={colors.primary} name="person" size={Math.round(size * 0.44)} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { gap: spacing.md }]}>
      {onPress ? (
        <Pressable
          accessibilityLabel="Change profile picture"
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => ({
            borderRadius: 999,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {avatarNode}
        </Pressable>
      ) : (
        avatarNode
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
  },
  avatar: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
});
