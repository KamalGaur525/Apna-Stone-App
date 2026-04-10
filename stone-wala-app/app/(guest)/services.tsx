import api from "@/services/api";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  { bg: "#e0f2fe", text: "#1f5f7a" }
 
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
       <LinearGradient
  colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  className="px-5 pt-5 pb-3 "
>
  <View className="flex-row items-center justify-between">
    
    {/* Left — Title */}
    <View className="flex-row items-center gap-3">
      
      <View className="w-1.5 h-10 rounded-full bg-[#c1d7e0]" />
      
      <View className="gap-0.5">
        <Text className="text-[#a0d3e6] text-[10px] font-extrabold tracking-[3px] uppercase">
          On Demand
        </Text>

        <Text className="text-white text-2xl font-extrabold tracking-tight leading-tight">
          Services
        </Text>

        <Text className="text-[#d7d9dd] text-xs font-medium">
          {totalProviders} providers available
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

      {/* ── TYPE FILTER ── */}
    <View className="pt-5 gap-3">
  
  <View className="flex-row items-center gap-3 px-5">
    
    <View className="w-1.5 h-6 rounded-full bg-[#5c99b3]" />
    
    <View>
      <Text className="text-[10px] font-extrabold tracking-widest text-[#5c99b3] uppercase">
        Browse
      </Text>
      <Text className="text-[#0f3f5a] text-base font-extrabold leading-tight -mt-0.5">
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
            ? "bg-[#1f5f7a] border-[#1f5f7a]"
            : "bg-[#f0f9ff] border-[#dbeafe]"
        }`}
      >
        <Text
          className={`text-xs font-bold ${
            selectedType === type
              ? "text-white"
              : "text-[#6b9fb8]"
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
                {/* Providers */}
                <View className="gap-3">
                  {group.providers.map((provider) => (
                    <View
                      key={provider.id}
                      className="bg-white border border-stone-200/60 rounded-3xl p-4 shadow-sm"
                    >
                      {/* Top Row */}
                      <View className="flex-row items-center gap-3">

                        {/* ── Photo or Initials ── */}
                        {provider.photo_url ? (
                          <Image
                            source={{ uri: provider.photo_url }}
                            className="w-12 h-12 rounded-2xl"
                            resizeMode="cover"
                          />
                        ) : (
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
                        )}

                        {/* Name + Tag */}
                        <View className="flex-1 gap-1">
                          <Text
                            className="text-stone-900 font-bold text-sm"
                            numberOfLines={1}
                          >
                            {provider.name}
                          </Text>
                          <View className="self-start bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
                            <Text className="text-sky-600 text-xs font-bold tracking-wide">
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