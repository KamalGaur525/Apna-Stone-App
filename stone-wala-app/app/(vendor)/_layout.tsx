import { useAuthStore } from "@/store/authStore";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function VendorLayout() {
  const { isLoggedIn, isHydrated, user } = useAuthStore();

  // Hydration hone tak wait karo
  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }
  

  // Token nahi hai ya role vendor nahi — auth pe bhejo
  if (!isLoggedIn || user?.role !== "vendor") {
    return <Redirect href="/(auth)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}