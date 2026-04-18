import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppToggle, Button, BottomNavBar, DrawerPanel } from "../components";
import { useAuth } from "../context/auth-context";
import { useThemePreference } from "../context/theme-context";
import { useThemeTokens } from "../hooks";
import { SafeAreaPage } from "./safe-area-page";

export type AppTabKey = "home" | "projects" | "showcase";

type AppTabLayoutProps = {
  title: string;
  activeTab: AppTabKey;
  onTabPress: (key: AppTabKey) => void;
  children: ReactNode;
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
}: AppTabLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, setMode } = useThemePreference();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
    } finally {
      setIsSigningOut(false);
      setIsDrawerOpen(false);
    }
  };

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
              onPress={() => setIsDrawerOpen(true)}
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
      <>
        {children}

        <DrawerPanel
          onClose={() => setIsDrawerOpen(false)}
          title="Profile"
          visible={isDrawerOpen}
        >
          <View style={{ gap: spacing.md }}>
            <Pressable
              onPress={() => {
                if (!user?.id) {
                  return;
                }

                setIsDrawerOpen(false);
                router.push({
                  pathname: "/profile/[id]",
                  params: { id: String(user.id) },
                });
              }}
              style={({ pressed }) => [
                styles.profileCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  gap: spacing.xxs,
                  opacity: pressed ? 0.85 : 1,
                  padding: spacing.md,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.secondary.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                @{user?.username ?? "unknown"}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.sm,
                }}
              >
                {user?.email ?? "No email available"}
              </Text>
            </Pressable>

            <AppToggle
              description={`Current mode: ${mode}`}
              label="Dark theme"
              onValueChange={(nextValue) => setMode(nextValue ? "dark" : "light")}
              value={mode === "dark"}
            />

            <Button
              fullWidth
              iconName="grid-outline"
              label="Open component showcase"
              onPress={() => {
                setIsDrawerOpen(false);
                router.push("/showcase");
              }}
              variant="secondary"
            />

            <Button
              disabled={isSigningOut}
              fullWidth
              iconName="log-out-outline"
              label={isSigningOut ? "Signing out..." : "Log out"}
              onPress={() => {
                void handleSignOut();
              }}
              variant="default"
            />
          </View>
        </DrawerPanel>
      </>
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
  profileCard: {
    borderWidth: 1,
  },
});
