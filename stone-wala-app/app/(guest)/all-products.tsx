import { getMarketplaceProducts } from "@/services/guestService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

interface Product {
  id: number;
  name: string;
  description: string;
  image_url: string;
  sub_category: string;
  created_at: string;
  vendor_name: string;
  vendor_location: string;
  category_name: string;
}

export default function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Error States
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProducts = async (pageNumber: number, isRefresh = false) => {
    try {
      if (pageNumber === 1) {
        if (!isRefresh) setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setAccessDenied(false);

      const response = await getMarketplaceProducts({ page: pageNumber, limit: 10 });
      const newProducts = response.data;

      if (newProducts.length < 10) {
        setHasMore(false);
      }

      setProducts((prev) => (pageNumber === 1 ? newProducts : [...prev, ...newProducts]));
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      setHasMore(false); 
      
      if (error.response?.status === 403) {
        setAccessDenied(true);
        setErrorMsg(error.response?.data?.error || "You need to unlock marketplace access.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading && !accessDenied) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = item.image_url || null;

    return (
     <Pressable
  onPress={() => router.push(`/(guest)/product/${item.id}` as any)}
  className="flex-1 m-2 bg-[#f0f9ff] rounded-2xl border border-[#dbeafe] shadow-sm overflow-hidden"
  style={({ pressed }) => ({
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.97 : 1 }],
  })}
>
  {/* ── Image Block ── */}
  <View className="relative w-full h-44">
    {imageUrl ? (
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-full bg-[#e0f2fe]"
        resizeMode="cover"
      />
    ) : (
      <View className="w-full h-full bg-[#e0f2fe] items-center justify-center">
        <Ionicons name="image-outline" size={32} color="#a0d3e6" />
      </View>
    )}

    {/* Category Chip */}
    <View className="absolute top-2 right-2 bg-white/90 border border-[#dbeafe] px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md">
      <Text
        className="text-[#1f5f7a] text-[10px] font-extrabold tracking-wide uppercase"
        numberOfLines={1}
      >
        {item.category_name}
      </Text>
    </View>

    {/* Floating Arrow */}
    <View className="absolute -bottom-7 right-2 items-center justify-center z-10">
      <View className="-rotate-60 items-center justify-center">
        <Feather name="arrow-up-right" size={12} color="#5c99b3" />
      </View>
    </View>
  </View>

  {/* ── Info Block ── */}
  <View className="px-3.5 pt-3 pb-4 gap-1.5">
    
    <Text
      className="text-[#0f3f5a] font-extrabold text-sm leading-snug"
      numberOfLines={1}
    >
      {item.name}
    </Text>
    
    <View className="gap-1 mt-0.5">
      
      <View className="flex-row items-center gap-1.5">
        <View className="w-1.5 h-1.5 rounded-full bg-[#5c99b3]" />
        <Text
          className="text-[#6b9fb8] text-xs font-semibold flex-1"
          numberOfLines={1}
        >
          {item.vendor_name}
        </Text>
      </View>
      
      <View className="flex-row items-center gap-1.5">
        <View className="w-1.5 h-1.5 rounded-full bg-[#a0d3e6]" />
        <Text
          className="text-[#6b9fb8] text-[10px] font-medium flex-1"
          numberOfLines={1}
        >
          {item.vendor_location || "Location unavailable"}
        </Text>
      </View>

    </View>
  </View>
</Pressable>
    );
  };

  return (
    <View className="flex-1 bg-stone-50">
     
     {/* ── Custom Premium Header ── */}
<LinearGradient
  colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  className="px-5 pt-5 pb-3 shadow-sm z-10"
>
  <View className="flex-row items-center justify-between">
    
    {/* Left — Title Stack */}
    <View className="flex-row items-center gap-3">
      
      {/* Accent Bar */}
      <View className="w-1.5 h-10 rounded-full bg-[#5c99b3]" />
      
      <View className="gap-0.5">
        <Text className="text-[#a0d3e6] text-[10px] font-extrabold tracking-[3px] uppercase">
          Explore
        </Text>

        <Text className="text-white text-2xl font-extrabold tracking-tight leading-tight">
          Marketplace
        </Text>

        <Text className="text-[#f2f3f8] text-xs font-medium">
          Discover premium stones
        </Text>
      </View>
    </View>

    {/* Right — Back button */}
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

      {/* ── Main Content Area ── */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : accessDenied ? (
        // ── 403 Access Denied State ──
        <View className="flex-1 items-center justify-center p-8 gap-4">
          <View className="w-20 h-20 rounded-3xl bg-red-50 border border-red-100 items-center justify-center mb-2">
            <Feather name="lock" size={32} color="#ef4444" />
          </View>
          <Text className="text-2xl font-black text-stone-900 text-center">Locked</Text>
          <Text className="text-stone-500 text-center text-sm leading-relaxed px-4">
            {errorMsg}
          </Text>
          <Pressable  className="mt-6 bg-amber-500 px-8 py-3.5 rounded-xl active:opacity-80">
            <Text className="text-white font-bold tracking-wide">Unlock Access</Text>
          </Pressable>
        </View>
      ) : (
        // ── Product Grid ──
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerClassName="p-3 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-32 gap-3">
              <View className="w-20 h-20 rounded-3xl bg-white border border-stone-200 shadow-sm items-center justify-center mb-2">
                <Ionicons name="cube-outline" size={36} color="#d6d3d1" />
              </View>
              <Text className="text-stone-800 text-lg font-bold">No products found</Text>
              <Text className="text-stone-400 text-sm text-center px-10">
                Check back later or try adjusting your search filters.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#f59e0b" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}