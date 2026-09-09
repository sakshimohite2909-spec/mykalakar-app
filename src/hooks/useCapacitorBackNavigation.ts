import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export function useCapacitorBackNavigation() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isSubscribed = true;

    const setupListener = async () => {
      const listener = await App.addListener("backButton", ({ canGoBack }) => {
        if (!isSubscribed) return;

        const currentPath = window.location.pathname;
        const isRoot = currentPath === "/" || currentPath === "";

        if (canGoBack && !isRoot && window.history.length > 1) {
          window.history.back();
        } else {
          // Exit app if on home/root screen or no history
          void App.exitApp();
        }
      });

      return listener;
    };

    const listenerPromise = setupListener();

    return () => {
      isSubscribed = false;
      void listenerPromise.then((listener) => listener.remove());
    };
  }, []);
}
