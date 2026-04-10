import { getAllFirms } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
    case "Stone Seller":
      return {
        bg: "bg-[#5c99b3]",      // your primary blue
        text: "text-white",
        dot: "bg-[#a0d3e6]",
      };

    case "Factory":
     return {
        bg: "bg-[#0ea5e9]/15",   // sky blue (lighter, tech feel)
        text: "text-[#0369a1]",
        dot: "bg-[#0369a1]",
      };

    case "Godown":
      return {
        bg: "bg-[#059669]/15",   // emerald green (trust + logistics vibe)
        text: "text-[#059669]",
        dot: "bg-[#059669]",
      };

    default:
      return {
        bg: "bg-[#64748b]/20",   // neutral slate
        text: "text-[#334155]",
        dot: "bg-[#64748b]",
      };
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
      
                  <LinearGradient
              colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="px-5 pt-5 pb-3 shadow-sm z-10"
            >
       
     <View className="flex-row items-start justify-between">
  {/* Left — Title */}
  <View className="flex-row items-center gap-3">
    <View className="w-1.5 h-10 rounded-full bg-[#5c99b3]" />
    <View className="gap-0.5">
      <Text className="text-[#a0d3e6] text-[10px] font-extrabold tracking-[3px] uppercase">
         Browse
      </Text>
      <Text className="text-white text-2xl font-extrabold tracking-tight leading-tight">
        All Firms
      </Text>
      <Text className="text-[#f2f3f8] text-xs font-medium">
        {pagination?.total || 0} firms available
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

      {/* ── CITY FILTER ── */}
      <View className="pt-5 gap-3">
        <View className="flex-row items-center gap-3 px-5">
    
    <View className="w-1.5 h-6 rounded-full bg-[#5c99b3]" />
    
    <View>
      <Text className="text-[10px] font-extrabold tracking-widest text-[#5c99b3] uppercase">
        Browse
      </Text>
      <Text className="text-[#0f3f5a] text-base font-extrabold leading-tight -mt-0.3">
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
                   ? "bg-[#1f5f7a] border-[#1f5f7a]"
                   : "bg-[#f0f9ff] border-[#dbeafe]"
               }`}
             >
               <Text
                 className={`text-xs font-bold ${
                   selectedCity === city
                     ? "text-white"
                     : "text-[#6b9fb8]"
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
  className="bg-[#f0f9ff] border border-[#dbeafe] rounded-3xl p-4 shadow-sm active:bg-[#e0f2fe]"
>
  <View className="flex-row items-center gap-3">
    
    {/* Logo */}
    <View className="p-0.5 rounded-lg border border-[#5c99b3] shadow-sm">
      {firm.logo_url ? (
        <Image
          source={{ uri: firm.logo_url }}
          className="w-12 h-12 rounded-lg"
          resizeMode="cover"
        />
      ) : (
        <View className="w-12 h-12 rounded-lg bg-[#e0f2fe] items-center justify-center">
          <Text className="text-[#1f5f7a] font-black text-base tracking-widest">
            {firm.firm_name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
    </View>

    {/* Info */}
    <View className="flex-1 gap-1">
      <Text
        className="text-[#0f3f5a] font-bold text-sm"
        numberOfLines={1}
      >
        {firm.firm_name}
      </Text>

      <View className="flex-row items-center gap-1">
        <Ionicons name="location-outline" size={11} color="#6b9fb8" />
        <Text className="text-[#6b9fb8] text-xs" numberOfLines={1}>
          {firm.location || "Location not set"}
        </Text>
      </View>
    </View>

    {/* Tier Badge (unchanged logic) */}
    <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${tier.bg}`}>
      <View className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
      <Text className={`text-xs font-bold ${tier.text}`}>
        {firm.tier}
      </Text>
    </View>
  </View>

  <View className="h-px bg-[#dbeafe] my-3" />

  <View className="flex-row items-center justify-between">
    
    <View className="flex-row items-center gap-1.5">
      <View className="w-5 h-5 rounded-full bg-[#e0f2fe] items-center justify-center">
        <Ionicons name="cube-outline" size={11} color="#6b9fb8" />
      </View>

      <Text className="text-[#6b9fb8] text-xs font-medium">
        {firm.product_count} products
      </Text>
    </View>

    <Text className="text-[#1f5f7a] text-xs font-bold">
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