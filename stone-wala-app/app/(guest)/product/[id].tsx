import VideoModal from "@/components/ui/videomodal";
import { API_CONFIG } from "@/constants/api";
import { getProductDetails } from "@/services/guestService";
import { useGuestStore } from "@/store/guestStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const HERO_HEIGHT = 500;

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { setSelectedFirm } = useGuestStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  
  // <-- Added state for dynamic WebView height
  const [webViewHeight, setWebViewHeight] = useState(100); 

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProductDetails(Number(id));
      setProduct(response.data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [fetchDetail, id]);

  const handleCall = useCallback(() => {
    if (product?.vendor_phone) {
      Linking.openURL(`tel:${product.vendor_phone}`);
    }
  }, [product?.vendor_phone]);

  const handleWhatsApp = useCallback(() => {
    if (product?.whatsapp) {
      const message = `Hi, I found your ${product.name} on Stone Wala. Is this still available?`;
      Linking.openURL(
        `whatsapp://send?phone=91${product.whatsapp}&text=${message}`
      );
    }
  }, [product?.whatsapp, product?.name]);

  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-stone-500 text-xs tracking-widest uppercase font-medium">
          Loading
        </Text>
      </View>
    );
  }

  const baseUrl = API_CONFIG.BASE_URL.replace("/api", "");
 const imageUrl = product?.image_url || null;
