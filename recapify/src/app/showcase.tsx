import { useRouter } from "expo-router";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  PRIMARY_TEXT_SIZES,
  SECONDARY_TEXT_SIZES,
} from "../constants";
import {
  Accordion,
  AppActionSheet,
  Button,
  AppCheckbox,
  AppModal,
  AppTextInput,
  AppToggle,
  BottomNavBar,
  Carousel,
  DateTimeField,
  DrawerPanel,
  FileUploadField,
  Pagination,
  ProfileCard,
  RefreshableScroll,
  SkeletonBlock,
  SkeletonCard,
  type UploadedFile,
} from "../components";
import { useAuth } from "../context/auth-context";
import { useThemeTokens } from "../hooks";
import { AppTabLayout, type AppTabKey } from "../screens/app-tab-layout";

type ShowcaseSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type UseDisclosureOptions = {
  defaultOpen?: boolean;
};

const useDisclosure = (options?: UseDisclosureOptions) => {
  const [isOpen, setIsOpen] = useState(options?.defaultOpen ?? false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
};

type UsePaginationOptions = {
  initialPage?: number;
  pageSize?: number;
};

const usePagination = (
  totalItems: number,
  options?: UsePaginationOptions,
) => {
  const pageSize = options?.pageSize ?? 5;
  const [currentPage, setCurrentPage] = useState(options?.initialPage ?? 1);

  const totalPages = useMemo(() => {
    if (totalItems <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [pageSize, totalItems]);

  const safeCurrentPage = useMemo(() => {
    return Math.min(Math.max(currentPage, 1), totalPages);
  }, [currentPage, totalPages]);

  const canGoBack = safeCurrentPage > 1;
  const canGoForward = safeCurrentPage < totalPages;

  const goToPage = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const nextPage = () => {
    goToPage(safeCurrentPage + 1);
  };

  const previousPage = () => {
    goToPage(safeCurrentPage - 1);
  };

  return {
    currentPage: safeCurrentPage,
    pageSize,
    totalPages,
    canGoBack,
    canGoForward,
    goToPage,
    nextPage,
    previousPage,
  };
};

type RefreshFn = () => Promise<void> | void;

const useRefreshControl = (refreshFn?: RefreshFn) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.resolve(refreshFn?.());
    } finally {
      setRefreshing(false);
    }
  }, [refreshFn]);

  return {
    refreshing,
    onRefresh,
    setRefreshing,
  };
};

const useActionSheet = <TValue extends string = string>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<TValue | null>(null);

  const openSheet = () => {
    setIsOpen(true);
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  const selectValue = (value: TValue) => {
    setSelectedValue(value);
    setIsOpen(false);
  };

  return {
    isOpen,
    selectedValue,
    setSelectedValue,
    openSheet,
    closeSheet,
    selectValue,
  };
};

const ShowcaseSection = ({
  title,
  subtitle,
  children,
}: ShowcaseSectionProps) => {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          gap: spacing.md,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={{ gap: spacing.xxs }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.primary.sm,
            fontWeight: typography.weights.bold,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
};

const CAROUSEL_ITEMS = [
  {
    id: "deck",
    title: "Deck Insights",
    description: "Track recall strength across your active decks.",
    iconName: "library-outline" as const,
    accentColor: "#0F5FBF",
  },
  {
    id: "quiz",
    title: "Quiz Flow",
    description: "Create timed quizzes and revisit missed questions quickly.",
    iconName: "help-circle-outline" as const,
    accentColor: "#0B8AB8",
  },
  {
    id: "summary",
    title: "Summary Studio",
    description: "Bundle highlights, notes, and source links in one place.",
    iconName: "document-text-outline" as const,
    accentColor: "#1C8C5E",
  },
];

const BOTTOM_TABS = [
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
    key: "profile",
    label: "Profile",
    iconName: "person-outline" as const,
    activeIconName: "person" as const,
  },
];

const ACTION_ITEMS = [
  {
    label: "Share project",
    value: "share",
    iconName: "share-social-outline" as const,
  },
  {
    label: "Archive project",
    value: "archive",
    iconName: "archive-outline" as const,
  },
  {
    label: "Delete project",
    value: "delete",
    iconName: "trash-outline" as const,
    destructive: true,
  },
] as const;

const TOTAL_SUMMARIES = 24;
const SUMMARY_PAGE_SIZE = 5;

