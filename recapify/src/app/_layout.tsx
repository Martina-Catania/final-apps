import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "../context/auth-context";
import { ThemeProvider } from "../context/theme-context";
import { useThemeTokens } from "../hooks";

function AppNavigator() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useThemeTokens();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const firstSegment = String(segments[0] ?? "");
    const isAuthRoute = firstSegment === "login" || firstSegment === "register";

    if (!token && !isAuthRoute) {
      router.replace("/login");
      return;
    }

    if (token && isAuthRoute) {
      router.replace("./");
    }
  }, [isLoading, router, segments, token]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
