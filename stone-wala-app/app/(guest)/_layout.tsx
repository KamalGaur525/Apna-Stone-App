import { useAuthStore } from "@/store/authStore";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function GuestLayout() {
  const { isLoggedIn, isHydrated, user } = useAuthStore();

  // Hydration hone tak wait karo
  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  // Token nahi hai ya role guest nahi — auth pe bhejo
  if (!isLoggedIn || user?.role !== "guest") {
    return <Redirect href="/(auth)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}