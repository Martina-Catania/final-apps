import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { useSafeNavigation, useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { getApiHostUrl } from "../../../../utils/api-config";
import { incrementProjectTimesPlayedRequest } from "../../../../utils/project-api";
import { isRichTextEmpty } from "../../../../utils/rich-text";
import { getSummaryByIdRequest, type Summary } from "../../../../utils/summary-api";

const API_HOST = getApiHostUrl();

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

function getSummaryFileDisplayName(filename: string) {
  const normalized = filename.trim().replace(/\\/g, "/");

  if (!normalized) {
    return "Unnamed file";
  }

  const segments = normalized.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : normalized;
}

function resolveSummaryFileUrl(filename: string) {
  const trimmed = filename.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const displayName = getSummaryFileDisplayName(trimmed);
  return `${API_HOST}/uploads/summary-files/${encodeURIComponent(displayName)}`;
}

export default function SummaryPlayPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const summaryId = useMemo(() => parseSummaryId(id), [id]);
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileActionError, setFileActionError] = useState<string | null>(null);

  const goBackOnStack = useCallback(() => {
    goBack();
  }, [goBack]);

  const loadSummary = useCallback(async () => {
    if (!summaryId) {
      setErrorMessage("Invalid summary id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setFileActionError(null);

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

  const handleOpenFile = useCallback(async (filename: string) => {
    setFileActionError(null);

    const url = resolveSummaryFileUrl(filename);

    if (!url) {
      setFileActionError("This file link is not available");
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      setFileActionError("Unable to open this file on your device");
    }
  }, []);

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
              onPress={() => router.replace("/")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  const hasSummaryContent = !isRichTextEmpty(summary.content);

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            gap: spacing.lg,
            padding: spacing.lg,
          },
        ]}
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
                Read mode
              </Text>
            </View>
          </View>        
        </View>

        <View
          style={[
            styles.card,
            hasSummaryContent ? styles.scrollContent : null,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.md,
              padding: spacing.lg,
            },
          ]}
        >
          {hasSummaryContent ? (
            <SummaryMarkdownView
              fontSize={typography.secondary.md}
              linkColor={colors.primary}
              markdown={summary.content}
              style={styles.scrollContent}
              textColor={colors.textPrimary}
            />
          ) : (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              No summary text was provided for this entry.
            </Text>
          )}
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
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.md,
              fontWeight: typography.weights.bold,
            }}
          >
            Attached files
          </Text>

          {summary.files.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              No files uploaded for this summary.
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {summary.files.map((file) => (
                <View
                  key={`summary-file-${file.id}`}
                  style={[
                    styles.fileRow,
                    {
                      borderColor: colors.border,
                      borderRadius: radius.sm,
                      gap: spacing.sm,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: colors.textPrimary,
                      flex: 1,
                      fontSize: typography.secondary.md,
                      fontWeight: typography.weights.medium,
                    }}
                  >
                    {getSummaryFileDisplayName(file.filename)}
                  </Text>

                  <Button
                    iconName="open-outline"
                    label="Open"
                    onPress={() => {
                      void handleOpenFile(file.filename);
                    }}
                    variant="default"
                  />
                </View>
              ))}
            </View>
          )}

          {fileActionError ? (
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.secondary.sm,
              }}
            >
              {fileActionError}
            </Text>
          ) : null}
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
  fileRow: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
  },
  scrollContent: {
    flexGrow: 1,
  },
});
