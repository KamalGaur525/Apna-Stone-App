import { getVendorDashboard } from "@/services/vendorService";
import { useAuthStore } from "@/store/authStore";
import { useVendorStore } from "@/store/vendorStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from "react-native";

export default function VendorDashboard() {
  const { setProfile, setSubscription, subscription, profile } =
    useVendorStore();
    const { logout } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Product Stats from Backend ───────────────────────
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

const params = useLocalSearchParams<{ refresh?: string }>();

// ── Initial Load ─────────────────────────────────────
useEffect(() => {
  fetchDashboard();
}, []);

// ── Refresh on Change ────────────────────────────────
useFocusEffect(
  useCallback(() => {
    if (params.refresh === "true") {
      fetchDashboard();
    }
  }, [params.refresh])
);
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchDashboard();
  setRefreshing(false);
};

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVendorDashboard();
      const data = response.data;
        

      setProfile({
        id: "",
        firmName: data.firm_name,
        gstNumber: "",
        phone: "",
        city: "",
      });

      setSubscription({
        isActive: data.subscription.isActive,
        planName: data.subscription.planName,
        expiryDate: data.subscription.expiryDate ?? null,
      });

      // ✅ Real product stats from backend
      setStats({
        total: data.products.total || 0,
        approved: data.products.approved || 0,
        pending: data.products.pending || 0,
        rejected: data.products.rejected || 0,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error || "Failed to load dashboard.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
    const handleLogout = () => {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: async () => {
              await logout();
              router.replace("/(auth)");
            },
          },
        ]
      );
    };

  // ── Derived Data ─────────────────────────────────────
 

  const initials =
    profile?.firmName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SV";

  const vendorName = profile?.firmName || "Stone Vendor";

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-amber-500/10 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
        <Text className="text-stone-500 text-sm font-medium tracking-wide">
          Loading dashboard…
        </Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center px-8">
        <View className="w-14 h-14 rounded-2xl bg-red-500/10 items-center justify-center mb-5">
          <Text className="text-2xl">⚠</Text>
        </View>
        <Text className="text-white font-bold text-xl mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-stone-500 text-sm text-center mb-8 leading-relaxed">
          {error}
        </Text>
        <Pressable
          onPress={fetchDashboard}
          className="bg-amber-500 active:bg-amber-400 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-stone-950 font-bold text-sm tracking-wide">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-stone-100"
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#f59e0b"]}
      tintColor="#f59e0b"
    />
  }
    >
      {/* ── HEADER ── */}

<LinearGradient
  colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  className="px-6 pt-16 pb-24"
>
  {/* ── Top Bar ── */}
  <View className="flex-row justify-between items-center mb-5">
    
    <View className="flex-row items-center gap-x-2">
      <View className="h-2 w-2 rounded-full bg-amber-400" />
      <Text className="text-amber-200 text-xs font-semibold uppercase tracking-[3px]">
        Dashboard
      </Text>
    </View>

    <View className="flex-row items-center gap-x-3">
      <Pressable
        onPress={handleLogout}
        className="flex-row items-center self-center  bg-white/10 border border-white/20 active:bg-white/20 rounded-full px-4 py-2 gap-1.5"
      >
        <Text className="text-white text-xs font-semibold tracking-wide">
          Logout
        </Text>
      </Pressable>
       

      <Pressable
        onPress={() => router.push("/(vendor)/firm-profile")}
        className="h-10 w-10 rounded-full bg-sky-600 border border-sky-300/35 items-center justify-center active:opacity-70"
      >
        <Text className="text-sky-100 font-extrabold text-sm">
          {initials}
        </Text>
      </Pressable>
    </View>
  </View>

  {/* Vendor Name */}
  <View className="flex-row items-center gap-2">
    <Text className="text-white text-[28px] font-extrabold tracking-tight drop-shadow-md">
      {vendorName}
    </Text>
    <Ionicons name="person-circle-outline" size={28} color="#7dd3fc" />
  </View>

  {/* Subscription */}
  <View className="flex-row items-center mt-4 gap-x-2">
    <View
      className={`h-2 w-2 rounded-full ${
        subscription.isActive ? "bg-emerald-400" : "bg-red-400"
      }`}
    />
    <Text className="text-sky-50 text-xs">
      {subscription.isActive
        ? "Store Active · Subscription Valid"
        : "Subscription Inactive"}
    </Text>
  </View>
