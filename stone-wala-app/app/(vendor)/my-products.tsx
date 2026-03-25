import { API_CONFIG } from "@/constants/api";
import { getMyProducts } from "@/services/vendorService";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

interface Product {
  id: number;
  name: string;
  status: "approved" | "pending" | "rejected";
  image_url: string | null;
  created_at: string;
  category_name: string;
}

export default function MyProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
const params = useLocalSearchParams<{ refresh?: string }>();

// ── Initial Load ─────────────────────────────────────
useEffect(() => {
   fetchProducts();
}, []);

// ── Refresh on Change ────────────────────────────────
useFocusEffect(
  useCallback(() => {
    if (params.refresh === "true") {
       fetchProducts();
    }
  }, [params.refresh])
);
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchProducts();
  setRefreshing(false);
};

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyProducts();
      setProducts(response.data || []);
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to load products.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Status Config ───────────────────────────────────
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-emerald-500",
          text: "text-white",
          dot: "bg-emerald-300",
          label: "Live",
        };
      case "pending":
        return {
          bg: "bg-amber-500",
          text: "text-stone-950",
          dot: "bg-amber-300",
          label: "Pending",
        };
      case "rejected":
        return {
          bg: "bg-red-500",
          text: "text-white",
          dot: "bg-red-300",
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-stone-200",
          text: "text-stone-500",
          dot: "bg-stone-400",
          label: status,
        };
    }
  };

  // ── Stat counts ─────────────────────────────────────
  const liveCount = products.filter((p) => p.status === "approved").length;
  const pendingCount = products.filter((p) => p.status === "pending").length;
  const rejectedCount = products.filter((p) => p.status === "rejected").length;

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-amber-500/10 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
        <Text className="text-stone-500 text-sm font-medium tracking-wide">
          Loading products…
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
          onPress={fetchProducts}
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
      {/* ── Header ──────────────────────────────────────── */}
      <View className="bg-stone-950 px-6 pt-14 pb-10">

        {/* Back Button */}
       <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 mb-8 gap-1.5"
        >
          <Text className="text-amber-600 text-sm">←</Text>
          <Text className="text-amber-600 text-sm font-semibold">Back</Text>
        </Pressable>

        {/* Title Row */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold tracking-tight">
              My Products
            </Text>
            <Text className="text-stone-400 text-sm font-medium mt-0.5">
              {products.length} product{products.length !== 1 ? "s" : ""} total
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(vendor)/upload-product")}
            className="flex-row items-center gap-1.5 bg-amber-500 active:bg-amber-400 px-4 py-2.5 rounded-full"
          >
            <Text className="text-stone-950 text-sm font-black">+</Text>
            <Text className="text-stone-950 text-xs font-bold tracking-wide">
              Add New
            </Text>
          </Pressable>
        </View>

        {/* ── Stats Strip ── */}
        {products.length > 0 && (
          <View className="flex-row gap-3 mt-6">
            {/* Live */}
            <View className="flex-1 bg-stone-900 rounded-2xl px-3 py-3 items-center gap-1">
              <Text className="text-emerald-400 text-xl font-black">
                {liveCount}
              </Text>
              <Text className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                Live
              </Text>
            </View>
            {/* Pending */}
            <View className="flex-1 bg-stone-900 rounded-2xl px-3 py-3 items-center gap-1">
              <Text className="text-amber-400 text-xl font-black">
                {pendingCount}
              </Text>
              <Text className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                Pending
              </Text>
            </View>
            {/* Rejected */}
            <View className="flex-1 bg-stone-900 rounded-2xl px-3 py-3 items-center gap-1">
              <Text className="text-red-400 text-xl font-black">
                {rejectedCount}
              </Text>
              <Text className="text-stone-500 text-xs font-semibold uppercase tracking-wider">
                Rejected
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="px-4 pt-5 pb-8 gap-3">

        {/* ── Empty State ─────────────────────────────── */}
        {products.length === 0 ? (
          <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm px-6 py-14 items-center gap-4">
            <View className="w-20 h-20 rounded-3xl bg-stone-100 items-center justify-center mb-1">
              <Text className="text-4xl">📦</Text>
            </View>
            <View className="items-center gap-1.5">
              <Text className="text-stone-900 font-bold text-xl">
                No Products Yet
              </Text>
              <Text className="text-stone-400 text-sm text-center leading-relaxed">
                Upload your first product{"\n"}to start selling on the marketplace
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(vendor)/upload-product")}
              className="bg-amber-500 active:bg-amber-400 px-8 py-3.5 rounded-2xl mt-1"
            >
              <Text className="text-stone-950 font-black text-sm tracking-wide">
                Upload Product
              </Text>
            </Pressable>
          </View>
        ) : (
          products.map((item) => {
            const status = getStatusStyle(item.status);
            return (
            <Pressable
  key={item.id}
  onPress={() =>
    router.push({
      pathname: "/(vendor)/product-detail",
      params: { id: String(item.id) },
    })
  }
  className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden active:opacity-80"
>
  <View className="flex-row p-4 gap-3.5 items-center">

    {/* Thumbnail */}
    {item.image_url ? (
      <Image
        source={{
          uri: `${API_CONFIG.BASE_URL.replace("/api", "")}${item.image_url}`,
        }}
        className="w-[72px] h-[72px] rounded-2xl"
        resizeMode="cover"
      />
    ) : (
      <View className="w-[72px] h-[72px] rounded-2xl bg-stone-100 items-center justify-center">
        <Text className="text-2xl">📷</Text>
      </View>
    )}

    {/* Info */}
    <View className="flex-1 gap-1.5">
      <Text
        className="text-stone-900 font-bold text-[15px] leading-snug"
        numberOfLines={1}
      >
        {item.name}
      </Text>

      {/* Category pill */}
      <View className="self-start bg-stone-100 px-2.5 py-1 rounded-full">
        <Text className="text-stone-500 text-xs font-semibold">
          {item.category_name}
        </Text>
      </View>

      <Text className="text-stone-400 text-xs font-medium">
        {new Date(item.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Text>
    </View>

    {/* Status Badge */}
    <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
      <Text className={`text-xs font-bold tracking-wide ${status.text}`}>
        {status.label}
      </Text>
    </View>
  </View>

  {/* Rejection Banner */}
  {item.status === "rejected" && (
    <View className="bg-red-50 border-t border-red-100 px-4 py-3 flex-row items-center gap-2.5">
      <View className="w-5 h-5 rounded-full bg-red-100 items-center justify-center">
        <Text className="text-red-500 text-xs font-black">!</Text>
      </View>
      <Text className="text-red-500 text-xs font-semibold flex-1">
        Review your product details and re-upload
      </Text>
    </View>
  )}
</Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}