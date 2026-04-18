import { StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { Button } from "./Button";
import { Avatar } from "./Avatar";

type ProfileCardProps = {
  name: string;
  username?: string;
  avatarUri?: string;
  followers?: number;
  following?: number;
  projects?: number;
  showFollowButton?: boolean;
  followButtonLabel?: string;
  followButtonDisabled?: boolean;
  onFollowPress?: () => void;
};

export const ProfileCard = ({
  name,
  username,
  avatarUri,
  followers = 0,
  following = 0,
  projects: projects = 0,
  showFollowButton = true,
  followButtonLabel = "Follow",
  followButtonDisabled = false,
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
      <View style={{ gap: spacing.xxs }}>
        <Avatar avatarUri={avatarUri} name={name} />
        {username ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
              marginLeft: 84,
            }}
          >
            @{username}
          </Text>
        ) : null}
      </View>

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

      {showFollowButton ? (
        <Button
          disabled={followButtonDisabled}
          fullWidth
          iconName="person-add-outline"
          label={followButtonLabel}
          onPress={onFollowPress}
          variant="primary"
        />
      ) : null}
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
