import { Slot, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "@/store/authStore";

import "../global.css";

function AppShell() {
  const insets = useSafeAreaInsets();
  const { hydrate, isHydrated, isLoggedIn, user } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

 useEffect(() => {
  if (!isHydrated) return;

  if (!isLoggedIn) {
    router.replace("/(auth)");
    return;
  }

  // Admin — direct redirect, no subscription check
  if (user?.role === "admin") {
    router.replace("/(auth)");
    return;
  }

  // Vendor/Guest — check active subscription first
  const checkPlan = async () => {
    try {
      const { getMyPlan } = await import("@/services/subscriptionService");
      const res = await getMyPlan();

      if (!res.hasActivePlan) {
        router.replace("/(auth)/subscription");
        return;
      }

      if (user?.role === "vendor") {
        router.replace("/(vendor)/dashboard");
      } else if (user?.role === "guest") {
        router.replace("/(guest)/home");
      }
    } catch {
      // API fail — still redirect to dashboard, don't block user
      if (user?.role === "vendor") {
        router.replace("/(vendor)/dashboard");
      } else if (user?.role === "guest") {
        router.replace("/(guest)/home");
      }
    }
  };

  checkPlan();
}, [isHydrated, isLoggedIn, user]);

  if (!isHydrated) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Slot />
      <StatusBar style="dark" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}