import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, BottomNavBar } from "../components";
import { useThemeTokens } from "../hooks";

export type ShellTabKey = "home" | "projects" | "showcase";

type PageShellProps = {
  title: string;
  activeTab: ShellTabKey;
  onTabPress: (key: ShellTabKey) => void;
  children: ReactNode;
  onMenuPress: () => void;
};

const SHELL_NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    iconName: "home-outline" as const,
    activeIconName: "home" as const,
  },
  {
    key: "projects",
    label: "Projects",
    iconName: "folder-open-outline" as const,
    activeIconName: "folder-open" as const,
  },
  {
    key: "showcase",
    label: "Showcase",
    iconName: "grid-outline" as const,
    activeIconName: "grid" as const,
  },
];

export function PageShell({
  title,
  activeTab,
  onTabPress,
  children,
  onMenuPress,
}: PageShellProps) {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.screen}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography.primary.lg,
                fontWeight: typography.weights.bold,
                textAlign: "center",
              }}
            >
              {title}
            </Text>

            <View style={[styles.headerActionContainer, { left: spacing.md }]}>
              <Button
                iconName="menu-outline"
                label="Menu"
                onPress={onMenuPress}
                variant="icon"
              />
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.content}>{children}</View>

        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.background }}>
          <View
            style={{
              backgroundColor: colors.background,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.sm,
            }}
          >
            <BottomNavBar
              activeKey={activeTab}
              items={SHELL_NAV_ITEMS}
              onTabPress={(key) => onTabPress(key as ShellTabKey)}
            />
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 56,
  },
  headerActionContainer: {
    position: "absolute",
  },
  content: {
    flex: 1,
  },
});
