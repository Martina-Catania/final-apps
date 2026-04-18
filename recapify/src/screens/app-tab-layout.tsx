import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, BottomNavBar } from "../components";
import { useThemeTokens } from "../hooks";
import { SafeAreaPage } from "./safe-area-page";

export type AppTabKey = "home" | "projects" | "showcase";

type AppTabLayoutProps = {
  title: string;
  activeTab: AppTabKey;
  onTabPress: (key: AppTabKey) => void;
  children: ReactNode;
  onMenuPress: () => void;
};

const APP_TAB_ITEMS = [
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

export function AppTabLayout({
  title,
  activeTab,
  onTabPress,
  children,
  onMenuPress,
}: AppTabLayoutProps) {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <SafeAreaPage
      backgroundColor={colors.background}
      bottomBackgroundColor={colors.background}
      topBackgroundColor={colors.surface}
      topContent={
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
      }
      bottomContent={
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
            items={APP_TAB_ITEMS}
            onTabPress={(key) => onTabPress(key as AppTabKey)}
          />
        </View>
      }
    >
      {children}
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
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
});