</LinearGradient>

      {/* ── PRODUCT STATS CARD ── */}
     <View className="px-5 -mt-16 mb-6">
  <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">

    {/* Top accent bar — matches header theme, replaces amber */}
    <View className="h-[3px] w-full bg-[#6bb6d6]" />

    <View className="p-6">

      <Text className="text-stone-400 text-xs uppercase font-semibold mb-4 tracking-widest">
        Product Overview
      </Text>

      <View className="flex-row justify-between items-center">

        {/* Total */}
        <View className="flex-1 items-center gap-1">
          <Text className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {stats.total}
          </Text>
          <Text className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
            Total
          </Text>
        </View>

        <View className="w-px h-10 bg-stone-100" />

        {/* Live */}
        <View className="flex-1 items-center gap-1">
          <Text className="text-3xl font-extrabold text-emerald-500 tracking-tight">
            {stats.approved}
          </Text>
          <Text className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
            Live
          </Text>
        </View>

        <View className="w-px h-10 bg-stone-100" />

        {/* Pending — indigo replaces amber */}
        <View className="flex-1 items-center gap-1">
          <Text className="text-3xl font-extrabold text-amber-400 tracking-tight">
            {stats.pending}
          </Text>
          <Text className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
            Pending
          </Text>
        </View>

        <View className="w-px h-10 bg-stone-100" />

        {/* Rejected */}
        <View className="flex-1 items-center gap-1">
          <Text className="text-3xl font-extrabold text-red-400 tracking-tight">
            {stats.rejected}
          </Text>
          <Text className="text-stone-400 text-xs font-semibold uppercase tracking-widest">
            Rejected
          </Text>
        </View>

      </View>
    </View>
  </View>
</View>

     

      {/* ── QUICK ACTIONS ── */}
      <View className="px-5 mb-7">
      

 <View className="px-1 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-[#3f8fb0]" />
            <Text className="text-stone-950 text-2xl font-bold tracking-tight ">
              Quick Actions
            </Text>
          </View>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          <Pressable
            onPress={() => router.push("/(vendor)/upload-product")}
            className="bg-[#3f8fb0] border border-sky-300/35 w-[48%] p-5 rounded-3xl active:opacity-75 shadow-md shadow-sky-300/10"
          >
            <View className="h-10 w-10  bg-white/[0.19] rounded-2xl items-center justify-center mb-4">
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text className="font-bold text-white text-base leading-tight">Add Product</Text>
            <Text className="text-xs font-medium text-sky-50 mt-1">Upload new item</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(vendor)/my-products")}
            className="bg-white w-[48%] p-5 rounded-3xl shadow-sm border border-stone-100"
          >
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="cube-outline" size={20} color="#444" />
            </View>
            <Text className="font-bold text-stone-900 text-base">My Products</Text>
            <Text className="text-xs text-stone-400 mt-1">Manage items</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(vendor)/firm-profile")}
            className="bg-white w-[48%] p-5 rounded-3xl shadow-sm border border-stone-100"
          >
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="person-outline" size={20} color="#44403c" />
            </View>
            <Text className="font-bold text-stone-900 text-base leading-tight">My Profile</Text>
            <Text className="text-xs font-medium text-stone-400 mt-1">Edit details</Text>
          </Pressable>

          <Pressable  onPress={() => router.push("/(vendor)/subscription")}  className="bg-white w-[48%] p-5 rounded-3xl shadow-sm shadow-stone-300/30 border border-stone-100 active:opacity-75">
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Feather name="bar-chart-2" size={20} color="#44403c" />
            </View>
            <Text className="font-bold text-stone-900 text-base leading-tight">My Subscription</Text>
            <Text className="text-xs font-medium text-stone-400 mt-1">Track your plan</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(vendor)/settings")}
          className="bg-white w-[48%] p-5 rounded-3xl shadow-sm shadow-stone-300/30 border border-stone-100 active:opacity-75">
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Feather name="settings" size={20} color="#44403c" />
            </View>
            <Text className="font-bold text-stone-900 text-base leading-tight">Settings</Text>
            <Text className="text-xs font-medium text-stone-400 mt-1">Manage account</Text>
          </Pressable>

          
          {/* <Pressable
  onPress={() => router.push("/(vendor)/room-visualizer")}
  className="bg-white w-[48%] p-5 rounded-3xl shadow-sm border border-stone-100"
>
  <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
    <Ionicons name="color-wand-outline" size={20} color="#44403c" />
  </View>
  <Text className="font-bold text-stone-900 text-base">AI Visualizer</Text>
  <Text className="text-xs text-stone-400 mt-1">Preview marble floor</Text>
</Pressable> */}
        </View>
      </View>
 
    </ScrollView>
  );
}