import { usePathname } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { StyleSheet } from "react-native";
import { AppTabLayout, type AppTabKey } from "../../../screens/app-tab-layout";

const TAB_TITLES: Record<AppTabKey, string> = {
  home: "Recapify",
  create: "Create",
  search: "Search",
};

const getActiveTab = (pathname: string): AppTabKey => {
  if (pathname === "/create" || pathname.startsWith("/create/")) {
    return "create";
  }

  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return "search";
  }

  return "home";
};

export default function TabsLayout() {
  const pathname = usePathname();

  const activeTab = getActiveTab(pathname);

  return (
    <Tabs>
      <TabList style={styles.hiddenTabList}>
        <TabTrigger href="/" name="home" />
        <TabTrigger href="/create" name="create" />
        <TabTrigger href="/search" name="search" />
      </TabList>

      <AppTabLayout activeTab={activeTab} title={TAB_TITLES[activeTab]}>
        <TabSlot />
      </AppTabLayout>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  hiddenTabList: {
    display: "none",
  },
});
