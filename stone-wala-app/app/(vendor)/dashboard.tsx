import { getVendorDashboard } from "@/services/vendorService";
import { useAuthStore } from "@/store/authStore";
import { useVendorStore } from "@/store/vendorStore";
import { Feather, Ionicons } from "@expo/vector-icons";
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
        expiryDate: null,
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
  const totalViews = stats.approved * 1;
  const totalLeads = stats.approved * 1;
  const totalOrders = Math.floor(stats.approved * 0.8);

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
      <View className="bg-stone-900 px-6 pt-16 pb-24">
        <View className="flex-row justify-between items-center mb-5">
          <View className="flex-row items-center gap-x-2">
            <View className="h-2 w-2 rounded-full bg-amber-400" />
            <Text className="text-stone-400 text-xs font-semibold uppercase tracking-[3px]">
              Dashboard
            </Text>
          </View>

          <View className="flex-row items-center gap-x-3">
            <Pressable
               onPress={handleLogout}
               
              className="flex-row items-center self-center bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2  gap-1.5"
            >
              <Text className="text-amber-600 text-xs font-semibold">Logout</Text>
            </Pressable>
            
          

            <Pressable onPress={() => router.push("/(vendor)/firm-profile")} className="h-10 w-10 rounded-full bg-amber-500 items-center justify-center">
              <Text className="text-white font-extrabold text-sm">{initials}</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-stone-400 text-sm mb-1">Good morning,</Text>
      <View className="flex-row items-center gap-2">
  <Text className="text-white text-[28px] font-extrabold">
    {vendorName}
  </Text>
  <Ionicons name="person-circle-outline" size={28} color="#f59e0b" />
