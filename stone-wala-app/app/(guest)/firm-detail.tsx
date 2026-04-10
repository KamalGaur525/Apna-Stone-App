import { getFirmDetail } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

interface FirmData {
  id: number;
  firm_name: string;
  tier: string;
  location: string | null;
  logo_url: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
    about: string | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
}

interface Product {
  id: number;
  name: string;
  image_url: string | null;
  sub_category: string | null;
  description: string | null;
  category_name: string;
}

// ✅ 1. Helper Function to Remove HTML Tags for the Preview
const stripHtmlTags = (htmlString: string | null) => {
  if (!htmlString) return "";
  return htmlString
    .replace(/<br\s*[\/]?>/gi, " ") // Replace <br> with space
    .replace(/<\/p>/gi, " ") // Replace closing </p> with space
    .replace(/<[^>]+>/g, "") // Remove all other HTML tags
    .replace(/&nbsp;/g, " ") // Replace HTML space entity
    .replace(/&amp;/g, "&") // Replace HTML ampersand entity
    .trim();
};

export default function FirmDetail() {
  const { selectedFirm } = useGuestStore();

  const [firm, setFirm] = useState<FirmData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedFirm?.id) {
      fetchFirmDetail();
    } else if (selectedFirm) {
      setFirm({
        id: 0,
        firm_name: selectedFirm.name,
        tier: "",
        location: selectedFirm.city || null,
        logo_url: selectedFirm.image || null,
        phone: selectedFirm.phone || "",
        whatsapp: selectedFirm.phone || null,
        email: selectedFirm.email || null,
         about: selectedFirm.about || null,
        instagram: null,
        facebook: null,
        website: null,
      });
      setLoading(false);
    } else {
      router.back();
    }
  }, []);

  const fetchFirmDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getFirmDetail(Number(selectedFirm?.id));
      setFirm(res.data.firm);
      setProducts(res.data.products || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load firm.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFirmDetail();
    setRefreshing(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
       case "Stone Seller":
      return {
        bg: "bg-[#5c99b3]",      // your primary blue
        text: "text-white"
      };

    case "Factory":
     return {
        bg: "bg-[#ffff]",   // sky blue (lighter, tech feel)
        text: "text-[#0369a1]"
      };

    case "Godown":
      return {
        bg: "bg-[#ffff]",   // emerald green (trust + logistics vibe)
        text: "text-[#059669]"
      };

    default:
      return {
        bg: "bg-[#64748b]/20",   // neutral slate
        text: "text-[#334155]",
       
      };
  }
};

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-stone-500 text-sm">Loading firm…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error || !firm) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-8">
        <Text className="text-stone-900 font-bold text-xl mb-2">
          Something went wrong
        </Text>
        <Text className="text-stone-400 text-sm text-center mb-8">{error}</Text>
        <Pressable
          onPress={fetchFirmDetail}
          className="bg-amber-500 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-white font-bold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const tier = getTierColor(firm.tier);
  const initials = firm.firm_name.slice(0, 2).toUpperCase();

  const openURL = async (url: string) => {
    try {
      const formatted = url.startsWith("http") ? url : `https://${url}`;
      await Linking.openURL(formatted);
    } catch {
      Alert.alert("Error", "Could not open this link.");
    }
  };

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
                className=" p-6"
              >
        <Pressable
    onPress={() => router.back()}
    className="flex-row items-center self-start bg-white/10 border border-white/20 active:bg-white/20 rounded-full px-4 py-2 mb-8 gap-2"
  >
     <Ionicons name="arrow-back" size={16} color="white" />
    <Text className="text-white text-sm font-semibold tracking-wide">Back</Text>
  </Pressable>

        <View className="flex-row items-center gap-4">
          <View className="p-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 shadow-sm">
            {firm.logo_url ? (
              <Image
                source={{ uri:  firm.logo_url }}
                className="w-16 h-16 rounded-lg bg-stone-100"
                resizeMode="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-2xl bg-[#6bb6d6] items-center justify-center">
                <Text className="text-white text-2xl font-bold tracking-widest shadow-sm">
                  {initials}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-white text-xl font-bold" numberOfLines={2}>
              {firm.firm_name}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={12} color="#fff" />
              <Text className="text-sky-50 text-xs" numberOfLines={1}>
                {firm.location || "Location not set"}
              </Text>
            </View>
            {firm.tier ? (
              <View className={`self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-full mt-1 ${tier.bg}`}>
                <Text className={`text-xs font-bold ${tier.text}`}>{firm.tier}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats */}
       <View className="flex-row items-center gap-4 mt-5 bg-[#ffffff3b] rounded-2xl px-4 py-3">
  
  <View className="flex-row items-center gap-1.5 flex-1">
    <Ionicons name="cube-outline" size={14} color="#ffffff" />
    <Text className="text-white text-xs font-semibold">
      {products.length} Products
    </Text>
  </View>

  <View className="w-px h-4 bg-[#ffffff]" />

  <View className="flex-row items-center gap-1.5 flex-1">
    <Ionicons name="checkmark-circle-outline" size={14} color="#ffffff" />
    <Text className="text-[#ffffff] text-xs font-semibold">
      Verified
    </Text>
  </View>

  <View className="w-px h-4 bg-[#ffffff]" />

  <View className="flex-row items-center gap-1.5 flex-1">
    <Ionicons name="shield-checkmark-outline" size={14} color="#ffffff" />
    <Text className="text-white text-xs font-semibold">
      Trusted
    </Text>
  </View>

</View>
      </LinearGradient>

      <View className="px-4 py-5 gap-4">

        {/* ── CONTACT CARD ── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-4 pb-3 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-sky-300" />
            <Text className="text-stone-500 text-[10px] font-extrabold tracking-widest uppercase">
              Contact
            </Text>
          </View>

          <View className="flex-row gap-3 p-4">
            <Pressable
              onPress={() => Linking.openURL(`tel:${firm.phone}`)}
              className="flex-1 bg-stone-900 active:bg-stone-800 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="call" size={15} color="white" />
              <Text className="text-white text-xs font-extrabold" numberOfLines={1}>
                {firm.phone}
              </Text>
            </Pressable>

            <Pressable
  onPress={() =>
    Linking.openURL(`https://wa.me/91${firm.whatsapp || firm.phone}`)
  }
  className="flex-1 bg-[#25D366] active:bg-[#1ebe5d] rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-md shadow-green-500/20"
>
  <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
  <Text className="text-white text-xs font-extrabold tracking-wide">
    WhatsApp
  </Text>
</Pressable>
          </View>

          {firm.email && (
            <>
              <View className="h-px bg-stone-100 mx-5" />
              <Pressable
  onPress={() => Linking.openURL(`mailto:${firm.email}`)}
  className="flex-row items-center px-5 py-4 gap-3.5 active:bg-[#f0f9ff]"
>
  {/* Email Icon */}
  <View className="w-10 h-10 bg-[#e0f2fe] rounded-xl items-center justify-center border border-[#dbeafe]">
    <Ionicons name="mail" size={17} color="#3f8fb0" />
  </View>

  {/* Email Text */}
  <Text
    className="text-[#0f3f5a] text-sm font-semibold flex-1"
    numberOfLines={1}
  >
    {firm.email}
  </Text>

  {/* Arrow */}
  <View className="w-7 h-7 rounded-xl bg-[#e0f2fe] items-center justify-center">
    <Feather name="chevron-right" size={13} color="#3f8fb0" />
  </View>
</Pressable>
            </>
          )}

          {firm.location && (
            <>
              <View className="h-px bg-stone-100 mx-5" />
             <Pressable
  onPress={() => openURL(`http://maps.google.com/?q=${firm.location}`)}
  className="flex-row items-center px-5 py-4 gap-3.5 active:bg-[#f0f9ff]"
>
  {/* Colorful Location Icon */}
  <View className="w-10 h-10 bg-[#e0f2fe] rounded-xl items-center justify-center border border-[#dbeafe]">
    <Ionicons name="location" size={18} color="#3b82f6" />
  </View>

  <Text
    className="text-[#0f3f5a] text-sm font-semibold flex-1"
    numberOfLines={1}
  >
    {firm.location}
  </Text>

  <View className="w-7 h-7 rounded-xl bg-[#e0f2fe] items-center justify-center">
    <Feather name="chevron-right" size={13} color="#3f8fb0" />
  </View>
</Pressable>
            </>
          )}
        </View>

        {/* ── SOCIAL LINKS ── */}
        {(firm.facebook || firm.instagram || firm.website) && (
          <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm p-4">
            <View className="flex-row gap-3">
              {firm.facebook && (
                <Pressable
                  onPress={() => openURL(firm.facebook!)}
                  className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl py-3 items-center gap-1 active:opacity-80"
                >
                  <Ionicons name="logo-facebook" size={18} color="#3b82f6" />
                  <Text className="text-blue-600 text-xs font-bold">Facebook</Text>
                </Pressable>
              )}
              {firm.instagram && (
                <Pressable
                  onPress={() => openURL(firm.instagram!)}
                  className="flex-1 bg-pink-50 border border-pink-100 rounded-2xl py-3 items-center gap-1 active:opacity-80"
                >
                  <Ionicons name="logo-instagram" size={18} color="#ec4899" />
                  <Text className="text-pink-600 text-xs font-bold">Instagram</Text>
                </Pressable>
              )}
              {firm.website && (
                <Pressable
                  onPress={() => openURL(firm.website!)}
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl py-3 items-center gap-1 active:opacity-80"
                >
                  <Ionicons name="globe-outline" size={18} color="#78716c" />
                  <Text className="text-stone-600 text-xs font-bold">Website</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
{/* ── ABOUT ── */}
{firm.about && (
  <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
    <View className="px-5 pt-4 pb-3 flex-row items-center gap-2.5">
      <View className="w-1.5 h-5 rounded-full bg-sky-300" />
      <Text className="text-stone-500 text-[10px] font-extrabold tracking-widest uppercase">
        About
      </Text>
    </View>
    <View className="h-px bg-stone-100 mx-5" />
    <View className="px-5 py-4">
      <Text className="text-stone-600 text-sm leading-6">
        {stripHtmlTags(firm.about)}
      </Text>
    </View>
  </View>
)}
        

        {/* ── PRODUCTS ── */}
      <View className="gap-3 py-3">
  
  {/* Header */}
  <View className="flex-row items-center gap-3">
    <View className="w-1.5 h-7 rounded-full bg-[#5c99b3]" />
    
    <View>
      <Text className="text-[10px] font-extrabold tracking-widest text-[#5c99b3] uppercase">
        Catalogue
      </Text>
      <Text className="text-[#0f3f5a] text-base font-extrabold leading-tight -mt-0.5">
        Products ({products.length})
      </Text>
    </View>
  </View>

  {products.length === 0 ? (
    <View className="bg-[#f0f9ff] rounded-3xl border border-[#dbeafe] p-12 items-center gap-3 shadow-sm">
      
      <View className="w-16 h-16 rounded-2xl bg-[#e0f2fe] border border-[#dbeafe] items-center justify-center">
        <Ionicons name="cube-outline" size={28} color="#a0d3e6" />
      </View>

      <View className="items-center gap-1">
        <Text className="text-[#1f5f7a] font-bold text-sm">
          No Products Yet
        </Text>
        <Text className="text-[#6b9fb8] text-xs text-center">
          This firm hasn't added any products.
        </Text>
      </View>
    </View>
  ) : (
    <View className="flex-row flex-wrap justify-between">
      
      {products.map((product) => (
        <Pressable
          key={product.id}
          onPress={() => router.push(`/(guest)/product/${product.id}`)}
          className="w-[48%] mb-3 bg-[#f0f9ff] border border-[#dbeafe] rounded-3xl overflow-hidden shadow-sm"
        >
          
          {/* Image */}
          <View className="w-full h-40">
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-[#e0f2fe] items-center justify-center">
                <Ionicons name="image-outline" size={40} color="#a0d3e6" />
              </View>
            )}

            {/* Category Badge */}
            <View className="absolute top-3 right-3 bg-[#5c99b3] px-2.5 py-1 rounded-full">
              <Text className="text-white text-[9px] font-extrabold tracking-widest uppercase">
                {product.category_name}
              </Text>
            </View>
          </View>

          {/* Info */}
          <View className="px-3 pt-3 pb-4 gap-2">
            
           <View className="flex-row items-center gap-2">
  
  <Text
    className="text-[#0f3f5a] font-extrabold text-sm leading-snug flex-1"
    numberOfLines={1}
  >
    {product.name}
  </Text>

  {product.sub_category && (
    <View className="flex-row items-center gap-1 shrink-0">
      <View className="w-1.5 h-1.5 rounded-full bg-[#5c99b3]" />
      <Text className="text-[#6b9fb8] text-xs font-semibold">
        {product.sub_category}
      </Text>
    </View>
  )}

</View>

            {/* {product.description && (
              <>
                <View className="h-px bg-[#dbeafe]" />
                <Text
                  className="text-[#6b9fb8] text-xs leading-5"
                  numberOfLines={2}
                >
                  {stripHtmlTags(product.description)}
                </Text>
              </>
            )} */}

          </View>

        </Pressable>
      ))}

    </View>
  )}
</View>
      </View>
    </ScrollView>
  );
}