import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";

type RouterWithCanGoBack = ReturnType<typeof useRouter> & {
  canGoBack?: () => boolean;
};

export function useSafeNavigation() {
  const router = useRouter();

  const goBack = useCallback(
    (fallbackPath: Href = "/") => {
      const routerWithCanGoBack = router as RouterWithCanGoBack;

      if (
        typeof routerWithCanGoBack.canGoBack === "function"
        && routerWithCanGoBack.canGoBack()
      ) {
        router.back();
        return;
      }

      router.replace(fallbackPath);
    },
    [router],
  );

  return {
    goBack,
  };
}
