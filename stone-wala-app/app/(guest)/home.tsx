import { getGuestHome, searchFirms } from "@/services/guestService";
import { useAuthStore } from "@/store/authStore";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
const { width } = Dimensions.get("window");
const CARD_WIDTH = 320;
const SPACING = 16;
const SIDE_SPACER = (width - CARD_WIDTH) / 2;
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
  const { user } = useAuthStore();
  const initials =
  user?.name
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "GU";
    const guestName = user?.name || "Guest User";

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
  
           <LinearGradient
  colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  className="px-5 pt-8 pb-7"
>
  <View className="flex-row items-center justify-between mb-6">
    
    <View className="gap-0.5">
      <Text className="text-[#a0d3e6] text-[10px] font-extrabold uppercase tracking-[3px]">
        Stone Wala
      </Text>

      <View className="flex-row items-center gap-2 mt-0.5"> 
        <Text className="text-white text-[26px] font-black tracking-tight leading-tight">
          {guestName}
        </Text>

        <View className="w-7 h-7 rounded-full bg-white/15 items-center justify-center">
          <Ionicons name="compass-outline" size={16} color="#fff" />
        </View>
      </View>
    </View>

    <View className="flex-row items-center gap-2">
      
      <Pressable
        onPress={handleLogout}
        className="flex-row items-center bg-white/10 border border-white/20 active:bg-white/20 rounded-full px-4 py-2 gap-1.5"
      >
        <Feather name="log-out" size={13} color="#a0d3e6" />
        <Text className="text-[#dbeafe] text-xs font-bold">Logout</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(guest)/room-visualizer")}
        className="h-10 w-10 rounded-full bg-[#5c99b3] items-center justify-center"
      >
        <Text className="text-white font-extrabold text-sm">
          {initials}
        </Text>
      </Pressable>

    </View>
  </View>

  {/* Search Bar */}
  <View className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 flex-row items-center gap-3">
    
    <Ionicons name="search" size={17} color="#a0d3e6" />

    <TextInput
      value={searchQuery}
      onChangeText={handleSearch}
      placeholder="Search marble, granite, firms…"
      placeholderTextColor="#cbd5f5"
      className="flex-1 text-sm text-white font-medium"
    />

    {searchQuery.length > 0 && (
      <Pressable
        onPress={clearSearch}
        className="w-6 h-6 rounded-full bg-white/20 items-center justify-center"
      >
        <Ionicons name="close" size={13} color="#e0f2fe" />
      </Pressable>
    )}

  </View>
