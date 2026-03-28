import { deleteProduct, getProductById } from "@/services/vendorService";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

interface Product {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  status: "approved" | "pending" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  category_name: string;
  sub_category: string | null;
  third_category: string | null;
}

export default function ProductDetail() {
  const params = useLocalSearchParams<{ id: string; refresh?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [descHeight, setDescHeight] = useState(100);

  useEffect(() => {
    fetchProduct();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (params.refresh === "true") {
        fetchProduct();
      }
    }, [params.refresh])
  );

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductById(Number(id));
      setProduct(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load product.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProduct();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Product",
      "Are you sure? This product will be removed from marketplace.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteProduct(Number(id));
              Alert.alert("Deleted", "Product removed successfully.", [
                { text: "OK", onPress: () => router.replace("/(vendor)/my-products") },
              ]);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.response?.data?.error || "Failed to delete product."
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-emerald-500/15 border border-emerald-500/30",
          text: "text-emerald-400",
          dot: "bg-emerald-400",
          label: "Live",
        };
      case "pending":
        return {
          bg: "bg-amber-500/15 border border-amber-500/30",
          text: "text-amber-400",
          dot: "bg-amber-400",
          label: "Pending",
        };
      case "rejected":
        return {
          bg: "bg-red-500/15 border border-red-500/30",
          text: "text-red-400",
          dot: "bg-red-400",
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-stone-500/15 border border-stone-500/30",
          text: "text-stone-400",
          dot: "bg-stone-500",
          label: status,
        };
    }
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-amber-500/10 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
        <Text className="text-stone-500 text-sm font-medium tracking-wide">
          Loading product…
        </Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error || !product) {
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
          onPress={fetchProduct}
          className="bg-amber-500 active:bg-amber-400 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-stone-950 font-bold text-sm tracking-wide">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const status = getStatusStyle(product.status);

  // ── Description HTML (defined outside JSX to avoid parser issues) ──
  const descriptionHtml = product.description
  ? `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="
        font-family: -apple-system, sans-serif;
        color: #44403c;
        font-size: 16px; /* Reduced from 48px for better readability */
        line-height: 1.6;
        padding: 10px;
        margin: 0;
        background: transparent;
      ">
        ${product.description}
      </body>
    </html>
  `
  : "";

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
      {/* ── Header ── */}
      <View className="bg-stone-950 px-6 pt-14 pb-8">

        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 mb-8 gap-1.5"
        >
          <Text className="text-amber-600 text-sm">←</Text>
          <Text className="text-amber-600 text-sm font-semibold">Back</Text>
        </Pressable>

        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text
              className="text-white text-2xl font-bold tracking-tight leading-tight"
              numberOfLines={2}
            >
              {product.name}
            </Text>
            <Text className="text-stone-400 text-sm font-medium mt-2">
              Added{" "}
              {new Date(product.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>

          <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full self-start mt-1 ${status.bg}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <Text className={`text-xs font-bold tracking-wide ${status.text}`}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 pt-5 pb-8 gap-4">

        {/* ── Product Image ── */}
        {product.image_url ? (
          <Image
            source={{
             uri: product.image_url, 
            }}
            className="w-full h-64 rounded-3xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-64 rounded-3xl bg-white border border-stone-200/60 items-center justify-center gap-2">
            <View className="w-16 h-16 rounded-2xl bg-stone-100 items-center justify-center">
              <Text className="text-4xl">📷</Text>
            </View>
            <Text className="text-stone-400 text-sm font-medium">No image uploaded</Text>
          </View>
        )}

        {/* ── Rejection Banner ── */}
        {product.status === "rejected" && (
          <View className="bg-red-50 rounded-3xl border border-red-100 overflow-hidden">
            <View className="bg-red-500 px-5 py-3 flex-row items-center gap-2.5">
              <View className="w-5 h-5 rounded-full bg-red-400 items-center justify-center">
                <Text className="text-white text-xs font-black">!</Text>
              </View>
              <Text className="text-white font-bold text-sm tracking-wide">
                Product Rejected
              </Text>
            </View>
            {product.rejection_reason && (
              <View className="px-5 py-4">
                <Text className="text-red-600 text-sm leading-relaxed">
                  {product.rejection_reason}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Product Info Card ── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">

          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-amber-400" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Product Info
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5" />

          {/* Product Name */}
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-stone-500 text-sm font-semibold">Product Name</Text>
            <Text className="text-stone-900 text-sm font-bold flex-1 text-right ml-4" numberOfLines={2}>
              {product.name}
            </Text>
          </View>

          {/* Date Added */}
          <View className="h-px bg-stone-100 mx-5" />
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-stone-500 text-sm font-semibold">Date Added</Text>
            <View className="bg-amber-50 px-3 border border-amber-100 py-1 rounded-full">
              <Text className="text-amber-700 text-xs font-bold">
                {new Date(product.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          {/* Category */}
          <View className="h-px bg-stone-100 mx-5" />
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-stone-500 text-sm font-semibold">Category</Text>
            <View className="bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
              <Text className="text-amber-700 text-xs font-bold">
                {product.category_name}
              </Text>
            </View>
          </View>

          {/* Sub Category */}
          {product.sub_category && (
            <>
              <View className="h-px bg-stone-100 mx-5" />
              <View className="flex-row items-center justify-between px-5 py-4">
                <Text className="text-stone-500 text-sm font-semibold">Sub Category</Text>
                <Text className="text-stone-900 text-sm font-bold">{product.sub_category}</Text>
              </View>
            </>
          )}

          {/* Third Category */}
          {product.third_category && (
            <>
              <View className="h-px bg-stone-100 mx-5" />
              <View className="flex-row items-center justify-between px-5 py-4">
                <Text className="text-stone-500 text-sm font-semibold">Third Category</Text>
                <Text className="text-stone-900 text-sm font-bold">{product.third_category}</Text>
              </View>
            </>
          )}

          {/* Description */}
         {/* Description */}
{product.description && (
  <>
    {/* Change <div> to <View> below */}
    <View className="h-px bg-stone-100 mx-5" />
    <View className="px-5 py-4 pb-5 gap-2">
      <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
        Description
      </Text>
      
      {/* Scrollable Container for WebView */}
      <View style={{ height: 250, overflow: 'hidden' }}>
        <WebView
          nestedScrollEnabled={true} // Allows scrolling inside the ScrollView
          scrollEnabled={true}
          style={{ flex: 1, backgroundColor: "transparent" }}
          source={{ html: descriptionHtml }}
        />
      </View>
    </View>
  </>
)}

        </View>

        {/* ── Action Buttons ── */}
        <View className="flex-row gap-3 mt-1">

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(vendor)/edit-product",
                params: { id: String(product.id) },
              })
            }
            className="flex-1 bg-stone-950 active:bg-stone-800 rounded-2xl py-4 items-center gap-1"
          >
            <Text className="text-white font-black text-sm tracking-wide">
              Edit Product
            </Text>
            <Text className="text-stone-500 text-xs font-medium">
              Update details
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-50 active:bg-red-100 border border-red-200 rounded-2xl py-4 items-center gap-1"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Text className="text-red-500 font-black text-sm tracking-wide">
                  Delete
                </Text>
                <Text className="text-red-300 text-xs font-medium">
                  Cannot be undone
                </Text>
              </>
            )}
          </Pressable>

        </View>
      </View>
    </ScrollView>
  );
}