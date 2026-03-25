import { VENDOR_ENDPOINTS } from "@/constants/api";
import api from "@/services/api";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

interface Plan {
  id: number;
  plan_type: "monthly" | "yearly";
  price: number;
}

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(VENDOR_ENDPOINTS.SUBSCRIPTION_PLANS);
      setPlans(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    if (!selectedPlan) {
      Alert.alert("Select Plan", "Please select a subscription plan.");
      return;
    }
    Alert.alert(
      "Coming Soon",
      "Payment integration will be available soon.",
      [{ text: "OK" }]
    );
  };

  const getPlanDetails = (plan: Plan) => {
    if (plan.plan_type === "monthly") {
      return {
        label: "Monthly",
        duration: "1 Month",
        badge: null,
        icon: "",
      };
    }
    return {
      label: "Yearly",
      duration: "12 Months",
      badge: "Best Value",
      icon: "🏆",
    };
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-stone-400 text-sm">Loading plans…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-50 items-center justify-center px-8">
        <Text className="text-stone-900 font-bold text-xl mb-2">
          Something went wrong
        </Text>
        <Text className="text-stone-400 text-sm text-center mb-8">{error}</Text>
        <Pressable
          onPress={fetchPlans}
          className="bg-amber-500 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-white font-bold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-stone-50"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#f59e0b"]}
          tintColor="#f59e0b"
        />
      }
    >
      {/* ── Header ── */}
      <View className="bg-stone-950 px-6 pt-9 pb-5">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 mb-8 gap-1.5"
        >
          <Text className="text-amber-600 text-sm">←</Text>
          <Text className="text-amber-600 text-sm font-semibold">Back</Text>
        </Pressable>

        <View className="items-start flex-row gap-3 mb-2">
          <View className="p-1 rounded-3xl bg-amber-500/20">
            <View className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 items-center justify-center">
              <Text className="text-4xl">👑</Text>
            </View>
          </View>
         <View className="flex-col items-center mt-4">
           <Text className="text-stone-50 text-2xl mb-1 font-bold tracking-wider">
            Subscription Plans
          </Text>
          <Text className="text-stone-300 text-sm text-start leading-6">
            Unlock full access to Stone Wala{"\n"}marketplace features
          </Text>
         </View>
        </View>
      </View>

      {/* ── Plans ── */}
      <View className="px-5 gap-4 pt-7">
        {plans.map((plan) => {
          const details = getPlanDetails(plan);
          const isSelected = selectedPlan?.id === plan.id;

          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan)}
              className={`rounded-3xl overflow-hidden border active:opacity-90 ${
                isSelected
                  ? "border-amber-500"
                  : "border-stone-200"
              }`}
            >
              {/* Best Value Badge */}
              {details.badge && (
                <View className="bg-amber-500 py-2 items-center">
                  <Text className="text-white text-xs font-black tracking-widest uppercase">
                    {details.badge}
                  </Text>
                </View>
              )}

              <View
                className={`p-5 ${
                  isSelected ? "bg-amber-50" : "bg-white"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    {/* Radio */}
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        isSelected ? "border-amber-500" : "border-stone-300"
                      }`}
                    >
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      )}
                    </View>

                    <View>
                      <Text className="text-stone-900 font-bold text-base">
                        {details.icon} {details.label}
                      </Text>
                      <Text className="text-stone-400 text-xs mt-0.5">
                        {details.duration}
                      </Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View className="items-end">
                    <Text className="text-stone-900 text-2xl font-black">
                      ₹{plan.price}
                    </Text>
                    <Text className="text-stone-400 text-xs">
                      /{plan.plan_type === "monthly" ? "mo" : "yr"}
                    </Text>
                  </View>
                </View>

                {/* Features */}
                <View className="mt-4 gap-2">
                  {[
                    "Unlimited product listings",
                    "Marketplace visibility",
                    "Customer inquiries",
                    plan.plan_type === "yearly"
                      ? "Priority support"
                      : "Basic support",
                  ].map((feature, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <Text className="text-amber-500 text-xs font-bold">✓</Text>
                      <Text className="text-stone-500 text-xs">{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── Subscribe Button ── */}
      <View className="px-5 pt-6 pb-10">
        <Pressable
          onPress={handleSubscribe}
          disabled={!selectedPlan}
          className={`rounded-2xl py-4 px-5 items-center gap-0.5 ${
            selectedPlan
              ? "bg-amber-500 active:bg-amber-400"
              : "bg-stone-100"
          }`}
        >
          <Text
            className={`text-base font-black tracking-wide ${
              selectedPlan ? "text-white" : "text-stone-300"
            }`}
          >
            {selectedPlan
              ? `Subscribe — ₹${selectedPlan.price}`
              : "Select a Plan"}
          </Text>
          <Text
            className={`text-xs font-medium ${
              selectedPlan ? "text-amber-100" : "text-stone-300"
            }`}
          >
            {selectedPlan
              ? "Payment coming soon"
              : "Choose monthly or yearly"}
          </Text>
        </Pressable>

        <Text className="text-stone-400 text-xs text-center mt-4">
          Cancel anytime · Secure payment via Razorpay
        </Text>
      </View>
    </ScrollView>
  );
}