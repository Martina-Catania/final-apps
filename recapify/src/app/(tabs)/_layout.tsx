import { Slot, usePathname, useRouter } from "expo-router";
import { AppTabLayout, type AppTabKey } from "../../screens/app-tab-layout";

const TAB_TITLES: Record<AppTabKey, string> = {
  home: "Recapify",
  projects: "Project Showcase",
  showcase: "Component Showcase",
};

const getActiveTab = (pathname: string): AppTabKey => {
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return "projects";
  }

  if (pathname === "/showcase" || pathname.startsWith("/showcase/")) {
    return "showcase";
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

    if (key === "projects") {
      router.push("/projects");
      return;
    }

    router.push("/showcase");
  };

  return (
    <AppTabLayout activeTab={activeTab} onTabPress={handleTabPress} title={TAB_TITLES[activeTab]}>
      <Slot />
    </AppTabLayout>
  );
}
