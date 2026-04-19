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
  AppActionSheet,
  AppModal,
  Button,
  ProjectTagPills,
  SummaryMarkdownView,
} from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { deleteProjectRequest } from "../../../../utils/project-api";
import {
  getSummaryByIdRequest,
  type Summary,
} from "../../../../utils/summary-api";
import { projectTagsToFlatTags } from "../../../../utils/tag-utils";

type SummaryActionValue = "view-creator" | "edit-summary" | "delete-project";

type SummaryActionItem = {
  label: string;
  value: SummaryActionValue;
  iconName?: "person-outline" | "create-outline" | "trash-outline";
  destructive?: boolean;
  disabled?: boolean;
};

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

export default function SummaryDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const summaryId = useMemo(() => parseSummaryId(id), [id]);
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const loadSummary = useCallback(async () => {
    if (!summaryId) {
      setErrorMessage("Invalid summary id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setDeleteErrorMessage(null);

    try {
      const payload = await getSummaryByIdRequest(summaryId, token ?? undefined);
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

  const creatorUsername = summary?.project.user?.username;
  const creatorLabel = summary
    ? creatorUsername
      ? `@${creatorUsername}`
      : `User #${summary.project.userId}`
    : "";
  const isOwner = summary ? user?.id === summary.project.userId : false;

  const handleOpenCreatorProfile = useCallback(() => {
    if (!summary) {
      return;
    }

    router.push({
      pathname: "/profile/[id]",
      params: {
        id: String(summary.project.userId),
      },
    });
  }, [router, summary]);

  const handleOpenActions = useCallback(() => {
    setIsActionsOpen(true);
  }, []);

  const handleCloseActions = useCallback(() => {
    setIsActionsOpen(false);
  }, []);

  const handleOpenDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    if (isDeletePending) {
      return;
    }

    setIsDeleteConfirmOpen(false);
  }, [isDeletePending]);

  const actionItems = useMemo<SummaryActionItem[]>(() => {
    const items: SummaryActionItem[] = [
      {
        label: "View creator profile",
        value: "view-creator",
        iconName: "person-outline",
      },
    ];

    if (isOwner) {
      items.push({
        label: "Edit summary",
        value: "edit-summary",
        iconName: "create-outline",
      });
      items.push({
        label: "Delete project",
        value: "delete-project",
        iconName: "trash-outline",
        destructive: true,
        disabled: isDeletePending,
      });
    }

    return items;
  }, [isDeletePending, isOwner]);

  const handleSelectAction = useCallback(
    (value: SummaryActionValue) => {
      if (!summary) {
        return;
      }

      if (value === "view-creator") {
        handleOpenCreatorProfile();
        return;
      }

      if (value === "edit-summary") {
        router.push({
          pathname: "/summary/[id]/edit",
          params: { id: String(summary.id) },
        });
        return;
      }

      handleOpenDeleteConfirm();
    },
    [handleOpenCreatorProfile, handleOpenDeleteConfirm, router, summary],
  );

  const handleConfirmDeleteProject = useCallback(async () => {
    if (!summary || isDeletePending) {
      return;
    }

    setDeleteErrorMessage(null);
    setIsDeletePending(true);

    try {
      await deleteProjectRequest(summary.projectId, token ?? undefined);
      setIsDeleteConfirmOpen(false);
      router.back();
    } catch (error) {
      setDeleteErrorMessage(getApiErrorMessage(error, "Unable to delete project"));
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeletePending(false);
    }
  }, [isDeletePending, router, summary, token]);

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
            styles.errorCard,
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
              iconName="arrow-back-outline"
              label="Back"
              onPress={handleBackPress}
              variant="default"
            />
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
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("../..")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <>
        <ScrollView
          contentContainerStyle={{
            gap: spacing.lg,
            padding: spacing.lg,
          }}
        >
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.sm,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={[styles.headerInfoRow, { gap: spacing.sm }]}> 
              <Button
                iconName="arrow-back-outline"
                label="Back"
                onPress={handleBackPress}
                variant="icon"
              />

              <View style={[styles.headerInfoText, { gap: spacing.xxs }]}> 
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
                  {creatorLabel}
                </Text>
              </View>

              <Button
                disabled={isDeletePending}
                iconName="ellipsis-vertical-outline"
                label="Actions"
                onPress={handleOpenActions}
                variant="icon"
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <Button
                fullWidth
                iconName="play-outline"
                label="Play summary"
                onPress={() =>
                  router.push({
                    pathname: "/summary/[id]/play",
                    params: { id: String(summary.id) },
                  })
                }
                variant="secondary"
              />
              {deleteErrorMessage ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {deleteErrorMessage}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.md,
                padding: spacing.lg,
              },
            ]}
          >
            <ProjectTagPills tags={projectTagsToFlatTags(summary.project.tags)} />

            <SummaryMarkdownView
              fontSize={typography.secondary.md}
              linkColor={colors.primary}
              markdown={summary.content}
              textColor={colors.textPrimary}
            />
          </View>
        </ScrollView>

        <AppActionSheet<SummaryActionValue>
          isOpen={isActionsOpen}
          items={actionItems}
          onClose={handleCloseActions}
          onSelect={handleSelectAction}
          title="Summary actions"
        />

        <AppModal
          actions={[
            {
              iconName: "close-outline",
              label: "Cancel",
              onPress: handleCloseDeleteConfirm,
              variant: "default",
            },
            {
              iconName: "trash-outline",
              label: isDeletePending ? "Deleting..." : "Delete project",
              onPress: () => {
                void handleConfirmDeleteProject();
              },
              variant: "primary",
            },
          ]}
          description="This will permanently remove this project and its summary data. This action cannot be undone."
          onClose={handleCloseDeleteConfirm}
          title="Delete project?"
          visible={isDeleteConfirmOpen}
        />
      </>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  contentCard: {
    borderWidth: 1,
  },
  errorCard: {
    borderWidth: 1,
  },
  headerCard: {
    borderWidth: 1,
  },
  headerInfoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerInfoText: {
    flex: 1,
  },
});
