import { getVendorProfile } from "@/services/vendorService";
import { useAuthStore } from "@/store/authStore";
import { useVendorStore } from "@/store/vendorStore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const APP_VERSION = "1.0.0";

export default function Settings() {
  const { logout } = useAuthStore();
  const { subscription } = useVendorStore();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getVendorProfile();
      setProfile(res.data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
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

  const initials =
    profile?.firm_name
      ?.split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SV";

  return (
    <ScrollView
      className="flex-1 bg-stone-50"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header — Black ── */}
     
         <LinearGradient
               colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
               start={{ x: 0, y: 0 }}
               end={{ x: 0, y: 1 }}
               className=" px-6 pt-11 pb-7 flex-row items-center justify-between"
             >
  <View className="flex-row items-center gap-2.5">
    <View className="w-1.5 h-6 rounded-full bg-white/75" />
    <Text className="text-white text-2xl font-bold tracking-tight">
      Settings
    </Text>
  </View>

   <Pressable
    onPress={() => router.back()}
    className="flex-row items-center self-start bg-white/10 border border-white/20 active:bg-white/20 rounded-full px-4 py-2  gap-2"
  >
     <Ionicons name="arrow-back" size={16} color="white" />
    <Text className="text-white text-sm font-semibold tracking-wide">Back</Text>
  </Pressable>
</LinearGradient>

      <View className="px-5 gap-4 pb-10 pt-5">

        {/* ── Profile Card ── */}
        <View className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm">
          {loading ? (
            <ActivityIndicator color="#f59e0b" />
          ) : (
            <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 rounded-2xl bg-[#3f8fb0] items-center justify-center">
                <Text className="text-white text-xl font-extrabold">{initials}</Text>
              </View>

              <View className="flex-1 gap-1">
                <Text className="text-stone-900 font-bold text-base" numberOfLines={1}>
                  {profile?.firm_name || "Stone Vendor"}
                </Text>
                <Text className="text-stone-400 text-sm">
                  +91 {profile?.phone || "—"}
                </Text>
                <View className="self-start bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full mt-0.5">
                  <Text className="text-sky-600 text-xs font-bold">
                    {profile?.tier || "—"}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push("/(vendor)/firm-profile")}
                className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center active:opacity-70"
              >
                <Feather name="edit-2" size={15} color="#78716c" />
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Subscription Card ── */}
        <View className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-[#3f8fb0]" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Subscription
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5" />

          <View className="px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
               <Ionicons name="diamond-outline" size={16} color="#78716c" />
              </View>
              <View>
                <Text className="text-stone-900 text-sm font-semibold">
                  {subscription.isActive
                    ? `${subscription.planName} Plan`
                    : "No Active Plan"}
                </Text>
                <Text className="text-stone-400 text-xs mt-0.5">
                  {subscription.isActive ? "Active" : "Subscribe to sell"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push("/(vendor)/subscription")}
              className="bg-[#3f8fb0] active:bg-[#1f5f7a] px-3 py-1.5 rounded-xl"
            >
              <Text className="text-white text-xs font-bold">
                {subscription.isActive ? "Manage" : "Subscribe"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Account Section ── */}
        <View className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-[#3f8fb0]" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Account
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5" />

          <Pressable
            onPress={() => router.push("/(vendor)/firm-profile")}
            className="flex-row items-center justify-between px-5 py-4 active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Ionicons name="person-outline" size={17} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#a8a29e" />
          </Pressable>

          <View className="h-px bg-stone-100 mx-5" />

          <Pressable
            onPress={() => router.push("/(vendor)/my-products")}
            className="flex-row items-center justify-between px-5 py-4 active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Ionicons name="cube-outline" size={17} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">My Products</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#a8a29e" />
          </Pressable>
        </View>

        {/* ── Support Section ── */}
        <View className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-[#3f8fb0]" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Support
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5" />

          <Pressable
            onPress={() => Linking.openURL("https://stonewala.in/privacy")}
            className="flex-row items-center justify-between px-5 py-4 active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Feather name="shield" size={16} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">Privacy Policy</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#a8a29e" />
          </Pressable>

          <View className="h-px bg-stone-100 mx-5" />

          <Pressable
            onPress={() => Linking.openURL("https://stonewala.in/terms")}
            className="flex-row items-center justify-between px-5 py-4 active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Feather name="file-text" size={16} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">Terms of Service</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#a8a29e" />
          </Pressable>

          <View className="h-px bg-stone-100 mx-5" />

          <Pressable
            onPress={() => Linking.openURL("mailto:support@stonewala.in")}
            className="flex-row items-center justify-between px-5 py-4 active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Feather name="mail" size={16} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">Contact Us</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#a8a29e" />
          </Pressable>
        </View>

        {/* ── App Info ── */}
        <View className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-[#3f8fb0]" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              App
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5" />

          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Feather name="info" size={16} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">Version</Text>
            </View>
            <Text className="text-stone-400 text-sm font-semibold">
              v{APP_VERSION}
            </Text>
          </View>

          <View className="h-px bg-stone-100 mx-5" />

          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-stone-100 rounded-xl items-center justify-center">
                <Ionicons name="business-outline" size={20} color="#78716c" />
              </View>
              <Text className="text-stone-900 text-sm font-semibold">Powered by</Text>
            </View>
            <Text className="text-stone-400 text-sm font-semibold">
              JKG & Sons
            </Text>
          </View>
        </View>

        {/* ── Logout ── */}
        <Pressable
          onPress={handleLogout}
          className="bg-red-50 border border-red-100 rounded-3xl py-4 px-5 flex-row items-center justify-center gap-2.5 active:opacity-80"
        >
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base">Logout</Text>
        </Pressable>

        {/* Footer */}
        <Text className="text-stone-400 text-xs text-center pb-2">
          Stone Wala © 2026 · Made with ❤️ in India
        </Text>
      </View>
    </ScrollView>
  );
}