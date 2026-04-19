import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  SummaryMarkdownView,
} from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { incrementProjectTimesPlayedRequest } from "../../../../utils/project-api";
import { getSummaryByIdRequest, type Summary } from "../../../../utils/summary-api";

function parseSummaryId(value: string | string[] | undefined): number | null {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (!firstValue) {
    return null;
  }

  const parsed = Number.parseInt(firstValue, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default function SummaryPlayPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const summaryId = useMemo(() => parseSummaryId(id), [id]);
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const goBackOnStack = useCallback(() => {
    const maybeRouter = router as typeof router & { canGoBack?: () => boolean };

    if (typeof maybeRouter.canGoBack === "function" && maybeRouter.canGoBack()) {
      router.back();
      return;
    }

    router.replace("../../..");
  }, [router]);

  const loadSummary = useCallback(async () => {
    if (!summaryId) {
      setErrorMessage("Invalid summary id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await getSummaryByIdRequest(summaryId, token ?? undefined);
      void incrementProjectTimesPlayedRequest(payload.projectId, token ?? undefined).catch(
        () => undefined,
      );

      setSummary(payload);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load summary"));
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [summaryId, token]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (isLoading) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaPage>
    );
  }

  if (errorMessage || !summary) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.md,
              margin: spacing.lg,
              padding: spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.md,
              fontWeight: typography.weights.bold,
            }}
          >
            Summary could not be loaded
          </Text>
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.secondary.md,
            }}
          >
            {errorMessage ?? "Unexpected error"}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadSummary();
              }}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={goBackOnStack}
              variant="default"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("../../..")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.sm,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={[styles.headerRow, { gap: spacing.sm }]}> 
            <Button
              iconName="arrow-back-outline"
              label="Back"
              onPress={goBackOnStack}
              variant="icon"
            />
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.primary.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                {summary.project.title}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                Summary
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Read mode
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.md,
              padding: spacing.lg,
            },
          ]}
        >
          <SummaryMarkdownView
            fontSize={typography.secondary.md}
            linkColor={colors.primary}
            markdown={summary.content}
            textColor={colors.textPrimary}
          />
        </View>
      </ScrollView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
});
