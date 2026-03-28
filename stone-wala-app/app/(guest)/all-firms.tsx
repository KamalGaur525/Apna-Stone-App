import { getAllFirms } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

interface Firm {
  id: number;
  firm_name: string;
  tier: string;
  location: string | null;
  logo_url: string | null;
  phone: string;
  whatsapp: string | null;
  product_count: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CITIES = ["All", "Jaipur", "Kishangarh", "Udaipur", "Jodhpur", "Delhi"];

export default function AllFirms() {
  const { setSelectedFirm } = useGuestStore();

  const [firms, setFirms] = useState<Firm[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCity, setSelectedCity] = useState("All");

  useEffect(() => {
    fetchFirms(1, "All");
  }, []);

  const fetchFirms = async (pageNum: number, city: string) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await getAllFirms(
        pageNum,
        city !== "All" ? city : undefined
      );

      if (pageNum === 1) {
        setFirms(res.data || []);
      } else {
        setFirms((prev) => [...prev, ...(res.data || [])]);
      }

      setPagination(res.pagination);
      setPage(pageNum);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load firms.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFirms(1, selectedCity);
    setRefreshing(false);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    fetchFirms(1, city);
  };

  const loadMore = () => {
    if (pagination && page < pagination.totalPages && !loadingMore) {
      fetchFirms(page + 1, selectedCity);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Stone Seller": return { bg: "bg-amber-500", text: "text-white", dot: "bg-amber-300" };
      case "Factory": return { bg: "bg-black", text: "text-white", dot: "bg-amber-600"  };
      case "Godown": return { bg: "bg-amber-500/15", text: "text-amber-600", dot: "bg-amber-600" };
      default: return { bg: "bg-stone-400", text: "text-white", dot: "bg-stone-300" };
    }
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-stone-500 text-sm">Loading firms…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-8">
        <Text className="text-stone-900 font-bold text-xl mb-2">
          Something went wrong
        </Text>
        <Text className="text-stone-400 text-sm text-center mb-8">{error}</Text>
        <Pressable
          onPress={() => fetchFirms(1, selectedCity)}
          className="bg-amber-500 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-white font-bold">Try Again</Text>
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
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
        if (isBottom) loadMore();
      }}
      scrollEventThrottle={400}
    >
      {/* ── HEADER ── */}
     
            <View className="bg-stone-950 px-5 pt-5 pb-3">
       
     <View className="flex-row items-start justify-between">
  {/* Left — Title */}
  <View className="flex-row items-center gap-3">
    <View className="w-1.5 h-10 rounded-full bg-amber-400" />
    <View className="gap-0.5">
      <Text className="text-amber-500 text-[10px] font-extrabold tracking-[3px] uppercase">
         Browse
      </Text>
      <Text className="text-white text-2xl font-extrabold tracking-tight leading-tight">
        All Firms
      </Text>
      <Text className="text-stone-500 text-xs font-medium">
        {pagination?.total || 0} firms available
      </Text>
    </View>
  </View>

  {/* Right — Back button */}
  <Pressable
    onPress={() => router.back()}
    className="flex-row items-center bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 gap-1.5"
  >
    <Text className="text-amber-600 text-sm">←</Text>
    <Text className="text-amber-600 text-sm font-semibold">Back</Text>
  </Pressable>
</View>
      </View>

      {/* ── CITY FILTER ── */}
      <View className="pt-5 gap-3">
        <View className="flex-row items-center gap-3 px-5">
          <View className="w-1.5 h-6 rounded-full bg-amber-400" />
          <View>
            <Text className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase">
              Browse
            </Text>
            <Text className="text-stone-900 text-base font-extrabold leading-tight -mt-0.5">
              Filter by City
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {CITIES.map((city) => (
            <Pressable
              key={city}
              onPress={() => handleCitySelect(city)}
              className={`px-5 py-2.5 rounded-2xl border active:opacity-75 ${
                selectedCity === city
                  ? "bg-stone-900 border-stone-900"
                  : "bg-white border-stone-200/80"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCity === city ? "text-white" : "text-stone-600"
                }`}
              >
                {city}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── FIRMS LIST ── */}
      <View className="px-4 pt-5 pb-10 gap-3">
        {firms.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 border border-stone-200/60 items-center gap-3">
            <View className="w-14 h-14 rounded-2xl bg-stone-100 items-center justify-center">
              <Ionicons name="business-outline" size={28} color="#d6d3d1" />
            </View>
            <Text className="text-stone-900 font-bold text-base">
              No Firms Found
            </Text>
            <Text className="text-stone-400 text-sm text-center">
              {selectedCity !== "All"
                ? `No firms in ${selectedCity}`
                : "No firms available"}
            </Text>
          </View>
        ) : (
          <>
            {firms.map((firm) => {
              const tier = getTierColor(firm.tier);
              return (
                <Pressable
                  key={firm.id}
                  onPress={() => {
                    setSelectedFirm({
                      id: String(firm.id),
                      name: firm.firm_name,
                      city: firm.location || "",
                      category: "",
                      rating: null,
                      image: firm.logo_url || "",
                      phone: firm.phone,
                    });
                    router.push("/(guest)/firm-detail");
                  }}
                  className="bg-white border border-stone-200/60 rounded-3xl p-4 shadow-sm active:bg-stone-50"
                >
                  <View className="flex-row items-center gap-3">
                    {/* Logo */}
                   {/* ── Premium Logo Wrapper (Small Read-Only) ── */}
<View className="p-0.5 rounded-lg   border border-amber-400 shadow-sm">
  {firm.logo_url ? (
    <Image
      source={{
        uri: firm.logo_url,
      }}
      className="w-12 h-12 rounded-lg  "
      resizeMode="cover"
    />
  ) : (
    <View className="w-12 h-12 rounded-lg bg-amber-50 items-center justify-center">
      <Text className="text-amber-600 font-black text-base tracking-widest">
        {firm.firm_name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  )}
</View>

                    {/* Info */}
                    <View className="flex-1 gap-1">
                      <Text
                        className="text-stone-900 font-bold text-sm"
                        numberOfLines={1}
                      >
                        {firm.firm_name}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="location-outline" size={11} color="#a8a29e" />
                        <Text className="text-stone-400 text-xs" numberOfLines={1}>
                          {firm.location || "Location not set"}
                        </Text>
                      </View>
                    </View>

                    {/* Tier Badge */}
                    <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${tier.bg}`}>
                      <View className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                      <Text className={`text-xs font-bold ${tier.text}`}>
                        {firm.tier}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-stone-100 my-3" />

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <View className="w-5 h-5 rounded-full bg-stone-100 items-center justify-center">
                        <Ionicons name="cube-outline" size={11} color="#a8a29e" />
                      </View>
                      <Text className="text-stone-400 text-xs font-medium">
                        {firm.product_count} products
                      </Text>
                    </View>
                    <Text className="text-amber-600 text-xs font-bold">
                      View Firm →
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {/* Load More */}
            {loadingMore && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#f59e0b" />
              </View>
            )}

            {/* End */}
            {pagination && page >= pagination.totalPages && firms.length > 0 && (
              <View className="py-4 items-center">
                <Text className="text-stone-400 text-xs font-semibold">
                  All {pagination.total} firms loaded ✓
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}