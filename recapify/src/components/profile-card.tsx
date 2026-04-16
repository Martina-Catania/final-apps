import { StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { AppButton } from "./button";
import { Avatar } from "./avatar";

type ProfileCardProps = {
  name: string;
  avatarUri?: string;
  followers?: number;
  following?: number;
  projects?: number;
  onFollowPress?: () => void;
};

export const ProfileCard = ({
  name,
  avatarUri,
  followers = 0,
  following = 0,
  projects: projects = 0,
  onFollowPress,
}: ProfileCardProps) => {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          gap: spacing.md,
          padding: spacing.lg,
        },
      ]}
    >
      <Avatar avatarUri={avatarUri} name={name} />

      <View style={[styles.stats, { gap: spacing.md }]}>
        <View style={styles.statItem}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            {followers}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.secondary.sm }}>
            Followers
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            {following}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.secondary.sm }}>
            Following
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            {projects}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.secondary.sm }}>
            Projects
          </Text>
        </View>
      </View>

      <AppButton
        fullWidth
        iconName="person-add-outline"
        label="Follow"
        onPress={onFollowPress}
        variant="primary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
});
