import { Ionicons } from "@expo/vector-icons";
import { TabTrigger } from "expo-router/ui";
import { type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type IconName = ComponentProps<typeof Ionicons>["name"];

type BottomNavItem = {
  key: string;
  label: string;
  iconName: IconName;
  activeIconName?: IconName;
};

type BottomNavBarProps = {
  items: BottomNavItem[];
  activeKey: string;
};

export const BottomNavBar = ({
  items,
  activeKey,
}: BottomNavBarProps) => {
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const icon = isActive ? item.activeIconName ?? item.iconName : item.iconName;

        return (
          <TabTrigger asChild key={item.key} name={item.key}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: isActive ? colors.primaryMuted : "transparent",
                  borderColor: isActive ? colors.primary : "transparent",
                  gap: spacing.xxs,
                  opacity: pressed ? 0.8 : 1,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Ionicons
                color={isActive ? colors.primary : colors.textSecondary}
                name={icon}
                size={iconSizes.md}
              />
              <Text
                style={{
                  color: isActive ? colors.primary : colors.textSecondary,
                  fontSize: typography.secondary.sm,
                  fontWeight: isActive
                    ? typography.weights.semibold
                    : typography.weights.medium,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          </TabTrigger>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
});
