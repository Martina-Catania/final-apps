import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../components";
import { AppTextInput } from "../components/TextInput";
import { useAuth } from "../context/auth-context";
import { useThemeTokens } from "../hooks";
import { SafeAreaPage } from "../screens/safe-area-page";

export default function LoginPage() {
  const { colors, spacing, typography, radius } = useThemeTokens();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              padding: spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={{ gap: spacing.xs }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.primary.md,
                  fontWeight: typography.weights.bold,
                }}
              >
                Sign In
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                Enter your email and password to access protected pages.
              </Text>
            </View>

            <View style={{ gap: spacing.md }}>
              <AppTextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="you@example.com"
                value={email}
              />

              <AppTextInput
                autoCapitalize="none"
                autoComplete="password"
                label="Password"
                onChangeText={setPassword}
                onRightIconPress={() => setShowPassword((current) => !current)}
                placeholder="Enter your password"
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                secureTextEntry={!showPassword}
                value={password}
              />

              {errorMessage ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                disabled={isLoading}
                fullWidth
                label={isLoading ? "Signing in..." : "Sign In"}
                onPress={() => {
                  void handleLogin();
                }}
                variant="primary"
              />

              <View style={styles.footerRow}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  Don&apos;t have an account?
                </Text>
                <Link asChild href="/register">
                  <Pressable>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: typography.secondary.sm,
                        fontWeight: typography.weights.semibold,
                      }}
                    >
                      Register
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
});