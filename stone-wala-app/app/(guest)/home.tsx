import { API_CONFIG } from "@/constants/api";
import { getGuestHome, searchFirms } from "@/services/guestService";
import { useAuthStore } from "@/store/authStore";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface Category {
  id: number;
  name: string;
  product_count: number;
}

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

interface Product {
  id: number;
  name: string;
  image_url: string | null;
  sub_category: string | null;
  vendor_name: string;
  category_name: string;
}

interface Service {
  id: number;
  name: string;
  phone: string;
  photo_url: string | null;
  description: string | null;
  service_type: string;
}

const CITIES = ["All", "Jaipur", "Kishangarh", "Udaipur", "Jodhpur", "Delhi"];

export default function Home() {
  const { setSelectedFirm } = useGuestStore();
  const { logout } = useAuthStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── City Filter ──────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState("All");

  // ── Search ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    firms: Firm[];
    services: Service[];
  }>({ firms: [], services: [] });
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchHome();
  }, []);

  const fetchHome = async (city?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGuestHome(city && city !== "All" ? city : undefined);
      setCategories(res.data.categories || []);
      setFirms(res.data.firms || []);
      setProducts(res.data.products || []);
      setServices(res.data.services || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load home.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHome(selectedCity !== "All" ? selectedCity : undefined);
    setRefreshing(false);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    fetchHome(city !== "All" ? city : undefined);
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

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setShowResults(false);
      setSearchResults({ firms: [], services: [] });
      return;
    }
    try {
      setSearching(true);
      setShowResults(true);
      const res = await searchFirms(text.trim());
      setSearchResults({
        firms: res.data.firms || [],
        services: res.data.services || [],
      });
    } catch {
      setSearchResults({ firms: [], services: [] });
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
    setSearchResults({ firms: [], services: [] });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Stone Seller":
        return { bg: "bg-amber-500", text: "text-white", dot: "bg-amber-300" };
      
      case "Factory": return { bg: "bg-black", text: "text-white", dot: "bg-amber-600" };
      case "Godown": return { bg: "bg-amber-500/15", text: "text-amber-600", dot: "bg-amber-600" };
      default:
        return { bg: "bg-stone-400", text: "text-white", dot: "bg-stone-300" };
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
          Loading marketplace…
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
          onPress={() => fetchHome()}
          className="bg-amber-500 active:bg-amber-400 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-stone-950 font-bold text-sm tracking-wide">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const hasSearchResults =
    searchResults.firms.length > 0 || searchResults.services.length > 0;

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
      <View className="bg-stone-950 px-5 pt-14 pb-7">
        <View className="flex-row items-center justify-between mb-6">
          <View className="gap-0.5">
            <Text className="text-amber-500 text-[10px] font-extrabold uppercase tracking-[3px]">
              Stone Wala
            </Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <Text className="text-white text-[26px] font-black tracking-tight leading-tight">
                Explore Stones
              </Text>
              <View className="w-7 h-7 rounded-full bg-amber-500/15 items-center justify-center">
                <Ionicons name="compass-outline" size={16} color="#f59e0b" />
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            className="flex-row items-center bg-amber-500/15 border border-amber-500/30 active:bg-stone-800 rounded-full px-4 py-2 gap-1.5"
          >
            <Feather name="log-out" size={13} color="#d97706" />
            <Text className="text-amber-600 text-xs font-bold">Logout</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="bg-stone-800/80 border border-stone-700/60 rounded-2xl px-4 py-3.5 flex-row items-center gap-3">
          <Ionicons name="search" size={17} color="#78716c" />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search marble, granite, firms…"
            placeholderTextColor="#57534e"
            className="flex-1 text-sm text-white font-medium"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={clearSearch}
              className="w-6 h-6 rounded-full bg-stone-700 items-center justify-center"
            >
              <Ionicons name="close" size={13} color="#a8a29e" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── SEARCH RESULTS ── */}
      {showResults && (
        <View className="mx-4 mt-3 bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-stone-100">
            <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest">
              Search Results
            </Text>
            {searching && <ActivityIndicator size="small" color="#f59e0b" />}
          </View>

          {!hasSearchResults && !searching ? (
            <View className="px-5 py-10 items-center gap-2">
              <Ionicons name="search-outline" size={32} color="#d6d3d1" />
              <Text className="text-stone-400 text-sm font-medium">
                No results found
              </Text>
            </View>
          ) : (
            <>
              {/* Firms */}
              {searchResults.firms.length > 0 && (
                <>
                  <View className="px-5 py-2 bg-stone-50 border-b border-stone-100">
                    <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest">
                      Firms
                    </Text>
                  </View>
                  {searchResults.firms.map((firm, index) => (
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
                        clearSearch();
                      }}
                      className={`px-5 py-4 flex-row items-center gap-3 active:bg-stone-50 ${
                        index < searchResults.firms.length - 1
                          ? "border-b border-stone-100"
                          : ""
                      }`}
                    >
                      <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
                        <Text className="text-amber-600 font-bold text-sm">
                          {firm.firm_name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-stone-900 font-semibold text-sm"
                          numberOfLines={1}
                        >
                          {firm.firm_name}
                        </Text>
                        <Text className="text-stone-400 text-xs mt-0.5">
                          {firm.location || "Location not set"}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#d6d3d1" />
                    </Pressable>
                  ))}
                </>
              )}

              {/* Services */}
              {searchResults.services.length > 0 && (
                <>
                  <View className="px-5 py-2 bg-stone-50 border-t border-b border-stone-100">
                    <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest">
                      Services
                    </Text>
                  </View>
                  {searchResults.services.map((service, index) => (
                    <View
                      key={service.id}
                      className={`px-5 py-4 flex-row items-center gap-3 ${
                        index < searchResults.services.length - 1
                          ? "border-b border-stone-100"
                          : ""
                      }`}
                    >
                      <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center">
                        <Ionicons name="construct-outline" size={16} color="#d97706" />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-stone-900 font-semibold text-sm"
                          numberOfLines={1}
                        >
                          {service.name}
                        </Text>
                        <Text className="text-stone-400 text-xs mt-0.5">
                          {service.service_type} · {service.phone}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      )}


      <View className="py-5 gap-6">

        {/* ── FEATURED BANNER ── */}
       <View className="mx-4">
          <View className="bg-stone-950 rounded-3xl overflow-hidden border border-stone-800/80">
            {/* Decorative orbs */}
            <View className="absolute right-0 top-0 w-40 h-40 bg-amber-500/8 rounded-full -mr-16 -mt-16" />
            <View className="absolute right-10 bottom-0 w-24 h-24 bg-amber-400/5 rounded-full -mb-10" />
            <View className="absolute left-0 bottom-0 w-20 h-20 bg-amber-600/5 rounded-full -ml-8 -mb-8" />

            <View className="p-5">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <Text className="text-amber-400 text-[10px] font-extrabold tracking-widest uppercase">
                    Premium Marketplace
                  </Text>
                </View>
              </View>

              <Text className="text-white text-2xl font-black leading-tight tracking-tight mb-1">
                India's #1 Stone Marketplace
              </Text>
              <Text className="text-stone-500 text-xs leading-5 mb-5">
                Connect with verified vendors across Rajasthan & beyond
              </Text>

              {/* Stats row */}
              <View className="flex-row items-center bg-stone-900/70 border border-stone-800 rounded-2xl px-4 py-3 gap-0">
                <View className="flex-1 items-center gap-0.5">
                  <Text className="text-amber-400 font-black text-lg leading-tight">
                    {firms.length}+
                  </Text>
                  <Text className="text-stone-600 text-[10px] font-bold uppercase tracking-wide">
                    Firms
                  </Text>
                </View>
                <View className="w-px h-8 bg-stone-800" />
                <View className="flex-1 items-center gap-0.5">
                  <Text className="text-amber-400 font-black text-lg leading-tight">
                    {products.length}+
                  </Text>
                  <Text className="text-stone-600 text-[10px] font-bold uppercase tracking-wide">
                    Products
                  </Text>
                </View>
                <View className="w-px h-8 bg-stone-800" />
                <View className="flex-1 items-center gap-0.5">
                  <Text className="text-amber-400 font-black text-lg leading-tight">
                    {categories.length}+
                  </Text>
                  <Text className="text-stone-600 text-[10px] font-bold uppercase tracking-wide">
                    Categories
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      
   <View className="gap-3">
          <View className="flex-row justify-between items-center px-5">
            <View className="flex-row items-center gap-3">
              <View className="w-1.5 h-6 rounded-full bg-amber-400" />
              <View>
                <Text className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase">
                  Shop By
                </Text>
                <Text className="text-stone-900 text-base font-extrabold leading-tight -mt-0.5">
                  Categories
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push("/(guest)/categories")}
              className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full"
            >
              <Text className="text-amber-600 text-xs font-bold tracking-wide">
                See All →
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {categories.map((cat) => (
             <Pressable
  key={cat.id}
  onPress={() =>
    router.push({
      pathname: "/(guest)/category-detail",
      params: { id: String(cat.id), name: cat.name },
    })
  }
  className="bg-white border border-stone-200/60 rounded-2xl shadow-sm active:bg-amber-50 active:border-amber-200 overflow-hidden mr-3"
>
  <View className="flex-row items-center gap-3 px-3.5 py-3">
    {/* Icon tile */}
    <View className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/80 items-center justify-center shrink-0">
      <Ionicons name="layers-outline" size={18} color="#d97706" />
    </View>

    {/* Text stack */}
    <View className="gap-0.5">
      <Text className="text-stone-900 font-extrabold text-sm" numberOfLines={1}>
        {cat.name}
      </Text>
      {cat.product_count > 0 ? (
        <View className="flex-row items-center gap-1">
          <View className="w-1 h-1 rounded-full bg-amber-400" />
          <Text className="text-stone-400 text-[10px] font-semibold">
            {cat.product_count} products
          </Text>
        </View>
      ) : (
        <Text className="text-stone-300 text-[10px] font-medium">No products</Text>
      )}
    </View>
  </View>
</Pressable>
            ))}
          </ScrollView>
        </View>
        

       
{/* ── TRENDING PRODUCTS ── */}
<View className="gap-4 pb-10">
  {/* ── Section Header ── */}
  <View className="flex-row justify-between items-end px-5">
    <View className="flex-row items-center gap-3">
      <View className="w-1.5 h-7 rounded-full bg-amber-400" />
      <View>
        <Text className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">
          Discover
        </Text>
        <Text className="text-stone-900 text-xl font-extrabold leading-tight -mt-0.5">
          Trending Products
        </Text>
      </View>
    </View>
   
    <Pressable 
      onPress={() => router.push("/(guest)/all-products")} 
      className="bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full mb-0.5"
    >
      <Text className="text-amber-600 text-xs font-bold tracking-wide">
        View All →
      </Text>
    </Pressable>
  </View>

  {/* ── Horizontal Scroll ── */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
  >
    {products.length === 0 ? (
      // ── Empty State ──
      <View className="w-64 bg-white rounded-3xl border border-stone-200/60 overflow-hidden">
        <View className="h-28 bg-stone-50 items-center justify-center">
          <View className="w-16 h-16 rounded-2xl bg-white shadow-sm items-center justify-center">
            <Ionicons name="cube-outline" size={30} color="#d6d3d1" />
          </View>
        </View>
        <View className="px-5 py-4 gap-1">
          <Text className="text-stone-800 font-bold text-sm">Nothing here yet</Text>
          <Text className="text-stone-400 text-xs">Products will appear once added.</Text>
        </View>
      </View>
    ) : (
      products.slice(0, 5).map((product) => (
        <Pressable
          key={product.id}
          onPress={() => router.push(`/(guest)/product/${product.id}` as any)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
          className="w-48 bg-white rounded-2xl overflow-hidden border border-stone-200/60 shadow-sm"
        >
          {/* ── Image Block ── */}
          <View className="relative w-full h-40">
            {product.image_url ? (
              <Image
                source={{ uri: `${API_CONFIG.BASE_URL.replace("/api", "")}${product.image_url}` }}
                className="w-full h-full bg-stone-100"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-stone-100 items-center justify-center">
                <Ionicons name="image-outline" size={32} color="#d6d3d1" />
              </View>
            )}

            {/* Dark scrim for text readability (if needed) */}
            <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Floating category chip */}
            <View className="absolute top-2 right-2 bg-amber-50/95 border border-amber-100 px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md">
              <Text className="text-amber-600 text-[10px] font-extrabold tracking-wide uppercase" numberOfLines={1}>
                {product.category_name}
              </Text>
            </View>
          </View>

          {/* ── Info Block ── */}
          <View className="px-3.5 pt-3 pb-4 gap-1">
            <Text className="text-stone-900 font-extrabold text-sm leading-snug" numberOfLines={1}>
              {product.name}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <Text className="text-stone-500 text-xs font-semibold flex-1" numberOfLines={1}>
                {product.vendor_name}
              </Text>
            </View>
          </View>
        </Pressable>
      ))
    )}
  </ScrollView>
</View>

  {/* ── CITY FILTER ── */}
        
        <View className="gap-3">
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
                  {/* ── FEATURED FIRMS ── */}
   <View className="gap-3">
          <View className="flex-row justify-between items-center px-5">
            <View className="flex-row items-center gap-3">
              <View className="w-1.5 h-7 rounded-full bg-amber-400" />
              <View>
                <Text className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase">
                  Verified
                </Text>
                <Text className="text-stone-900 text-base font-extrabold leading-tight -mt-0.5">
                  Featured Firms
                  {selectedCity !== "All" && (
                    <Text className="text-stone-400 text-sm font-normal">
                      {" "}
                      in {selectedCity}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => router.push("/(guest)/all-firms")} className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <Text className="text-amber-600 text-xs font-bold tracking-wide">
                View All →
              </Text>
            </Pressable>
              
          </View>

          <View className="px-4 gap-3">
            {firms.length === 0 ? (
              <View className="bg-white rounded-3xl p-12 border border-stone-200/60 items-center gap-3 shadow-sm">
                <View className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 items-center justify-center">
                  <Ionicons name="business-outline" size={28} color="#d6d3d1" />
                </View>
                <View className="items-center gap-1">
                  <Text className="text-stone-700 font-bold text-sm">
                    No Firms Yet
                  </Text>
                  <Text className="text-stone-400 text-xs text-center">
                    {selectedCity !== "All"
                      ? `No firms found in ${selectedCity}`
                      : "No firms available right now"}
                  </Text>
                </View>
              </View>
            ) : (
              firms.slice(0, 2).map((firm) => {
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
                    className="bg-white border border-stone-200/60 rounded-3xl overflow-hidden shadow-sm active:bg-stone-50"
                  > 

                    <View className="p-4">
                      {/* Firm identity row */}
                      <View className="flex-row items-center gap-3.5">
                        {/* ── Premium Logo Wrapper (w-14 Variant) ── */}
<View className="p-0.5 rounded-lg   border border-amber-400 shadow-sm">
  {firm.logo_url ? (
    <Image
      source={{
        uri: `${API_CONFIG.BASE_URL.replace("/api", "")}${firm.logo_url}`,
      }}
      className="w-12 h-12 rounded-lg"
      resizeMode="cover"
    />
  ) : (
    <View className="w-12 h-12 rounded-lg bg-amber-50 items-center justify-center">
      <Text className="text-amber-600 font-black text-lg tracking-widest">
        {firm.firm_name.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  )}
</View>

                        <View className="flex-1 gap-1">
                          <Text
                            className="text-stone-900 font-extrabold text-sm"
                            numberOfLines={1}
                          >
                            {firm.firm_name}
                          </Text>
                          <View className="flex-row items-center gap-1">
                            <Ionicons
                              name="location-outline"
                              size={11}
                              color="#a8a29e"
                            />
                            <Text
                              className="text-stone-400 text-xs"
                              numberOfLines={1}
                            >
                              {firm.location || "Location not set"}
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${tier.bg}`}
                        >
                          <View
                            className={`w-1.5 h-1.5 rounded-full ${tier.dot}`}
                          />
                          <Text className={`text-[10px] font-extrabold ${tier.text}`}>
                            {firm.tier}
                          </Text>
                        </View>
                      </View>

                      {/* Divider */}
                      <View className="h-px bg-stone-100 my-3.5" />

                      {/* Footer row */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View className="w-6 h-6 rounded-xl bg-stone-100 items-center justify-center">
                            <Ionicons
                              name="cube-outline"
                              size={12}
                              color="#a8a29e"
                            />
                          </View>
                          <Text className="text-stone-500 text-xs font-semibold">
                            {firm.product_count} products
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                          <Text className="text-amber-600 text-xs font-bold">
                            View Firm
                          </Text>
                          <Feather name="arrow-right" size={11} color="#d97706" />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
         {services.length > 0 && (
          <View className="gap-3">
            <View className="flex-row justify-between items-center px-5">
              <View className="flex-row items-center gap-3">
                <View className="w-1.5 h-7 rounded-full bg-amber-400" />
                <View>
                  <Text className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase">
                    On Demand
                  </Text>
                  <Text className="text-stone-900 text-base font-extrabold leading-tight -mt-0.5">
                    Services
                  </Text>
                </View>
              </View>
                <Pressable onPress={() => router.push("/(guest)/services")} className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <Text className="text-amber-600 text-xs font-bold tracking-wide">
                See All →
              </Text>
            </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            >
              {services.map((service) => (
                <View
                  key={service.id}
                  className="w-48 bg-white    border border-stone-200/60 rounded-2xl overflow-hidden "
                >
                  {/* Image */}
                  <View className="w-full h-36">
                    {service.photo_url ? (
                      <Image
                        source={{
                          uri: `${API_CONFIG.BASE_URL.replace("/api", "")}${service.photo_url}`,
                        }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full bg-stone-200 items-center justify-center">
                        <Ionicons
                          name="construct-outline"
                          size={30}
                          color="#d6d3d1"
                        />
                      </View>
                    )}
                  
                  </View>

                  {/* Info */}
                  <View className="px-3.5 pt-3 pb-4 gap-1.5">
                    <Text
                      className="text-stone-900 font-extrabold text-sm leading-snug"
                      numberOfLines={1}
                    >
                      {service.name}
                    </Text>
                    <View className="flex-row items-center justify-between">
  <View className="flex-row items-center gap-1">
    <Ionicons name="call-outline" size={11} color="#a8a29e" />
    <Text className="text-stone-400 text-xs font-medium">{service.phone}</Text>
  </View>

  <View className="bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
    <Text className="text-amber-600 text-[10px] font-bold">{service.service_type}</Text>
  </View>
</View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

    

      

      </View>
    </ScrollView>
   
  );
}