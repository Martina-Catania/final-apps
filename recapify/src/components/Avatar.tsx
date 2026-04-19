import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type AvatarProps = {
  name: string;
  avatarUri?: string;
  size?: number;
};

export const Avatar = ({ name, avatarUri, size = 72 }: AvatarProps) => {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <View style={[styles.container, { gap: spacing.md }]}>
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

      <Text
        style={{
          color: colors.textPrimary,
          flex: 1,
          fontSize: typography.primary.sm,
          fontWeight: typography.weights.bold,
        }}
      >
        {name}
      </Text>
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
