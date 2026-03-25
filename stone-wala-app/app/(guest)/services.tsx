import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

interface Provider {
  id: number;
  name: string;
  phone: string;
  photo_url: string | null;
  description: string | null;
}

interface ServiceGroup {
  type_id: number;
  type_name: string;
  providers: Provider[];
}

const PALETTE = [
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#ffedd5", text: "#9a3412" },
  { bg: "#f0fdf4", text: "#14532d" },
  { bg: "#fdf2f8", text: "#86198f" },
  { bg: "#eff6ff", text: "#1d4ed8" },
  { bg: "#fefce8", text: "#713f12" },
];

export default function Services() {
  const [services, setServices] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("All");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/services/providers");
      setServices(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const filteredServices = services
    .filter((group) =>
      selectedType === "All" ? true : group.type_name === selectedType
    )
    .filter((group) => group.providers.length > 0);

  const totalProviders = services.reduce(
    (sum, g) => sum + g.providers.length,
    0
  );

  const serviceTypes = ["All", ...services.map((g) => g.type_name)];

  if (loading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-stone-400 text-sm">Loading services…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-8">
        <Text className="text-stone-900 font-bold text-xl mb-2">
          Something went wrong
        </Text>
        <Text className="text-stone-400 text-sm text-center mb-8">{error}</Text>
        <Pressable
          onPress={fetchServices}
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
    >
      {/* ── HEADER ── */}
      <View className="bg-stone-950 px-5 pt-5 pb-3">
       
     <View className="flex-row items-start justify-between">
  {/* Left — Title */}
  <View className="flex-row items-center gap-3">
    <View className="w-1.5 h-10 rounded-full bg-amber-400" />
    <View className="gap-0.5">
      <Text className="text-amber-500 text-[10px] font-extrabold tracking-[3px] uppercase">
        On Demand
      </Text>
      <Text className="text-white text-2xl font-extrabold tracking-tight leading-tight">
        Services
      </Text>
      <Text className="text-stone-500 text-xs font-medium">
        {totalProviders} providers available
      </Text>
    </View>
  </View>

  {/* Right — Back button */}
  <Pressable
    onPress={() => router.back()}
    className="flex-row items-center bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 gap-1.5"
  >
    <Text className="text-amber-600 text-sm">←</Text>
    <Text className="text-amber-600 text-sm font-semibold">Back</Text>
  </Pressable>
</View>
      </View>

      {/* ── TYPE FILTER ── */}
      <View className="pt-5 gap-3">
        <View className="flex-row items-center gap-3 px-5">
          <View className="w-1.5 h-6 rounded-full bg-amber-400" />
          <View>
            <Text className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase">
              Browse
            </Text>
            <Text className="text-stone-900 text-base font-extrabold leading-tight -mt-0.5">
              Filter by Service
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {serviceTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              className={`px-5 py-2.5 rounded-2xl border active:opacity-75 ${
                selectedType === type
                  ? "bg-stone-900 border-stone-900"
                  : "bg-white border-stone-200/80"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedType === type ? "text-white" : "text-stone-600"
                }`}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── SERVICE GROUPS ── */}
      <View className="px-4 pt-5 pb-10 gap-6">
        {filteredServices.length === 0 ? (
          <View className="bg-white rounded-3xl p-10 border border-stone-200/60 items-center gap-3">
            <View className="w-14 h-14 rounded-2xl bg-stone-100 items-center justify-center">
              <Ionicons name="construct-outline" size={28} color="#d6d3d1" />
            </View>
            <Text className="text-stone-900 font-bold text-base">
              No Services Found
            </Text>
            <Text className="text-stone-400 text-sm text-center">
              Try a different filter
            </Text>
          </View>
        ) : (
          filteredServices.map((group) => {
            const color = PALETTE[group.type_id % PALETTE.length];
            return (
              <View key={group.type_id}>
                {/* Group Header */}
                 

                {/* Providers */}
                <View className="gap-3">
                  {group.providers.map((provider) => (
                    <View
                      key={provider.id}
                      className="bg-white border border-stone-200/60 rounded-3xl p-4 shadow-sm"
                    >
                      {/* Top Row */}
                      <View className="flex-row items-center gap-3">
                        {/* Logo */}
                        <View
                          className="w-12 h-12 rounded-2xl items-center justify-center"
                          style={{ backgroundColor: color.bg }}
                        >
                          <Text
                            className="text-base font-black"
                            style={{ color: color.text }}
                          >
                            {provider.name.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>

                        {/* Name + Tag */}
                        <View className="flex-1 gap-1">
                          <Text
                            className="text-stone-900 font-bold text-sm"
                            numberOfLines={1}
                          >
                            {provider.name}
                          </Text>
                          {/* Service Type Tag — amber style */}
                          <View className="self-start bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                            <Text className="text-amber-600 text-xs font-bold tracking-wide">
                              {group.type_name}
                            </Text>
                          </View>
                        </View>

                        {/* Call Button */}
                        <Pressable
                          onPress={() =>
                            Linking.openURL(`tel:${provider.phone}`)
                          }
                          className="bg-stone-900 active:bg-stone-800 px-4 py-2.5 rounded-xl flex-row items-center gap-1.5"
                        >
                          <Ionicons name="call" size={13} color="white" />
                          <Text className="text-white text-xs font-bold">
                            Call
                          </Text>
                        </Pressable>
                      </View>

                      {/* Description + Phone */}
                      {(provider.description || provider.phone) && (
                        <>
                          <View className="h-px bg-stone-100 mt-3 mb-2" />
                          <View className="flex-row items-center justify-between gap-2">
                            {provider.description ? (
                              <Text
                                className="text-stone-400 text-xs leading-5 flex-1"
                                numberOfLines={2}
                              >
                                {provider.description}
                              </Text>
                            ) : (
                              <View className="flex-1" />
                            )}
                            <View className="flex-row items-center gap-1">
                              <Ionicons name="call-outline" size={11} color="#a8a29e" />
                              <Text className="text-stone-400 text-xs">
                                {provider.phone}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}