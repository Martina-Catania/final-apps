import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppToggle, Button, BottomNavBar, DrawerPanel } from "../components";
import { useAuth } from "../context/auth-context";
import { useThemePreference } from "../context/theme-context";
import { useThemeTokens } from "../hooks";
import { getApiHostUrl } from "../utils/api-config";
import { SafeAreaPage } from "./safe-area-page";

export type AppTabKey = "home" | "create" | "search";

type AppTabLayoutProps = {
  title: string;
  activeTab: AppTabKey;
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
    key: "create",
    label: "Create",
    iconName: "add-circle-outline" as const,
    activeIconName: "add-circle" as const,
  },
  {
    key: "search",
    label: "Search",
    iconName: "search-outline" as const,
    activeIconName: "search" as const,
  },
];

const API_HOST = getApiHostUrl();

function resolveAvatarUri(avatarUrl: string | null) {
  if (!avatarUrl) {
    return undefined;
  }

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  return `${API_HOST}${avatarUrl}`;
}

export function AppTabLayout({
  title,
  activeTab,
  children,
}: AppTabLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, setMode } = useThemePreference();
  const { colors, spacing, typography, radius } = useThemeTokens();
  const avatarUri = resolveAvatarUri(user?.avatarUrl ?? null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const showEventName = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEventName = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEventName, () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEventName, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
        isKeyboardVisible ? null : (
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
            />
          </View>
        )
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
                  alignItems: "flex-start",
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  gap: spacing.xxs,
                  opacity: pressed ? 0.85 : 1,
                  padding: spacing.md,
                },
              ]}
            >
              <View
                style={[
                  styles.profileAvatarContainer,
                  {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary,
                    marginBottom: spacing.xxs,
                  },
                ]}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.profileAvatarImage} />
                ) : (
                  <Ionicons color={colors.primary} name="person" size={32} />
                )}
              </View>

              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.secondary.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                {user?.username ?? "unknown"}
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
  profileAvatarContainer: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: "center",
    overflow: "hidden",
    width: 72,
  },
  profileAvatarImage: {
    height: "100%",
    width: "100%",
  },
});
