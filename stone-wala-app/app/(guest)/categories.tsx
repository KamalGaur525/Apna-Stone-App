import { getAllCategories } from "@/services/categoryService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

// ── Deterministic palette — id se color ─────────────
const PALETTE = [
  { tileBg: "#fef3c7", iconBg: "#fde68a", iconColor: "#92400e", accent: "#f59e0b" },
  { tileBg: "#dbeafe", iconBg: "#bfdbfe", iconColor: "#1e40af", accent: "#3b82f6" },
  { tileBg: "#dcfce7", iconBg: "#bbf7d0", iconColor: "#166534", accent: "#22c55e" },
  { tileBg: "#fce7f3", iconBg: "#fbcfe8", iconColor: "#9d174d", accent: "#ec4899" },
  { tileBg: "#ede9fe", iconBg: "#ddd6fe", iconColor: "#5b21b6", accent: "#8b5cf6" },
  { tileBg: "#ffedd5", iconBg: "#fed7aa", iconColor: "#9a3412", accent: "#f97316" },
  { tileBg: "#f0fdf4", iconBg: "#bbf7d0", iconColor: "#14532d", accent: "#16a34a" },
  { tileBg: "#fdf2f8", iconBg: "#f5d0fe", iconColor: "#86198f", accent: "#d946ef" },
  { tileBg: "#eff6ff", iconBg: "#bfdbfe", iconColor: "#1d4ed8", accent: "#2563eb" },
  { tileBg: "#fefce8", iconBg: "#fef08a", iconColor: "#713f12", accent: "#ca8a04" },
  { tileBg: "#f1f5f9", iconBg: "#e2e8f0", iconColor: "#334155", accent: "#64748b" },
  { tileBg: "#fff7ed", iconBg: "#fed7aa", iconColor: "#7c2d12", accent: "#ea580c" },
];

const getPalette = (id: number) => PALETTE[id % PALETTE.length];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllCategories();
      const parents = (res.data || []).filter(
        (c: Category) => c.parent_id === null
      );
      setCategories(parents);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-5">
        <View className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
        <View className="items-center gap-1">
          <Text className="text-white text-sm font-bold tracking-widest uppercase">
            Stone Wala
          </Text>
          <Text className="text-stone-600 text-xs font-medium">
            Loading categories…
          </Text>
        </View>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center px-8 gap-5">
        <View className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 items-center justify-center">
          <Ionicons name="warning-outline" size={28} color="#ef4444" />
        </View>
        <View className="items-center gap-2">
          <Text className="text-white font-extrabold text-xl text-center">
            Something went wrong
          </Text>
          <Text className="text-stone-500 text-sm text-center leading-relaxed">
            {error}
          </Text>
        </View>
        <Pressable
          onPress={fetchCategories}
          className="bg-amber-500 active:bg-amber-400 px-10 py-4 rounded-2xl"
        >
          <Text className="text-stone-950 font-extrabold text-sm tracking-widest uppercase">
            Try Again
          </Text>
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
    >
      {/* ── HEADER ── */}
       <LinearGradient
              colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="px-5 pt-5 pb-3 shadow-sm z-10"
            >
       
     <View className="flex-row items-center justify-between">
  {/* Left — Title */}
  <View className="flex-row items-center gap-3">
    <View className="w-1.5 h-10 rounded-full bg-[#5c99b3]" />
    <View className="gap-0.5">
      <Text className="text-[#a0d3e6] text-[10px] font-extrabold tracking-[3px] uppercase">
         Browse
      </Text>
      <Text className="text-white text-2xl font-extrabold tracking-tight leading-tight">
        Categories
      </Text>
      <Text className="text-[#f2f3f8] text-xs font-medium">
        {categories.length} categories available
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
     

      {/* ── GRID ── */}
      <View className="px-4 pt-5 pb-10">
  {categories.length === 0 ? (
    
    <View className="bg-[#f0f9ff] rounded-3xl p-12 border border-[#dbeafe] items-center gap-3 shadow-sm">
      
      <View className="w-16 h-16 rounded-2xl bg-[#e0f2fe] border border-[#dbeafe] items-center justify-center">
        <Ionicons name="grid-outline" size={28} color="#a0d3e6" />
      </View>

      <View className="items-center gap-1">
        <Text className="text-[#1f5f7a] font-bold text-sm">
          No Categories
        </Text>
        <Text className="text-[#6b9fb8] text-xs text-center">
          Categories will appear once added.
        </Text>
      </View>
    </View>

  ) : (
    
    <View className="flex-row flex-wrap justify-between gap-y-4">
      {categories.map((cat) => {
        const p = getPalette(cat.id);
        const initials = getInitials(cat.name);

        return (
          <Pressable
            key={cat.id}
            onPress={() =>
              router.push({
                pathname: "/(guest)/category-detail",
                params: { id: String(cat.id), name: cat.name },
              })
            }
            className="w-[48%] bg-[#f0f9ff] rounded-3xl border border-[#dbeafe] shadow-sm overflow-hidden active:opacity-80"
          >
            
            {/* Color tile (kept dynamic palette logic) */}
            <View
              className="h-32 w-full items-center justify-center"
              style={{ backgroundColor: p.tileBg }}
            >
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: p.iconBg }}
              >
                <Text
                  className="text-2xl font-black"
                  style={{ color: p.iconColor }}
                >
                  {initials}
                </Text>
              </View>
            </View>

            {/* Accent bar (unchanged logic) */}
            <View
              className="h-0.5 w-full opacity-60"
              style={{ backgroundColor: p.accent }}
            />

            {/* Info */}
            <View className="px-4 pt-3 pb-4 gap-2">
              
              <Text
                className="text-[#0f3f5a] font-extrabold text-sm leading-snug"
                numberOfLines={1}
              >
                {cat.name}
              </Text>

              <View className="flex-row items-center justify-between">
                
                <Text className="text-[#6b9fb8] text-[10px] font-semibold">
                  Browse collection
                </Text>

                <View className="flex-row items-center gap-0.5">
                  <Text className="text-[#1f5f7a] text-[10px] font-extrabold">
                    Explore
                  </Text>
                  <Feather name="arrow-right" size={10} color="#3f8fb0" />
                </View>

              </View>
            </View>

          </Pressable>
        );
      })}
    </View>
  )}
</View>
    </ScrollView>
  );
}