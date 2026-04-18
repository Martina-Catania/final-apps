import { Slot, usePathname, useRouter } from "expo-router";
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
  const router = useRouter();

  const activeTab = getActiveTab(pathname);

  const handleTabPress = (key: AppTabKey) => {
    if (key === activeTab) {
      return;
    }

    if (key === "home") {
      router.replace("./");
      return;
    }

    if (key === "create") {
      router.push("/create");
      return;
    }

    router.push("/search");
  };

  return (
    <AppTabLayout activeTab={activeTab} onTabPress={handleTabPress} title={TAB_TITLES[activeTab]}>
      <Slot />
    </AppTabLayout>
  );
}