</LinearGradient>
       

      {/* ── SEARCH RESULTS ── */}
    {showResults && (
  <View className="mx-4 mt-3 bg-[#f0f9ff] rounded-3xl border border-[#dbeafe] shadow-sm overflow-hidden">
    
    <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-[#dbeafe]">
      <Text className="text-[#5c99b3] text-xs font-bold uppercase tracking-widest">
        Search Results
      </Text>
      {searching && <ActivityIndicator size="small" color="#5c99b3" />}
    </View>

    {!hasSearchResults && !searching ? (
      <View className="px-5 py-10 items-center gap-2">
        <Ionicons name="search-outline" size={32} color="#a0d3e6" />
        <Text className="text-[#6b9fb8] text-sm font-medium">
          No results found
        </Text>
      </View>
    ) : (
      <>
        {/* Firms */}
        {searchResults.firms.length > 0 && (
          <>
            <View className="px-5 py-2 bg-[#e0f2fe] border-b border-[#dbeafe]">
              <Text className="text-[#5c99b3] text-xs font-bold uppercase tracking-widest">
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
                className={`px-5 py-4 flex-row items-center gap-3 active:bg-[#e0f2fe] ${
                  index < searchResults.firms.length - 1
                    ? "border-b border-[#dbeafe]"
                    : ""
                }`}
              >
                <View className="w-10 h-10 rounded-xl bg-[#dbeafe] items-center justify-center">
                  <Text className="text-[#1f5f7a] font-bold text-sm">
                    {firm.firm_name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text
                    className="text-[#0f3f5a] font-semibold text-sm"
                    numberOfLines={1}
                  >
                    {firm.firm_name}
                  </Text>
                  <Text className="text-[#6b9fb8] text-xs mt-0.5">
                    {firm.location || "Location not set"}
                  </Text>
                </View>

                <Feather name="chevron-right" size={16} color="#a0d3e6" />
              </Pressable>
            ))}
          </>
        )}

        {/* Services */}
        {searchResults.services.length > 0 && (
          <>
            <View className="px-5 py-2 bg-[#e0f2fe] border-t border-b border-[#dbeafe]">
              <Text className="text-[#5c99b3] text-xs font-bold uppercase tracking-widest">
                Services
              </Text>
            </View>

            {searchResults.services.map((service, index) => (
              <View
                key={service.id}
                className={`px-5 py-4 flex-row items-center gap-3 ${
                  index < searchResults.services.length - 1
                    ? "border-b border-[#dbeafe]"
                    : ""
                }`}
              >
                <View className="w-10 h-10 rounded-xl bg-[#dbeafe] items-center justify-center">
                  <Ionicons name="construct-outline" size={16} color="#3f8fb0" />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-[#0f3f5a] font-semibold text-sm"
                    numberOfLines={1}
                  >
                    {service.name}
                  </Text>
                  <Text className="text-[#6b9fb8] text-xs mt-0.5">
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
  <View className="bg-[#0f3f5a] rounded-3xl overflow-hidden border border-[#1f5f7a]/80">
    
    {/* Decorative orbs */}
    <View className="absolute right-0 top-0 w-40 h-40 bg-[#6bb6d6]/10 rounded-full -mr-16 -mt-16" />
    <View className="absolute right-10 bottom-0 w-24 h-24 bg-[#5c99b3]/10 rounded-full -mb-10" />
    <View className="absolute left-0 bottom-0 w-20 h-20 bg-[#3f8fb0]/10 rounded-full -ml-8 -mb-8" />

    <View className="p-5">
      
      <View className="flex-row items-center gap-2 mb-3">
        <View className="bg-white/10 border border-white/20 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-[#acd7e9]" />
          <Text className="text-[#d7edf5] text-[10px] font-extrabold tracking-widest uppercase">
            Premium Marketplace
          </Text>
        </View>
      </View>

      <Text className="text-white text-2xl font-black leading-tight tracking-tight mb-1">
        India's #1 Stone Marketplace
      </Text>

      <Text className="text-[#a8d3e7] text-xs leading-5 mb-5">
        Connect with verified vendors across India
      </Text>

      {/* Stats row */}
      <View className="flex-row items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3 gap-0">
        
        <View className="flex-1 items-center gap-0.5">
          <Text className="text-[#d7edf5] font-black text-lg leading-tight">
            {firms.length}+
          </Text>
          <Text className="text-[#a0d3e6] text-[10px] font-bold uppercase tracking-wide">
            Firms
          </Text>
        </View>

        <View className="w-px h-8 bg-white/20" />

        <View className="flex-1 items-center gap-0.5">
          <Text className="text-[#d7edf5] font-black text-lg leading-tight">
            {products.length}+
          </Text>
          <Text className="text-[#a0d3e6] text-[10px] font-bold uppercase tracking-wide">
            Products
          </Text>
        </View>

        <View className="w-px h-8 bg-white/20" />

        <View className="flex-1 items-center gap-0.5">
          <Text className="text-[#d7edf5] font-black text-lg leading-tight">
            {categories.length}+
          </Text>
          <Text className="text-[#a0d3e6] text-[10px] font-bold uppercase tracking-wide">
            Categories
          </Text>
        </View>

      </View>
    </View>
  </View>
</View>

      
   <View className="gap-3 py-4">
  <View className="flex-row justify-between items-center px-5">
    
    <View className="flex-row items-center gap-3">
      <View className="w-1.5 h-6 rounded-full bg-[#5c99b3]" />
      
      <View>
        <Text className="text-[10px] font-extrabold tracking-widest text-[#5c99b3] uppercase">
          Shop By
        </Text>
        <Text className="text-[#0f3f5a] text-base font-extrabold leading-tight -mt-0.3">
          Categories
        </Text>
      </View>
    </View>

    <Pressable
      onPress={() => router.push("/(guest)/categories")}
      className="bg-[#e0f2fe] border border-[#dbeafe] px-3 py-1.5 rounded-full"
    >
      <View className="flex-row items-center gap-1">
  <Text className="text-[#1f5f7a] text-xs font-bold tracking-wide">
    See All
  </Text>
 <Feather name="arrow-right" size={11} color="#3f8fb0" />
</View>
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
        className="bg-[#f0f9ff] border border-[#dbeafe] rounded-2xl shadow-sm active:bg-[#e0f2fe] active:border-[#3f8fb0] overflow-hidden mr-3"
      >
        <View className="flex-row items-center gap-3 px-3.5 py-3">
          
          {/* Icon tile */}
          <View className="w-10 h-10 rounded-xl bg-[#e0f2fe] border border-[#dbeafe] items-center justify-center shrink-0">
            <Ionicons name="layers-outline" size={18} color="#3f8fb0" />
          </View>

          {/* Text stack */}
          <View className="gap-0.5">
            <Text
              className="text-[#0f3f5a] font-extrabold text-sm"
              numberOfLines={1}
            >
              {cat.name}
            </Text>

            {cat.product_count > 0 ? (
              <View className="flex-row items-center gap-1">
                <View className="w-1 h-1 rounded-full bg-[#5c99b3]" />
                <Text className="text-[#6b9fb8] text-[10px] font-semibold">
                  {cat.product_count} products
                </Text>
              </View>
            ) : (
              <Text className="text-[#a0d3e6] text-[10px] font-medium">
                No products
              </Text>
            )}
          </View>

        </View>
      </Pressable>
    ))}
  </ScrollView>
</View>
        

       
{/* ── TRENDING PRODUCTS ── */}
<View className="gap-4 pb-5">
  {/* ── Section Header ── */}
  <View className="flex-row justify-between items-end px-5">
    
    <View className="flex-row items-center gap-3">
      <View className="w-1.5 h-7 rounded-full bg-[#5c99b3]" />
      
      <View>
        <Text className="text-[10px] font-bold tracking-widest text-[#5c99b3] uppercase">
          Discover
        </Text>
        <Text className="text-[#0f3f5a] text-xl font-extrabold leading-tight -mt-0.3">
          Trending Products
        </Text>
      </View>
    </View>
   
    <Pressable 
      onPress={() => router.push("/(guest)/all-products")} 
      className="bg-[#e0f2fe] border border-[#dbeafe] px-4 py-1.5 rounded-full mb-0.5"
    >
      <View className="flex-row items-center gap-1">
        <Text className="text-[#1f5f7a] text-xs font-bold tracking-wide">
          View All
        </Text>
        <Feather name="arrow-right" size={11} color="#3f8fb0" />
      </View>
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
      <View className="w-64 bg-[#f0f9ff] rounded-3xl border border-[#dbeafe] overflow-hidden">
        <View className="h-28 bg-[#e0f2fe] items-center justify-center">
          <View className="w-16 h-16 rounded-2xl bg-white shadow-sm items-center justify-center">
            <Ionicons name="cube-outline" size={30} color="#a0d3e6" />
          </View>
        </View>
        <View className="px-5 py-4 gap-1">
          <Text className="text-[#1f5f7a] font-bold text-sm">Nothing here yet</Text>
          <Text className="text-[#6b9fb8] text-xs">Products will appear once added.</Text>
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
          className="w-48 bg-[#f0f9ff] rounded-2xl overflow-hidden border border-[#dbeafe] shadow-sm"
        >
          {/* ── Image Block ── */}
          <View className="relative w-full h-40">
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                className="w-full h-full bg-[#e0f2fe]"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-[#e0f2fe] items-center justify-center">
                <Ionicons name="image-outline" size={32} color="#a0d3e6" />
              </View>
            )}

            {/* Dark scrim for text readability (if needed) */}
            <View className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0f3f5a]/20 to-transparent" />

            {/* Floating category chip */}
            <View className="absolute top-2 right-2 bg-white/90 border border-[#dbeafe] px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md">
              <Text
                className="text-[#1f5f7a] text-[10px] font-extrabold tracking-wide uppercase"
                numberOfLines={1}
              >
                {product.category_name}
              </Text>
            </View>
          </View>

          {/* ── Info Block ── */}
          <View className="px-3.5 pt-3 pb-4 gap-1">
            <Text
              className="text-[#0f3f5a] font-extrabold text-sm leading-snug"
              numberOfLines={1}
            >
              {product.name}
            </Text>

            <View className="flex-row items-center gap-1.5 mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#5c99b3]" />
              <Text
                className="text-[#6b9fb8] text-xs font-semibold flex-1"
                numberOfLines={1}
              >
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
        
        <View className="gap-3 ">
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
                  {/* ── FEATURED FIRMS ── */}
 <View className="gap-3 py-3">
  
  <View className="flex-row justify-between items-center px-5">
    
    <View className="flex-row items-center gap-3">
      <View className="w-1.5 h-7 rounded-full bg-[#5c99b3]" />
      
      <View>
        <Text className="text-[10px] font-extrabold tracking-widest text-[#5c99b3] uppercase">
          Verified
        </Text>

        <Text className="text-[#0f3f5a] text-base font-extrabold leading-tight -mt-0.3">
          Featured Firms
          {selectedCity !== "All" && (
            <Text className="text-[#6b9fb8] text-sm font-normal">
              {" "}in {selectedCity}
            </Text>
          )}
        </Text>
      </View>
    </View>

    <Pressable
      onPress={() => router.push("/(guest)/all-firms")}
      className="bg-[#e0f2fe] border border-[#dbeafe] px-3 py-1.5 rounded-full"
    >
      <Text className="text-[#1f5f7a] text-xs font-bold tracking-wide">
        View All <Feather name="arrow-right" size={11} color="#3f8fb0" />
      </Text>
    </Pressable>
  </View>

  <View className="mt-2">
    {firms.length === 0 ? (
      <View className="mx-4 bg-[#f0f9ff] rounded-3xl p-12 border border-[#dbeafe] items-center gap-3 shadow-sm">
        <View className="w-16 h-16 rounded-2xl bg-[#e0f2fe] border border-[#dbeafe] items-center justify-center">
          <Ionicons name="business-outline" size={28} color="#a0d3e6" />
        </View>

        <View className="items-center gap-1">
          <Text className="text-[#1f5f7a] font-bold text-sm">
            No Firms Yet
          </Text>
          <Text className="text-[#6b9fb8] text-xs text-center">
            {selectedCity !== "All"
              ? `No firms found in ${selectedCity}`
              : "No firms available right now"}
          </Text>
        </View>
      </View>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        snapToAlignment="start"
      >
        {/* 🔥 LEFT SPACER */}
        <View style={{ width: SIDE_SPACER }} />

        {firms.slice(0, 5).map((firm) => {
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
              style={{ width: CARD_WIDTH, marginRight: SPACING }}
              className="bg-[#f0f9ff] border border-[#dbeafe] rounded-3xl overflow-hidden shadow-sm active:bg-[#e0f2fe]"
            >
              <View className="p-4">
                
                <View className="flex-row items-center gap-3.5">
                  
                  <View className="p-0.5 rounded-lg border border-[#5c99b3] shadow-sm">
                    {firm.logo_url ? (
                      <Image
                        source={{ uri: firm.logo_url }}
                        className="w-12 h-12 rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-lg bg-[#e0f2fe] items-center justify-center">
                        <Text className="text-[#1f5f7a] font-black text-lg">
                          {firm.firm_name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1 gap-1">
                    <Text className="text-[#0f3f5a] font-extrabold text-sm" numberOfLines={1}>
                      {firm.firm_name}
                    </Text>

                    <View className="flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={11} color="#6b9fb8" />
                      <Text className="text-[#6b9fb8] text-xs" numberOfLines={1}>
                        {firm.location || "Location not set"}
                      </Text>
                    </View>
                  </View>

                  <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${tier.bg}`}>
                    <View className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                    <Text className={`text-[10px] font-extrabold ${tier.text}`}>
                      {firm.tier}
                    </Text>
                  </View>
                </View>

                <View className="h-px bg-[#dbeafe] my-3.5" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-6 h-6 rounded-xl bg-[#e0f2fe] items-center justify-center">
                      <Ionicons name="cube-outline" size={12} color="#6b9fb8" />
                    </View>
                    <Text className="text-[#6b9fb8] text-xs font-semibold">
                      {firm.product_count} products
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5 bg-[#e0f2fe] border border-[#dbeafe] px-3 py-1.5 rounded-xl">
                    <Text className="text-[#1f5f7a] text-xs font-bold">
                      View Firm
                    </Text>
                    <Feather name="arrow-right" size={11} color="#3f8fb0" />
                  </View>
                </View>

              </View>
            </Pressable>
          );
        })}

        {/* 🔥 RIGHT SPACER (fixes last item collapse) */}
        <View style={{ width: SIDE_SPACER }} />
      </ScrollView>
    )}
  </View>
</View>
        {services.length > 0 && (
  <View className="gap-3">
    
    <View className="flex-row justify-between items-center px-5">
      
      <View className="flex-row items-center gap-3">
        <View className="w-1.5 h-7 rounded-full bg-[#5c99b3]" />
        
        <View>
          <Text className="text-[10px] font-extrabold tracking-widest text-[#5c99b3] uppercase">
            On Demand
          </Text>
          <Text className="text-[#0f3f5a] text-base font-extrabold leading-tight -mt-0.3">
            Services
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/(guest)/services")}
        className="bg-[#e0f2fe] border border-[#dbeafe] px-3 py-1.5 rounded-full"
      >
        <Text className="text-[#1f5f7a] text-xs font-bold tracking-wide">
          See All <Feather name="arrow-right" size={11} color="#3f8fb0" />
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
          className="w-48 bg-[#f0f9ff] border border-[#dbeafe] rounded-2xl overflow-hidden"
        >
          
          {/* Image */}
          <View className="w-full h-36">
            {service.photo_url ? (
              <Image
                source={{ uri: service.photo_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-[#e0f2fe] items-center justify-center">
                <Ionicons
                  name="construct-outline"
                  size={30}
                  color="#a0d3e6"
                />
              </View>
            )}
          </View>

          {/* Info */}
          <View className="px-3.5 pt-3 pb-4 gap-1.5">
            
            <Text
              className="text-[#0f3f5a] font-extrabold text-sm leading-snug"
              numberOfLines={1}
            >
                {service.service_type}
            </Text>

            
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