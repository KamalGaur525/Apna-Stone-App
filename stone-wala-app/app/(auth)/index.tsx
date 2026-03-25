import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function LoginSelection() {

  const [loading, setLoading] = useState(false);

  const handleVendorLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      /*
      FUTURE API LOGIC (OPTIONAL)

      Example:
      const session = await checkExistingVendorSession();

      if (session) {
        router.replace("/(vendor)/dashboard");
        return;
      }
      */

      router.push("/(auth)/gst-login");

    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      /*
      FUTURE API LOGIC

      Example:
      const guestSession = await checkGuestSession();
      */

      router.push("/(auth)/guest-login");

    } finally {
      setLoading(false);
    }
  };

  return (
    
    <View className="flex-1 bg-stone-50">

      {/* ── Decorative Background Blobs ── */}
      <View className="absolute top-0 right-0 w-72 h-72 bg-amber-100 rounded-full opacity-50 -top-20 -right-20" />
      <View className="absolute w-56 h-56 bg-stone-200 rounded-full opacity-60 -bottom-10 -left-16" />

      <View className="flex-1 px-6 justify-center">

        {/* ── Brand Header ── */}
        <View className="items-center mb-12">

          {/* Monogram Logo */}
          <View className="w-20 h-20 bg-stone-900 rounded-2xl items-center justify-center mb-5 shadow-lg">
            <Text className="text-amber-400 text-3xl font-bold tracking-widest">SW</Text>
          </View>

          {/* App Name */}
          <Text className="text-4xl font-bold text-stone-900 tracking-tight">
            Stone Wala
          </Text>

          {/* Gold Accent Divider */}
          <View className="flex-row items-center mt-3 mb-4 gap-2">
            <View className="h-px w-10 bg-amber-400" />
            <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <View className="h-px w-10 bg-amber-400" />
          </View>

          {/* Tagline */}
          <Text className="text-stone-500 text-sm text-center leading-6 px-6">
            India's Marketplace for{"\n"}Marble, Granite & Stone
          </Text>
        </View>

        {/* ── Login Card ── */}
        <View className="bg-white rounded-3xl p-6 border border-stone-100 shadow-md">

          {/* Card Label */}
          <Text className="text-stone-400 text-xs font-semibold tracking-widest uppercase text-center mb-6">
            Choose Login Type
          </Text>

          {/* GST Login — Primary CTA */}
          <Pressable
            onPress={handleVendorLogin}
            className="bg-stone-900 rounded-2xl py-4 px-5 mb-3 active:opacity-80"
          >
            <Text className="text-white text-center text-base font-bold tracking-wide">
              GST Login
            </Text>
            <Text className="text-stone-400 text-center text-xs mt-1 font-medium">
              For Verified Sellers & Vendors
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-3 gap-3">
            <View className="flex-1 h-px bg-stone-100" />
            <Text className="text-stone-400 text-xs font-semibold">OR</Text>
            <View className="flex-1 h-px bg-stone-100" />
          </View>

          {/* Guest Mode — Secondary CTA */}
          <Pressable
            onPress={handleGuestLogin}
            className="bg-stone-50 rounded-2xl py-4 px-5 active:opacity-70 border border-stone-200"
          >
            <Text className="text-stone-800 text-center text-base font-bold tracking-wide">
              Continue as Guest
            </Text>
            <Text className="text-stone-400 text-center text-xs mt-1 font-medium">
              Browse marketplace without account
            </Text>
          </Pressable>

        </View>

        {/* ── Trust Badges ── */}
        <View className="flex-row justify-center items-center mt-6 gap-3">
          <View className="flex-row items-center gap-1">
            <Text className="text-amber-500 text-xs font-bold">✓</Text>
            <Text className="text-stone-400 text-xs">GST Verified</Text>
          </View>
          <View className="w-px h-3 bg-stone-300" />
          <View className="flex-row items-center gap-1">
            <Text className="text-amber-500 text-xs font-bold">✓</Text>
            <Text className="text-stone-400 text-xs">Secure & Trusted</Text>
          </View>
          <View className="w-px h-3 bg-stone-300" />
          <View className="flex-row items-center gap-1">
            <Text className="text-amber-500 text-xs font-bold">✓</Text>
            <Text className="text-stone-400 text-xs">Made in India</Text>
          </View>
        </View>

      </View>

      {/* ── Footer ── */}
      <View className="pb-8 px-6 flex-row justify-between items-center">
        <Text className="text-stone-400 text-xs">Powered by JKG & Sons</Text>
        <View className="w-px h-3 bg-stone-300" />
        <Text className="text-stone-400 text-xs">Owned by Aman Garg</Text>
      </View>

    </View>
  );
}