const wait = (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

export default function Index() {
  const router = useRouter();
  const { colors, spacing, typography, mode } = useThemeTokens();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [searchText, setSearchText] = useState("");
  const [secretTextVisible, setSecretTextVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isToggleEnabled, setIsToggleEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedAction, setSelectedAction] = useState("none");
  const [followCount, setFollowCount] = useState(320);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const modal = useDisclosure();
  const drawer = useDisclosure();
  const actionSheet = useActionSheet<"share" | "archive" | "delete">();

  const pagination = usePagination(TOTAL_SUMMARIES, {
    initialPage: 1,
    pageSize: SUMMARY_PAGE_SIZE,
  });

  const refresh = useRefreshControl(async () => {
    await wait(800);
    setRefreshCount((current) => current + 1);
  });

  const currentSummaryItems = useMemo(() => {
    const items = Array.from(
      { length: TOTAL_SUMMARIES },
      (_, index) => `Summary item ${index + 1}`,
    );

    const start = (pagination.currentPage - 1) * SUMMARY_PAGE_SIZE;
    const end = start + SUMMARY_PAGE_SIZE;

    return items.slice(start, end);
  }, [pagination.currentPage]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleTabPress = (key: AppTabKey) => {
    if (key === "showcase") {
      return;
    }

    if (key === "home") {
      router.replace("/");
      return;
    }

    router.push("../projects");
  };

  return (
    <AppTabLayout
      activeTab="showcase"
      onMenuPress={drawer.open}
      onTabPress={handleTabPress}
      title="Component Showcase"
    >
      <>
      <RefreshableScroll
        contentContainerStyle={{
          gap: spacing.lg,
          paddingBottom: spacing.xxl,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xxl,
        }}
        onRefresh={refresh.onRefresh}
        refreshing={refresh.refreshing}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.primaryMuted,
              borderColor: colors.primary,
              gap: spacing.sm,
              padding: spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            Reusable Component Showcase
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Theme mode: {mode}. Pull down to test refresh. Refresh count: {refreshCount}.
          </Text>
          <View style={[styles.heroFooter, { gap: spacing.sm }]}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.sm,
              }}
            >
              Signed in as {user?.username ?? user?.email ?? "current user"}
            </Text>
            <View style={[styles.heroActions, { gap: spacing.sm }]}>
              <Button
                iconName="add-circle-outline"
                label="Create quiz"
                onPress={() => router.push("../quiz/create")}
                variant="primary"
              />
              <Button
                disabled={isSigningOut}
                label={isSigningOut ? "Signing out..." : "Sign out"}
                onPress={() => {
                  void handleSignOut();
                }}
                variant="default"
              />
            </View>
          </View>
        </View>

        <ShowcaseSection
          subtitle="Primary and secondary scales from constants are available globally."
          title="Theme Constants"
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: PRIMARY_TEXT_SIZES.md,
              fontWeight: typography.weights.semibold,
            }}
          >
            Primary md: {PRIMARY_TEXT_SIZES.md}px
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: SECONDARY_TEXT_SIZES.lg,
            }}
          >
            Secondary lg: {SECONDARY_TEXT_SIZES.lg}px
          </Text>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Primary, secondary, default, and disabled variants with Pressable states."
          title="Buttons / Pressables"
        >
          <View style={[styles.rowWrap, { gap: spacing.sm }]}>
            <Button iconName="rocket-outline" label="Primary" variant="primary" />
            <Button iconName="sparkles-outline" label="Secondary" variant="secondary" />
            <Button iconName="add-circle-outline" label="Default" variant="default" />
            <Button iconName="ban-outline" label="Disabled" variant="disabled" />
          </View>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Text input with icons, helper text, and secure toggle behavior."
          title="Text Input"
        >
          <AppTextInput
            helperText="Try typing to test controlled input."
            label="Search"
            leftIcon="search-outline"
            onChangeText={setSearchText}
            placeholder="Search recaps"
            rightIcon={secretTextVisible ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setSecretTextVisible((current) => !current)}
            value={searchText}
          />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Controlled boolean inputs with reusable APIs."
          title="Checkbox and Toggle"
        >
          <AppCheckbox
            checked={isChecked}
            label="I want reminder notifications"
            onValueChange={setIsChecked}
          />
          <AppToggle
            description="Switch between compact and detailed cards."
            label="Detailed mode"
            onValueChange={setIsToggleEnabled}
            value={isToggleEnabled}
          />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Expandable section pattern for FAQs and grouped details."
          title="Accordion"
        >
          <Accordion defaultExpanded title="How do I create reusable recap cards?">
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Build cards in the components folder, keep all token usage centralized,
              and pass data through typed props.
            </Text>
          </Accordion>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Bottom tab component for reuse in custom layouts and screens."
          title="Bottom Navigation Bar"
        >
          <BottomNavBar
            activeKey={activeTab}
            items={BOTTOM_TABS}
            onTabPress={setActiveTab}
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            Active tab: {activeTab}
          </Text>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="FlatList paging carousel built on core React Native APIs."
          title="Carousel"
        >
          <Carousel items={CAROUSEL_ITEMS} />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Date and time input built with package picker wrapper."
          title="Date / Time Picker"
        >
          <DateTimeField onValueChange={setSelectedDate} value={selectedDate} />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            Selected: {selectedDate.toLocaleString()}
          </Text>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Document picker wrapper with metadata preview."
          title="File Upload"
        >
          <FileUploadField onFileSelected={setUploadedFile} />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            Selected file: {uploadedFile ? uploadedFile.name : "none"}
          </Text>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Action sheet based on react-native-actions-sheet package wrapper."
          title="Action Sheet"
        >
          <Button
            iconName="ellipsis-horizontal-circle-outline"
            label="Open action sheet"
            onPress={actionSheet.openSheet}
            variant="secondary"
          />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            Last selected action: {selectedAction}
          </Text>
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Reusable side drawer built on core modal and animated panel patterns."
          title="Drawer"
        >
          <Button
            iconName="menu-outline"
            label="Open drawer"
            onPress={drawer.open}
            variant="default"
          />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Reusable modal wrapper with title, description, and actions."
          title="Modal"
        >
          <Button
            iconName="alert-circle-outline"
            label="Open modal"
            onPress={modal.open}
            variant="primary"
          />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Page controls with previous, next, and direct page jumps."
          title="Pagination"
        >
          <View style={{ gap: spacing.xs }}>
            {currentSummaryItems.map((item) => (
              <View
                key={item}
                style={[
                  styles.listRow,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <Pagination
            currentPage={pagination.currentPage}
            onPageChange={pagination.goToPage}
            totalPages={pagination.totalPages}
          />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="Placeholder loading states with pulse animation."
          title="Skeleton"
        >
          <SkeletonCard />
          <SkeletonBlock height={14} width="70%" />
        </ShowcaseSection>

        <ShowcaseSection
          subtitle="A profile card component with stats and action button."
          title="Profile"
        >
          <ProfileCard
            followers={followCount}
            following={88}
            onFollowPress={() => setFollowCount((current) => current + 1)}
            projects={124}
            username="alex_morgan"
          />
        </ShowcaseSection>
      </RefreshableScroll>

      <AppActionSheet
        isOpen={actionSheet.isOpen}
        items={ACTION_ITEMS}
        onClose={actionSheet.closeSheet}
        onSelect={(value) => {
          actionSheet.selectValue(value);
          setSelectedAction(value);
        }}
        title="Project actions"
      />

      <DrawerPanel onClose={drawer.close} title="Quick navigation" visible={drawer.isOpen}>
        <View style={{ gap: spacing.sm }}>
          {BOTTOM_TABS.map((item) => {
            const isActive = item.key === activeTab;

            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setActiveTab(item.key);
                  drawer.close();
                }}
                style={({ pressed }) => [
                  styles.drawerItem,
                  {
                    backgroundColor: isActive ? colors.primaryMuted : colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.78 : 1,
                    padding: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.secondary.md,
                    fontWeight: typography.weights.medium,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerPanel>

      <AppModal
        actions={[
          {
            label: "Approve",
            onPress: modal.close,
            variant: "primary",
            iconName: "checkmark-outline",
          },
          {
            label: "Cancel",
            onPress: modal.close,
            variant: "default",
            iconName: "close-outline",
          },
        ]}
        description="This demonstrates reusable modal actions and close behavior."
        onClose={modal.close}
        title="Modal Example"
        visible={modal.isOpen}
      >
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Reusable modals let you keep overlay behavior and action layouts consistent.
        </Text>
      </AppModal>
      </>
    </AppTabLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    borderWidth: 1,
  },
  heroFooter: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  listRow: {
    borderRadius: 10,
    borderWidth: 1,
  },
  drawerItem: {
    borderRadius: 10,
    borderWidth: 1,
  },
});
