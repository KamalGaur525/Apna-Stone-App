import { getFirmDetail } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
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
      case "Stone Seller": return { bg: "bg-amber-500", text: "text-white" };
      case "Factory": return { bg: "bg-amber-50", text: "text-amber-600" };
      case "Godown": return { bg: "bg-amber-500/15", text: "text-amber-600" };
      default: return { bg: "bg-stone-400", text: "text-white" };
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
      <View className="bg-stone-950 px-5 pt-14 pb-8">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 mb-8 gap-1.5"
        >
          <Text className="text-amber-600 text-sm">←</Text>
          <Text className="text-amber-600 text-sm font-semibold">Back</Text>
        </Pressable>

        <View className="flex-row items-center gap-4">
          <View className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
            {firm.logo_url ? (
              <Image
                source={{ uri:  firm.logo_url }}
                className="w-16 h-16 rounded-lg bg-stone-100"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-lg bg-amber-50 items-center justify-center">
                <Text className="text-amber-600 font-black text-xl tracking-widest">
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
              <Ionicons name="location-outline" size={12} color="#a8a29e" />
              <Text className="text-stone-400 text-xs" numberOfLines={1}>
                {firm.location || "Location not set"}
              </Text>
            </View>
            {firm.tier ? (
              <View className={`self-start flex-row items-center gap-1.5 px-2.5 py-1 rounded-full mt-0.5 ${tier.bg}`}>
                <Text className={`text-xs font-bold ${tier.text}`}>{firm.tier}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row items-center gap-4 mt-5 bg-stone-900 rounded-2xl px-4 py-3">
          <View className="flex-row items-center gap-1.5 flex-1">
            <Ionicons name="cube-outline" size={14} color="#f59e0b" />
            <Text className="text-white text-xs font-semibold">
              {products.length} Products
            </Text>
          </View>
          <View className="w-px h-4 bg-stone-700" />
          <View className="flex-row items-center gap-1.5 flex-1">
            <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
            <Text className="text-white text-xs font-semibold">Verified</Text>
          </View>
          <View className="w-px h-4 bg-stone-700" />
          <View className="flex-row items-center gap-1.5 flex-1">
            <Ionicons name="shield-checkmark-outline" size={14} color="#3b82f6" />
            <Text className="text-white text-xs font-semibold">Trusted</Text>
          </View>
        </View>
      </View>

      <View className="px-4 py-5 gap-4">

        {/* ── CONTACT CARD ── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-4 pb-3 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-amber-400" />
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
              className="flex-1 bg-emerald-500 active:bg-emerald-600 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="logo-whatsapp" size={15} color="white" />
              <Text className="text-white text-xs font-extrabold">WhatsApp</Text>
            </Pressable>
          </View>

          {firm.email && (
            <>
              <View className="h-px bg-stone-100 mx-5" />
              <Pressable
                onPress={() => Linking.openURL(`mailto:${firm.email}`)}
                className="flex-row items-center px-5 py-4 gap-3.5 active:bg-stone-50"
              >
                <View className="w-10 h-10 bg-stone-100 rounded-xl items-center justify-center">
                  <Ionicons name="mail-outline" size={16} color="#78716c" />
                </View>
                <Text className="text-stone-700 text-sm font-semibold flex-1" numberOfLines={1}>
                  {firm.email}
                </Text>
                <View className="w-7 h-7 rounded-xl bg-stone-100 items-center justify-center">
                  <Feather name="chevron-right" size={13} color="#a8a29e" />
                </View>
              </Pressable>
            </>
          )}

          {firm.location && (
            <>
              <View className="h-px bg-stone-100 mx-5" />
              <Pressable
                onPress={() => openURL(`http://maps.google.com/?q=${firm.location}`)}
                className="flex-row items-center px-5 py-4 gap-3.5 active:bg-stone-50"
              >
                <View className="w-10 h-10 bg-stone-100 rounded-xl items-center justify-center">
                  <Ionicons name="location-outline" size={16} color="#78716c" />
                </View>
                <Text className="text-stone-700 text-sm font-semibold flex-1" numberOfLines={1}>
                  {firm.location}
                </Text>
                <View className="w-7 h-7 rounded-xl bg-stone-100 items-center justify-center">
                  <Feather name="chevron-right" size={13} color="#a8a29e" />
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
      <View className="w-1.5 h-5 rounded-full bg-amber-400" />
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
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-1.5 h-7 rounded-full bg-amber-400" />
            <View>
              <Text className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase">
                Catalogue
              </Text>
              <Text className="text-stone-900 text-base font-extrabold leading-tight -mt-0.5">
                Products ({products.length})
              </Text>
            </View>
          </View>

          {products.length === 0 ? (
            <View className="bg-white rounded-3xl border border-stone-100 p-12 items-center gap-3 shadow-sm">
              <View className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-100 items-center justify-center">
                <Ionicons name="cube-outline" size={28} color="#d6d3d1" />
              </View>
              <View className="items-center gap-1">
                <Text className="text-stone-700 font-bold text-sm">No Products Yet</Text>
                <Text className="text-stone-400 text-xs text-center">
                  This firm hasn't added any products.
                </Text>
              </View>
            </View>
          ) : (
            <View className="gap-3">
              {products.map((product) => (
                <Pressable
          key={product.id}
          onPress={() => router.push(`/(guest)/product/${product.id}`)}
                  className="bg-white border border-stone-100/80 rounded-3xl overflow-hidden shadow-md"
                >
                  <View className="w-full h-52">
                    {product.image_url ? (
                      <Image
                        source={{
                          uri:  product.image_url,
                        }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full bg-stone-100 items-center justify-center">
                        <Ionicons name="image-outline" size={40} color="#e7e5e4" />
                      </View>
                    )}
                    <View className="absolute top-3 right-3 bg-amber-400 px-2.5 py-1 rounded-full">
                      <Text className="text-white text-[9px] font-extrabold tracking-widest uppercase">
                        {product.category_name}
                      </Text>
                    </View>
                  </View>

                  <View className="px-4 pt-3.5 pb-4 gap-2">
                    <Text
                      className="text-stone-900 font-extrabold text-base leading-snug"
                      numberOfLines={2}
                    >
                      {product.name}
                    </Text>
                    {product.sub_category && (
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <Text className="text-stone-400 text-xs font-semibold">
                          {product.sub_category}
                        </Text>
                      </View>
                    )}
                    {product.description && (
                      <>
                        <View className="h-px bg-stone-100" />
                        <Text
                          className="text-stone-500 text-sm leading-5"
                          numberOfLines={2}
                        >
                          {/* ✅ 3. Applied stripHtmlTags here for product description */}
                          {stripHtmlTags(product.description)}
                        </Text>
                      </>
                    )}
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