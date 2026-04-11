import { getCategoryProducts } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

// <-- Helper: wraps raw HTML from richtext editor into a full HTML doc
const getDescriptionHtml = (html: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #a8a29e;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: transparent;
          word-wrap: break-word;
        }
        strong, b { color: #1c1917; }
        img { max-width: 100%; height: auto; border-radius: 8px; }
        ul, ol { padding-left: 20px; margin-top: 4px; margin-bottom: 4px; }
        p { margin-top: 0; margin-bottom: 8px; }
        p:last-child { margin-bottom: 0; }
      </style>
    </head>
    <body>
      <div id="content">${html}</div>
      <script>
        function reportHeight() {
          var h = document.getElementById('content').offsetHeight;
          window.ReactNativeWebView.postMessage(h.toString());
        }
        window.onload = reportHeight;
        window.addEventListener('resize', reportHeight);
        setTimeout(reportHeight, 300);
      </script>
    </body>
  </html>
`;

export default function CategoryDetail() {
  const params = useLocalSearchParams<{ id: string; name: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const name = Array.isArray(params.name) ? params.name[0] : params.name;

  const { setSelectedFirm } = useGuestStore();

const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  // <-- Map of productId → WebView height
  const [webViewHeights, setWebViewHeights] = useState<{ [key: number]: number }>({});

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
     
            <LinearGradient
                      colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      className="px-5 pt-6 pb-4 shadow-sm z-10"
                    >
        <View className="flex-row items-center justify-between">
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
                <View className="w-1.5 h-1.5 rounded-full bg-sky-800" />
                <Text className="text-sky-50 text-xs font-medium">
                  {pagination?.total ?? 0} products available
                </Text>
              </View>
            </View>
          </View>

         <Pressable
      onPress={() => router.back()}
      className="flex-row items-center justify-center bg-white/10 border border-white/20 active:bg-white/20 rounded-full px-4 py-2 gap-2"
    >
      <Feather name="arrow-left" size={13} color="#ffffff" />
      <Text className="text-white text-sm font-semibold tracking-wide">
        Back
      </Text>
    </Pressable>
        </View>
     </LinearGradient>

      {/* ── THIN ACCENT DIVIDER ── */}
      <View className="h-px bg-stone-200" />

      {/* ── PRODUCT LIST ── */}
<View className="px-4 pt-5 pb-12 gap-4">
  {products.length === 0 ? (
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
      {/* ✅ GRID WRAPPER */}
      <View className="flex-row flex-wrap justify-between">
        {products.map((product) => (
          <Pressable
            key={product.id}
            onPress={() =>
              router.push(`/(guest)/product/${product.id}` as any)
            }
            className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden active:opacity-75 mb-4 w-[48%]"
          >
            {/* ── Product Image ── */}
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                className="w-full h-40" // reduced for grid
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-full h-36 items-center justify-center"
                style={{ backgroundColor: color.bg }}
              >
                <Text
                  className="text-5xl font-black tracking-tighter"
                  style={{ color: color.text, opacity: 0.35 }}
                >
                  {product.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            {/* ── Card Body ── */}
            <View className="p-4 gap-2">
              {/* Name + Category */}
              <View className="flex-row items-start justify-between gap-2">
                <Text
                  className="text-stone-900 font-bold text-sm leading-snug flex-1"
                  numberOfLines={2}
                >
                  {product.name}
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: color.bg }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: color.text }}
                  >
                    {product.category_name}
                  </Text>
                </View>
              </View>

              {/* Sub-category */}
              {/* {(product.sub_category || product.third_category) && (
                <View className="flex-row gap-1 flex-wrap">
                  {product.sub_category && (
                    <View className="bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      <Text className="text-amber-600 text-[10px] font-semibold">
                        {product.sub_category}
                      </Text>
                    </View>
                  )}
                  {product.third_category && (
                    <View className="bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-full">
                      <Text className="text-stone-500 text-[10px] font-semibold">
                        {product.third_category}
                      </Text>
                    </View>
                  )}
                </View>
              )} */}

              {/* Description */}
              {/* {product.description ? (
                <View
                  style={{
                    height: webViewHeights[product.id] ?? 60,
                    width: "100%",
                  }}
                >
                  <WebView
                    scrollEnabled={false}
                    style={{ backgroundColor: "transparent", flex: 1 }}
                    source={{
                      html: getDescriptionHtml(product.description),
                    }}
                    onMessage={(event) => {
                      const h = Number(event.nativeEvent.data);
                      if (h > 0) {
                        setWebViewHeights((prev) => ({
                          ...prev,
                          [product.id]: h + 10,
                        }));
                      }
                    }}
                    javaScriptEnabled={true}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              ) : null} */}

              {/* Divider */}
              <View className="h-px bg-stone-100 my-1" />

              {/* Vendor Row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 flex-1">
                  <View className="w-6 h-6 rounded-full bg-stone-100 items-center justify-center">
                    <Ionicons
                      name="business-outline"
                      size={11}
                      color="#78716c"
                    />
                  </View>
                  <Text
                    className="text-stone-500 text-[10px] font-semibold flex-1"
                    numberOfLines={1}
                  >
                    {product.vendor_name}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    setSelectedFirm({
                      id: String(product?.vendor_id),
                      name: product?.firm_name || "",
                      city: product?.location || "",
                      category: product?.category_name || "",
                      rating: null,
                      image: product?.logo_url || "",
                      phone: product?.vendor_phone || "",
                      email: product?.email || "",
                    });
                    router.push("/(guest)/firm-detail");
                  }}
                  className="flex-row items-center gap-1 bg-sky-500 px-2 py-1 rounded-full"
                >
                  <Text className="text-white text-[10px] font-bold">
                    View
                  </Text>
                  <Ionicons name="arrow-forward" size={10} color="white" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Load More */}
      {loadingMore && (
        <View className="py-6 items-center gap-2">
          <ActivityIndicator size="small" color="#d97706" />
          <Text className="text-stone-400 text-xs font-medium">
            Loading more…
          </Text>
        </View>
      )}

      {/* End */}
      {pagination &&
        page >= pagination.totalPages &&
        products.length > 0 && (
          <View className="py-6 items-center gap-1.5">
            <View className="flex-row items-center gap-2">
              <View className="h-px w-10 bg-stone-300" />
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#a8a29e"
              />
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