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
import { WebView } from "react-native-webview"; // <-- Added WebView import

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
  const imageUrl = product?.image_url
    ? `${baseUrl}${product.image_url}`
    : null;
  const vendorLogoUrl = product?.logo_url
    ? `${baseUrl}${product.logo_url}`
    : null;
  const vendorInitials =
    product?.firm_name?.slice(0, 2).toUpperCase() || "SW";

  const videoUrl: string | null = product?.video_url
    ? `${baseUrl}${product.video_url}`
    : null;

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
    <View className="flex-1 bg-stone-950">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
      >
        {/* ── HERO ── */}
        <View style={{ height: HERO_HEIGHT }} className="relative w-full bg-stone-900">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center bg-stone-800">
              <Feather name="image" size={44} color="#44403c" />
              <Text className="text-stone-600 text-xs tracking-widest uppercase mt-3 font-medium">
                No Image
              </Text>
            </View>
          )}

          {/* Cinematic dark vignette gradient */}
          <View className="absolute inset-0 bg-black/20" />
          <View className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-stone-950 via-black/60 to-transparent" />
          <View className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />

          {/* NAV BAR */}
          <View
            style={{ top: insets.top + 12 }}
            className="absolute left-0 right-0 px-5 flex-row justify-between items-center"
          >
            {/* Back button — frosted glass pill */}
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center gap-2 bg-black/40 border border-white/15 px-4 h-10 rounded-full active:opacity-70"
            >
              <Feather name="chevron-left" size={18} color="white" />
              <Text className="text-white text-xs font-semibold tracking-wide">
                Back
              </Text>
            </Pressable>

            {/* Video CTA — amber accent pill */}
            {videoUrl && (
              <Pressable
                onPress={() => setShowVideo(true)}
                className="flex-row items-center gap-2 bg-amber-500 border border-amber-400/50 px-4 h-10 rounded-full active:opacity-80"
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
        <View className="bg-white rounded-t-3xl -mt-5 px-5 pt-7">

          {/* ── TITLE BLOCK ── */}
          <View className="mb-7">
            <View className="flex-row items-center gap-2 mb-3 flex-wrap">
            
              {product?.location && (
                <View className="flex-row items-center bg-stone-100 border border-stone-200 px-3 py-1 rounded-full gap-1">
                 
                   <Ionicons name="layers" size={9} color="#f59e0b" />
                  <Text className="text-stone-600 text-[9px] font-semibold tracking-wide">
                      {product?.category_name || "General"}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-stone-900 text-3xl font-black leading-tight" numberOfLines={3}>
              {product?.name}
            </Text>
          </View>

          {/* ── SPECS STRIP ── */}
          <View className="flex-row gap-3 mb-8">
            {/* Type chip */}
            <View className="flex-1 bg-stone-50 border border-stone-100 rounded-2xl px-4 py-4 items-center">
              <Text className="text-stone-400 text-[9px] font-black uppercase tracking-widest mb-1.5">
                Type
              </Text>
              <Text className="text-stone-900 font-bold text-sm text-center" numberOfLines={2}>
                {product?.sub_category || "Premium"}
              </Text>
            </View>

            {/* Origin chip */}
            <View className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-4 items-center">
              <Text className="text-amber-500/70 text-[9px] font-black uppercase tracking-widest mb-1.5">
                Origin
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="location" size={11} color="#f59e0b" />
                <Text className="text-stone-900 font-bold text-sm" numberOfLines={1}>
                  {product?.location?.split(",")[0] || "Rajasthan"}
                </Text>
              </View>
            </View>
          </View>

          {/* ── DESCRIPTION ── */}
          <View className="mb-9">
            {/* Section header */}
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-1 h-6 bg-amber-500 rounded-full" />
              <Text className="text-stone-900 text-base font-black uppercase tracking-widest">
                About
              </Text>
            </View>

            {/* <-- Replaced Text component with Dynamic Height WebView --> */}
            {product?.description ? (
              <View style={{ height: webViewHeight, width: '100%' }}>
                <WebView
                  scrollEnabled={false} // Disable inner scroll so it acts like normal text
                  style={{ backgroundColor: "transparent", flex: 1 }}
                  source={{ html: descriptionHtml }}
                  onMessage={(event) => {
                    const height = Number(event.nativeEvent.data);
                    if (height > 0) {
                      setWebViewHeight(height + 10); // Adding 10px buffer
                    }
                  }}
                  javaScriptEnabled={true}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : (
              <Text className="text-stone-500 text-[15px] leading-[26px] font-normal">
                Experience the timeless beauty of this premium grade stone, sourced and crafted with unmatched precision.
              </Text>
            )}
          </View>

          {/* ── THIN RULE ── */}
          <View className="h-px bg-stone-100 mx-1 mb-9" />

          {/* ── VENDOR CARD ── */}
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
          <View className="bg-stone-950 rounded-3xl overflow-hidden mb-10">
            {/* Amber accent bar at top */}
            <View className="h-0.5 bg-amber-500" />

            <View className="p-5">
              {/* Vendor header row */}
              <View className="flex-row items-center mb-5">
                {/* Logo / Initials */}
                <View className="rounded-2xl border-2 border-amber-500/30 p-1 bg-amber-500/10">
                  {vendorLogoUrl ? (
                    <Image
                      source={{ uri: vendorLogoUrl }}
                      className="w-14 h-14 rounded-xl"
                    />
                  ) : (
                    <View className="w-14 h-14 rounded-xl bg-amber-500 items-center justify-center">
                      <Text className="text-white font-black text-xl tracking-tight">
                        {vendorInitials}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="ml-4 flex-1">
                  {/* Verified badge */}
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Ionicons name="checkmark-circle" size={11} color="#f59e0b" />
                    <Text className="text-amber-500 text-[9px] font-black uppercase tracking-widest">
                      Verified Supplier
                    </Text>
                  </View>

                  <Text
                    className="text-white font-black text-lg leading-tight"
                    numberOfLines={1}
                  >
                    {product?.firm_name}
                  </Text>

                  <View className="flex-row items-center gap-1 mt-1.5">
                    <Ionicons name="location-outline" size={11} color="#78716c" />
                    <Text className="text-stone-400 text-xs font-medium" numberOfLines={1}>
                      {product?.vendor_location || "Jaipur, India"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View className="h-px bg-white/8 mb-5" />

              {/* About text */}
              <Text className="text-stone-400 text-sm leading-[22px]">
                {product?.about ||
                  "Providing high-quality stone solutions with years of expertise and craftsmanship."}
              </Text>

              {/* Tap hint */}
              <View className="flex-row items-center justify-end mt-4 gap-1">
                <Text className="text-amber-500/70 text-[10px] font-bold uppercase tracking-widest">
                  View Profile
                </Text>
                <Feather name="chevron-right" size={12} color="#f59e0b" />
              </View>
            </View>
          </View>
          </Pressable>

        </View>
      </ScrollView>

      {/* ── ACTION BAR ── */}
      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-stone-100/80 px-5 pt-4 flex-row items-center gap-3"
      >
        {/* Call button — outlined square icon */}
        <Pressable
          onPress={handleCall}
          className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 items-center justify-center active:bg-stone-200 active:scale-95"
        >
          <Feather name="phone" size={19} color="#1c1917" />
        </Pressable>

        {/* WhatsApp CTA — full width pill */}
        <Pressable
          onPress={handleWhatsApp}
          className="flex-1 h-14 bg-stone-950 rounded-2xl flex-row items-center justify-center gap-2.5 active:opacity-85 active:scale-[0.98]"
        >
          <View className="w-7 h-7 rounded-full bg-amber-500/20 items-center justify-center">
            <Ionicons name="logo-whatsapp" size={16} color="#fbbf24" />
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