</View>

        <View className="flex-row items-center mt-4 gap-x-2">
          <View
            className={`h-2 w-2 rounded-full ${
              subscription.isActive ? "bg-emerald-400" : "bg-red-400"
            }`}
          />
          <Text className="text-stone-400 text-xs">
            {subscription.isActive
              ? "Store Active · Subscription Valid"
              : "Subscription Inactive"}
          </Text>
        </View>
      </View>

      {/* ── PRODUCT STATS CARD ── */}
      <View className="px-5 -mt-14 mb-6">
        <View className="bg-white rounded-3xl overflow-hidden shadow-lg border border-stone-100">
          <View className="h-1 w-full bg-amber-400" />
          <View className="p-6">

            <Text className="text-stone-400 text-xs uppercase font-semibold mb-4 tracking-widest">
              Product Overview
            </Text>

            <View className="flex-row justify-between">
              {/* Total */}
              <View className="items-center gap-1">
                <Text className="text-3xl font-extrabold text-stone-900">
                  {stats.total}
                </Text>
                <Text className="text-stone-400 text-xs font-semibold">Total</Text>
              </View>

              <View className="w-px bg-stone-100" />

              {/* Live */}
              <View className="items-center gap-1">
                <Text className="text-3xl font-extrabold text-emerald-500">
                  {stats.approved}
                </Text>
                <Text className="text-stone-400 text-xs font-semibold">Live</Text>
              </View>

              <View className="w-px bg-stone-100" />

              {/* Pending */}
              <View className="items-center gap-1">
                <Text className="text-3xl font-extrabold text-amber-500">
                  {stats.pending}
                </Text>
                <Text className="text-stone-400 text-xs font-semibold">Pending</Text>
              </View>

              <View className="w-px bg-stone-100" />

              {/* Rejected */}
              <View className="items-center gap-1">
                <Text className="text-3xl font-extrabold text-red-400">
                  {stats.rejected}
                </Text>
                <Text className="text-stone-400 text-xs font-semibold">Rejected</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── ANALYTICS ── */}
      <View className="mb-7">
        <View className="px-5 mb-3">
          <Text className="text-base font-bold text-stone-800">At a Glance</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-5"
        >
          <View className="bg-white flex-row justify-between mr-3 p-5 rounded-3xl w-44 border border-stone-100">
            <View className="flex-col justify-between items-center">
              <Text className="text-2xl font-black text-stone-900">{stats.total}</Text>
              <Text className="text-[10px] text-stone-400 uppercase">Products</Text>
            </View>
            <View className="h-12 w-12 bg-stone-50 rounded-2xl items-center justify-center border border-stone-100">
              <Ionicons name="cube" size={22} color="#57534e" />
            </View>
          </View>

          <View className="bg-white flex-row justify-between mr-3 p-5 rounded-3xl w-44 border border-stone-100">
            <View className="flex-col justify-between items-center">
              <Text className="text-2xl font-black text-stone-900">{totalViews}</Text>
              <Text className="text-[10px] text-stone-400 uppercase">Views</Text>
            </View>
            <View className="h-12 w-12 bg-stone-50 rounded-2xl items-center justify-center border border-stone-100">
              <Ionicons name="eye" size={20} color="#3b82f6" />
            </View>
          </View>

          <View className="bg-white flex-row justify-between mr-3 p-5 rounded-3xl w-44 border border-stone-100">
            <View className="flex-col justify-between items-center">
              <Text className="text-2xl font-black text-stone-900">{totalLeads}</Text>
              <Text className="text-[10px] text-stone-400 uppercase">Leads</Text>
            </View>
            <View className="h-12 w-12 bg-stone-50 rounded-2xl items-center justify-center border border-stone-100">
              <Ionicons name="chatbubble-ellipses" size={20} color="#d97706" />
            </View>
          </View>

          <View className="bg-white flex-row justify-between p-5 rounded-3xl w-44 border border-stone-100">
            <View className="flex-col justify-between items-center">
              <Text className="text-2xl font-black text-stone-900">{totalOrders}</Text>
              <Text className="text-[10px] text-stone-400 uppercase">Orders</Text>
            </View>
            <View className="h-12 w-12 bg-stone-50 rounded-2xl items-center justify-center border border-stone-100">
              <Feather name="shopping-bag" size={20} color="#059669" />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── QUICK ACTIONS ── */}
      <View className="px-5 mb-7">
        <Text className="text-base font-bold text-stone-800 tracking-tight mb-4">
          Quick Actions
        </Text>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          <Pressable
            onPress={() => router.push("/(vendor)/upload-product")}
            className="bg-amber-500 w-[48%] p-5 rounded-3xl active:opacity-75 shadow-md shadow-amber-400/30"
          >
            <View className="h-10 w-10 bg-amber-400/40 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="add" size={22} color="#fff" />
            </View>
            <Text className="font-bold text-white text-base leading-tight">Add Product</Text>
            <Text className="text-xs font-medium text-amber-100 mt-1">Upload new item</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(vendor)/firm-profile")}
            className="bg-white w-[48%] p-5 rounded-3xl shadow-sm border border-stone-100"
          >
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="person-outline" size={20} color="#44403c" />
            </View>
            <Text className="font-bold text-stone-900 text-base leading-tight">Profile</Text>
            <Text className="text-xs font-medium text-stone-400 mt-1">Edit details</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(vendor)/subscription")}  className="bg-white w-[48%] p-5 rounded-3xl shadow-sm shadow-stone-300/30 border border-stone-100 active:opacity-75">
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Feather name="bar-chart-2" size={20} color="#44403c" />
            </View>
            <Text className="font-bold text-stone-900 text-base leading-tight">Analytics</Text>
            <Text className="text-xs font-medium text-stone-400 mt-1">Track performance</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(vendor)/settings")}
          className="bg-white w-[48%] p-5 rounded-3xl shadow-sm shadow-stone-300/30 border border-stone-100 active:opacity-75">
            <View className="h-10 w-10 bg-stone-100 rounded-2xl items-center justify-center mb-4">
              <Feather name="settings" size={20} color="#44403c" />
            </View>
            <Text className="font-bold text-stone-900 text-base leading-tight">Settings</Text>
            <Text className="text-xs font-medium text-stone-400 mt-1">Manage account</Text>
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
        </View>
      </View>

      {/* ── PERFORMANCE GRAPH PLACEHOLDER ── */}
      <View className="px-5 mb-7">
        <Text className="text-base font-bold text-stone-800 tracking-tight mb-4">
          Performance
        </Text>
        <View className="bg-white p-5 rounded-3xl shadow-sm shadow-stone-300/30 border border-stone-100">
          <View className="flex-row items-end justify-between px-3 mb-3 h-20">
            {["h-8", "h-12", "h-6", "h-16", "h-10", "h-14", "h-20"].map((h, i) => (
              <View key={i} className={`w-6 ${h} bg-stone-100 rounded-t-lg`} />
            ))}
          </View>
          <View className="flex-row items-end justify-between px-3">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <Text key={i} className="w-6 text-center text-stone-300 text-[10px] font-bold">
                {d}
              </Text>
            ))}
          </View>
          <View className="flex-row items-center justify-center mt-4 gap-x-2">
            <Feather name="pie-chart" size={14} color="#a8a29e" />
            <Text className="text-stone-400 font-semibold text-xs tracking-wide">
              Chart Coming Soon
            </Text>
          </View>
        </View>
      </View>

      {/* ── RECENT LEADS ── */}
      <View className="px-5 pb-14">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-base font-bold text-stone-800 tracking-tight">
            Recent Leads
          </Text>
          <Pressable className="active:opacity-60">
            <Text className="text-amber-500 text-sm font-bold">View All →</Text>
          </Pressable>
        </View>

        <View className="bg-white rounded-3xl overflow-hidden shadow-sm shadow-stone-300/30 border border-stone-100">
          <Pressable className="flex-row justify-between items-center px-5 py-4 active:bg-stone-50">
            <View className="h-11 w-11 bg-amber-50 rounded-2xl items-center justify-center mr-4">
              <Text className="text-amber-600 font-extrabold text-sm">MB</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-stone-900 text-sm leading-tight">Marble Buyer</Text>
              <Text className="text-xs text-stone-400 font-medium mt-0.5">Asked for price</Text>
            </View>
            <View className="bg-stone-100 px-2.5 py-1 rounded-xl">
              <Text className="text-xs font-bold text-stone-500">2h</Text>
            </View>
          </Pressable>

          <View className="h-px bg-stone-100 mx-5" />

          <Pressable className="flex-row justify-between items-center px-5 py-4 active:bg-stone-50">
            <View className="h-11 w-11 bg-emerald-50 rounded-2xl items-center justify-center mr-4">
              <Text className="text-emerald-600 font-extrabold text-sm">GI</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-stone-900 text-sm leading-tight">Granite Inquiry</Text>
              <Text className="text-xs text-stone-400 font-medium mt-0.5">Bulk order</Text>
            </View>
            <View className="bg-stone-100 px-2.5 py-1 rounded-xl">
              <Text className="text-xs font-bold text-stone-500">5h</Text>
            </View>
          </Pressable>

          <View className="h-px bg-stone-100 mx-5" />

          <Pressable className="flex-row justify-between items-center px-5 py-4 active:bg-stone-50">
            <View className="h-11 w-11 bg-blue-50 rounded-2xl items-center justify-center mr-4">
              <Text className="text-blue-600 font-extrabold text-sm">TS</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-stone-900 text-sm leading-tight">Tile Supplier</Text>
              <Text className="text-xs text-stone-400 font-medium mt-0.5">Requested callback</Text>
            </View>
            <View className="bg-stone-100 px-2.5 py-1 rounded-xl">
              <Text className="text-xs font-bold text-stone-500">1d</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}