const vendorLogoUrl = product?.logo_url || null;
const videoUrl: string | null = product?.video_url || null;
  const vendorInitials =
    product?.firm_name?.slice(0, 2).toUpperCase() || "SW";



  // <-- Added HTML wrapper for rich text with auto-height script
  const descriptionHtml = product?.description
    ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #78716c; /* match text-stone-500 */
              font-size: 15px;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: transparent;
              word-wrap: break-word;
            }
            strong, b { color: #1c1917; } /* text-stone-900 */
            img { max-width: 100%; height: auto; border-radius: 8px; }
            ul, ol { padding-left: 20px; margin-top: 5px; margin-bottom: 5px; }
            p { margin-top: 0; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div id="webview-content">${product.description}</div>
          <script>
            function reportHeight() {
              var height = document.getElementById('webview-content').offsetHeight;
              window.ReactNativeWebView.postMessage(height.toString());
            }
            window.onload = reportHeight;
            window.addEventListener('resize', reportHeight);
            setTimeout(reportHeight, 300); // Backup call
          </script>
        </body>
      </html>
    `
    : "";

  return (
    <View className="flex-1 bg-[#f0f9ff]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
  showsVerticalScrollIndicator={false}
  className="flex-1"
  contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
>
  {/* ── HERO ── */}
  <View style={{ height: HERO_HEIGHT }} className="relative w-full bg-[#0f3f5a]">
    {imageUrl ? (
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-full"
        resizeMode="cover"
      />
    ) : (
      <View className="w-full h-full items-center justify-center bg-[#1f5f7a]">
        <Feather name="image" size={44} color="#a0d3e6" />
        <Text className="text-[#6b9fb8] text-xs tracking-widest uppercase mt-3 font-medium">
          No Image
        </Text>
      </View>
    )}

    {/* Overlay */}
    <View className="absolute inset-0 bg-black/20" />
    <View className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-[#0f3f5a] via-black/40 to-transparent" />
    <View className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />

    {/* NAV */}
    <View
      style={{ top: insets.top + 12 }}
      className="absolute left-0 right-0 px-5 flex-row justify-between items-center"
    >
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center gap-2 bg-white/10 border border-white/20 px-4 h-10 rounded-full active:opacity-70"
      >
        <Feather name="chevron-left" size={18} color="white" />
        <Text className="text-white text-xs font-semibold tracking-wide">
          Back
        </Text>
      </Pressable>

      {videoUrl && (
        <Pressable
          onPress={() => setShowVideo(true)}
          className="flex-row items-center gap-2 bg-[#5c99b3] border border-[#3f8fb0] px-4 h-10 rounded-full active:opacity-80"
        >
          <View className="w-5 h-5 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="play" size={9} color="white" />
          </View>
          <Text className="text-white text-xs font-bold tracking-widest uppercase">
            Watch
          </Text>
        </Pressable>
      )}
    </View>
  </View>

  {/* ── BODY ── */}
  <View className="bg-[#f0f9ff] rounded-t-3xl -mt-5 px-5 pt-7">

    {/* TITLE */}
    <View className="mb-7">
      <View className="flex-row items-center gap-2 mb-3 flex-wrap">
        {product?.location && (
          <View className="flex-row items-center bg-[#e0f2fe] border border-[#dbeafe] px-3 py-1 rounded-full gap-1">
            <Ionicons name="layers" size={9} color="#5c99b3" />
            <Text className="text-[#1f5f7a] text-[9px] font-semibold tracking-wide">
              {product?.category_name || "General"}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-[#0f3f5a] text-3xl font-black leading-tight" numberOfLines={3}>
        {product?.name}
      </Text>
    </View>

    {/* SPECS */}
    <View className="flex-row gap-3 mb-8">
      
      <View className="flex-1 bg-[#e0f2fe] border border-[#dbeafe] rounded-2xl px-4 py-4 items-center">
        <Text className="text-[#6b9fb8] text-[9px] font-black uppercase tracking-widest mb-1.5">
          Type
        </Text>
        <Text className="text-[#0f3f5a] font-bold text-sm text-center" numberOfLines={2}>
          {product?.sub_category || "Premium"}
        </Text>
      </View>

      <View className="flex-1 bg-[#e0f2fe] border border-[#dbeafe] rounded-2xl px-4 py-4 items-center">
        <Text className="text-[#6b9fb8] text-[9px] font-black uppercase tracking-widest mb-1.5">
          Origin
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="location" size={11} color="#3f8fb0" />
          <Text className="text-[#0f3f5a] font-bold text-sm"  numberOfLines={1}>
            {product?.location?.split(",")[0] || "Rajasthan"}
          </Text>
        
        </View>
      </View>
    </View>

    {/* DESCRIPTION */}
    <View className="mb-9">
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-1 h-6 bg-[#5c99b3] rounded-full" />
        <Text className="text-[#0f3f5a] text-base font-black uppercase tracking-widest">
          About
        </Text>
      </View>

      {product?.description ? (
        <View style={{ height: webViewHeight, width: "100%" }}>
          <WebView
            scrollEnabled={false}
            style={{ backgroundColor: "transparent", flex: 1 }}
            source={{ html: descriptionHtml }}
            onMessage={(event) => {
              const height = Number(event.nativeEvent.data);
              if (height > 0) setWebViewHeight(height + 10);
            }}
            javaScriptEnabled
          />
        </View>
      ) : (
        <Text className="text-[#6b9fb8] text-[15px] leading-[26px]">
          Experience the timeless beauty of this premium grade stone.
        </Text>
      )}
    </View>

    <View className="h-px bg-[#dbeafe] mx-1 mb-9" />

    {/* VENDOR CARD */}
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
      className="active:opacity-80 active:scale-[0.99]"
    >
      <View className="bg-[#0f3f5a] rounded-3xl overflow-hidden mb-10">
        
        <View className="h-0.5 bg-[#5c99b3]" />

        <View className="p-5">
          
          <View className="flex-row items-center mb-5">
            
            <View className="rounded-2xl border-2 border-[#5c99b3]/40 p-1 bg-[#1f5f7a]/30">
              {vendorLogoUrl ? (
                <Image
                  source={{ uri: vendorLogoUrl }}
                  className="w-14 h-14 rounded-xl"
                />
              ) : (
                <View className="w-14 h-14 rounded-xl bg-[#5c99b3] items-center justify-center">
                  <Text className="text-white font-black text-xl">
                    {vendorInitials}
                  </Text>
                </View>
              )}
            </View>

            <View className="ml-4 flex-1">
              
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name="checkmark-circle" size={11} color="#5c99b3" />
                <Text className="text-[#a0d3e6] text-[9px] font-black uppercase tracking-widest">
                  Verified Supplier
                </Text>
              </View>

              <Text className="text-white font-black text-lg" numberOfLines={1}>
                {product?.firm_name}
              </Text>

              <View className="flex-row items-center gap-1 mt-1.5">
                <Ionicons name="location-outline" size={11} color="#6b9fb8" />
                <Text className="text-[#6b9fb8] text-xs">
                  {product?.vendor_location || "Jaipur, India"}
                </Text>
              </View>
            </View>
          </View>

          <View className="h-px bg-white/10 mb-5" />

          <Text className="text-[#6b9fb8] text-sm leading-[22px]">
            {product?.about ||
              "Providing high-quality stone solutions with years of expertise."}
          </Text>

          <View className="flex-row items-center justify-end mt-4 gap-1">
            <Text className="text-[#a0d3e6] text-[10px] font-bold uppercase tracking-widest">
              View Profile
            </Text>
            <Feather name="chevron-right" size={12} color="#5c99b3" />
          </View>
        </View>
      </View>
    </Pressable>

  </View>
</ScrollView>

      {/* ── ACTION BAR ── */}
      <View
  style={{ paddingBottom: insets.bottom + 12 }}
  className="absolute bottom-0 left-0 right-0 bg-[#f0f9ff]/95 border-t border-[#dbeafe] px-5 pt-4 flex-row items-center gap-3"
>
  {/* Call button */}
  <Pressable
    onPress={handleCall}
    className="w-14 h-14 rounded-2xl bg-[#e0f2fe] border border-[#dbeafe] items-center justify-center active:bg-[#dbeafe] active:scale-95"
  >
    <Feather name="phone" size={19} color="#1f5f7a" />
  </Pressable>

  {/* WhatsApp CTA */}
  <Pressable
    onPress={handleWhatsApp}
    className="flex-1 h-14 bg-[#1f5f7a] rounded-2xl flex-row items-center justify-center gap-2.5 active:opacity-85 active:scale-[0.98]"
  >
    <View className="w-7 h-7 rounded-full bg-[#5c99b3]/20 items-center justify-center">
      <Ionicons name="logo-whatsapp" size={16} color="#fff" />
    </View>

    <Text className="text-white font-black text-sm tracking-wide">
      Contact Seller
    </Text>
  </Pressable>
</View>

      {/* VIDEO MODAL */}
      <VideoModal
        visible={showVideo}
        videoUrl={videoUrl}
        onClose={() => setShowVideo(false)}
      />
    </View>
  );
}