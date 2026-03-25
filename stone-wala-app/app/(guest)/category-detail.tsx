import { API_CONFIG } from "@/constants/api";
import { getCategoryProducts } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
  image_url: string | null;
  sub_category: string | null;
  third_category: string | null;
  description: string | null;
  vendor_name: string;
  vendor_location: string | null;
  category_name: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Palette ──────────────────────────────────────────
const PALETTE = [
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#ffedd5", text: "#9a3412" },
  { bg: "#f0fdf4", text: "#14532d" },
  { bg: "#fdf2f8", text: "#86198f" },
  { bg: "#eff6ff", text: "#1d4ed8" },
  { bg: "#fefce8", text: "#713f12" },
];

export default function CategoryDetail() {
  const params = useLocalSearchParams<{ id: string; name: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const { setSelectedFirm } = useGuestStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const color = PALETTE[Number(id) % PALETTE.length];

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await getCategoryProducts(Number(id), pageNum);
      const newProducts = res.data || [];

      if (pageNum === 1) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      setPagination(res.pagination);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load products.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (pagination && page < pagination.totalPages && !loadingMore) {
      fetchProducts(page + 1);
    }
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center gap-3">
        <View className="w-16 h-16 rounded-2xl bg-amber-50 items-center justify-center mb-1">
          <ActivityIndicator size="large" color="#d97706" />
        </View>
        <Text className="text-stone-800 font-semibold text-base">
          Loading products
        </Text>
        <Text className="text-stone-400 text-sm">Fetching the latest listings…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-10">
        <View className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 items-center justify-center mb-5">
          <Ionicons name="alert-circle-outline" size={30} color="#ef4444" />
        </View>
        <Text className="text-stone-900 font-bold text-xl tracking-tight mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-stone-400 text-sm text-center leading-6 mb-8">
          {error}
        </Text>
        <Pressable
          onPress={() => fetchProducts(1)}
          className="bg-amber-500 active:bg-amber-600 px-10 py-3.5 rounded-2xl"
        >
          <Text className="text-white font-bold text-sm tracking-wide">
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
          colors={["#d97706"]}
          tintColor="#d97706"
        />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
        if (isBottom) loadMore();
      }}
      scrollEventThrottle={400}
    >
      {/* ── HEADER ── */}
      <View className="bg-stone-950 px-5 pt-6 pb-4">
  {/* Top row — Identity left, Back right */}
  <View className="flex-row items-start justify-between">
    {/* Category Identity */}
    <View className="flex-row items-center gap-4 flex-1">
      <View
        className="w-16 h-16 rounded-2xl items-center justify-center"
        style={{ backgroundColor: color.bg }}
      >
        <Text
          className="text-2xl font-black tracking-tighter"
          style={{ color: color.text }}
        >
          {name?.slice(0, 2).toUpperCase()}
        </Text>
      </View>

      <View className="flex-1 gap-1">
        <Text
          className="text-white text-2xl font-black tracking-tight"
          numberOfLines={1}
        >
          {name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <Text className="text-stone-500 text-xs font-medium">
            {pagination?.total ?? 0} products available
          </Text>
        </View>
      </View>
    </View>

    {/* Back button — far right */}
     <Pressable
    onPress={() => router.back()}
    className="flex-row items-center bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 gap-1.5"
  >
    <Text className="text-amber-600 text-sm">←</Text>
    <Text className="text-amber-600 text-sm font-semibold">Back</Text>
  </Pressable>
  </View>
</View>
      {/* ── THIN ACCENT DIVIDER ── */}
      <View className="h-px bg-stone-200" />

      {/* ── PRODUCT LIST ── */}
      <View className="px-4 pt-5 pb-12 gap-4">
        {products.length === 0 ? (
          /* ── Empty State ── */
          <View className="bg-white rounded-3xl p-12 border border-stone-200/70 items-center gap-3 mt-4">
            <View className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 items-center justify-center mb-1">
              <Ionicons name="cube-outline" size={30} color="#c4b5a5" />
            </View>
            <Text className="text-stone-800 font-bold text-base tracking-tight">
              No Products Yet
            </Text>
            <Text className="text-stone-400 text-sm text-center leading-6">
              No listings are available in this category right now.
            </Text>
          </View>
        ) : (
          <>
            {products.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => {
                  setSelectedFirm({
                    id: String(product.id),
                    name: product.vendor_name,
                    city: product.vendor_location || "",
                    category: product.category_name,
                    rating: null,
                    image: "",
                    phone: "",
                  });
                  router.push("/(guest)/firm-detail");
                }}
                className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden active:opacity-75"
              >
                {/* ── Product Image ── */}
                {product.image_url ? (
                  <Image
                    source={{
                      uri: `${API_CONFIG.BASE_URL.replace("/api", "")}${product.image_url}`,
                    }}
                    className="w-full h-52"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="w-full h-44 items-center justify-center"
                    style={{ backgroundColor: color.bg }}
                  >
                    <Text
                      className="text-6xl font-black tracking-tighter"
                      style={{ color: color.text, opacity: 0.35 }}
                    >
                      {product.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}

                {/* ── Card Body ── */}
                <View className="p-5 gap-3">
                  {/* Name + Category Badge */}
                  <View className="flex-row items-start justify-between gap-3">
                    <Text
                      className="text-stone-900 font-bold text-base leading-snug flex-1 tracking-tight"
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>
                    <View
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: color.bg }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: color.text }}
                      >
                        {product.category_name}
                      </Text>
                    </View>
                  </View>

                  {/* Sub-category Tags */}
                  {(product.sub_category || product.third_category) && (
                    <View className="flex-row gap-2 flex-wrap">
                      {product.sub_category && (
                        <View className="bg-amber-50 border border-amber-100 px-3 py-0.5 rounded-full">
                          <Text className="text-amber-600 text-xs font-semibold">
                            {product.sub_category}
                          </Text>
                        </View>
                      )}
                      {product.third_category && (
                        <View className="bg-stone-50 border border-stone-200 px-3 py-0.5 rounded-full">
                          <Text className="text-stone-500 text-xs font-semibold">
                            {product.third_category}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Description */}
                  {product.description && (
                    <Text
                      className="text-stone-400 text-sm leading-relaxed"
                      numberOfLines={2}
                    >
                      {product.description}
                    </Text>
                  )}

                  {/* ── Divider ── */}
                  <View className="h-px bg-stone-100 my-0.5" />

                  {/* ── Vendor Row ── */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View className="w-7 h-7 rounded-full bg-stone-100 items-center justify-center">
                        <Ionicons name="business-outline" size={13} color="#78716c" />
                      </View>
                      <Text
                        className="text-stone-500 text-xs font-semibold flex-1"
                        numberOfLines={1}
                      >
                        {product.vendor_name}
                      </Text>
                    </View>

                    {/* CTA */}
                    <View className="flex-row items-center gap-1 bg-amber-500 px-3 py-1.5 rounded-full">
                      <Text className="text-white text-xs font-bold">
                        View Firm
                      </Text>
                      <Ionicons name="arrow-forward" size={11} color="white" />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {/* ── Load More Indicator ── */}
            {loadingMore && (
              <View className="py-6 items-center gap-2">
                <ActivityIndicator size="small" color="#d97706" />
                <Text className="text-stone-400 text-xs font-medium">
                  Loading more…
                </Text>
              </View>
            )}

            {/* ── End of Results ── */}
            {pagination && page >= pagination.totalPages && products.length > 0 && (
              <View className="py-6 items-center gap-1.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-px w-10 bg-stone-300" />
                  <Ionicons name="checkmark-circle" size={16} color="#a8a29e" />
                  <View className="h-px w-10 bg-stone-300" />
                </View>
                <Text className="text-stone-400 text-xs font-semibold">
                  All {pagination.total} products loaded
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}