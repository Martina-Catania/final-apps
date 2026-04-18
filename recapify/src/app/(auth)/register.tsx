import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../components";
import { AppTextInput } from "../../components/TextInput";
import { useAuth } from "../../context/auth-context";
import { useThemeTokens } from "../../hooks";
import { SafeAreaPage } from "../../screens/safe-area-page";
import { AuthApiError } from "../../utils/auth-api";
import { validatePasswordWithBreachCheck } from "../../utils/password-validation";

function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (
      error.details &&
      typeof error.details === "object" &&
      "errors" in error.details &&
      Array.isArray(error.details.errors)
    ) {
      const message = error.details.errors
        .filter((item): item is string => typeof item === "string")
        .join(". ");

      if (message) {
        return message;
      }
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to register";
}

export default function RegisterPage() {
  const { colors, spacing, typography, radius } = useThemeTokens();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordChecks = useMemo(
    () => [
      {
        label: "At least 6 characters",
        passes: password.length >= 6,
      },
      {
        label: "Contains at least one number",
        passes: /\d/.test(password),
      },
      {
        label: "Contains at least one letter",
        passes: /[a-zA-Z]/.test(password),
      },
      {
        label: "Contains at least one uppercase letter",
        passes: /[A-Z]/.test(password),
      },
    ],
    [password],
  );

  const handleRegister = async () => {
    setErrorMessage(null);

    if (password !== repeatPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const passwordValidation = await validatePasswordWithBreachCheck(password);
      if (!passwordValidation.isValid) {
        setErrorMessage(passwordValidation.errors.join(". "));
        return;
      }

      await register({
        email: email.trim(),
        username: username.trim(),
        password,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
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
                Create Account
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                Register to unlock protected pages.
              </Text>
            </View>

            <View style={{ gap: spacing.md }}>
              <AppTextInput
                autoCapitalize="none"
                label="Username"
                onChangeText={setUsername}
                placeholder="Choose a username"
                value={username}
              />

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
                placeholder="Create a password"
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                secureTextEntry={!showPassword}
                value={password}
              />

              <View style={{ gap: spacing.xs }}>
                {passwordChecks.map((check) => (
                  <Text
                    key={check.label}
                    style={{
                      color: check.passes ? colors.success : colors.textSecondary,
                      fontSize: typography.secondary.sm,
                    }}
                  >
                    • {check.label}
                  </Text>
                ))}
              </View>

              <AppTextInput
                autoCapitalize="none"
                autoComplete="password"
                label="Repeat Password"
                onChangeText={setRepeatPassword}
                onRightIconPress={() => setShowRepeatPassword((current) => !current)}
                placeholder="Re-enter your password"
                rightIcon={showRepeatPassword ? "eye-off-outline" : "eye-outline"}
                secureTextEntry={!showRepeatPassword}
                value={repeatPassword}
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
                label={isLoading ? "Creating account..." : "Register"}
                onPress={() => {
                  void handleRegister();
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
                  Already have an account?
                </Text>
                <Link asChild href="/login">
                  <Pressable>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: typography.secondary.sm,
                        fontWeight: typography.weights.semibold,
                      }}
                    >
                      Sign in
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