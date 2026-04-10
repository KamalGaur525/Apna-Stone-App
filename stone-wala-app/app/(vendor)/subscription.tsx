import {
  completeSubscription,
  getMyPlan,
  getSubscriptionPlans,
  getTransactionHistory
} from "@/services/subscriptionService";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  plan_name: string;
  type: "vendor" | "guest";
  price: number;
  duration_days: number;
  description: string;
}
interface Transaction {
  id: number;
  amount: number;
  transaction_id: string;
  status: string;
  type: string;
  created_at: string;
  plan_expires_at: string;
  plan_name: string;
}
interface ActivePlan {
  plan_name: string;
  amount: number;
  plan_expires_at: string;
  transaction_id: string;
  duration_days: number;
}

export default function Subscription() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

 const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const [plansRes, myPlanRes, historyRes] = await Promise.all([
      getSubscriptionPlans(),
      getMyPlan(),
      getTransactionHistory(), // ← add
    ]);
    setPlans(plansRes.data || []);
    setHistory(historyRes.data || []); // ← add
    if (myPlanRes.hasActivePlan) {
      setActivePlan(myPlanRes.data);
    } else {
      setActivePlan(null);
    }
  } catch (err: any) {
    setError(err?.response?.data?.error || "Failed to load plans.");
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

const handleSubscribe = async () => {
  if (!selectedPlan) {
    Alert.alert("Select Plan", "Please select a subscription plan.");
    return;
  }

  if (activePlan?.plan_name === selectedPlan.plan_name) {
    Alert.alert("Active Plan", "This plan is already active.");
    return;
  }

  try {
    setPaying(true);

    // ── TEMPORARY: Skip Razorpay, direct mock payment ──
    const verifyRes = await completeSubscription({
      plan_id: selectedPlan.id,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_order_id: `order_test_${Date.now()}`,
      razorpay_signature: `sig_test_${Date.now()}`,
    });

    if (verifyRes.success) {
      Alert.alert(
        "Payment Successful! 🎉",
        `${selectedPlan.plan_name} plan activated.\nExpires: ${formatDate(verifyRes.expires_at)}`,
        [
          {
            text: "Continue",
            onPress: () => {
              if (user?.role === "vendor") {
                router.replace("/(vendor)/dashboard");
              } else {
                router.replace("/(guest)/home");
              }
            },
          },
        ]
      );
    }
  } catch (err: any) {
    Alert.alert(
      "Failed",
      err?.response?.data?.error || "Something went wrong."
    );
  } finally {
    setPaying(false);
  }
};
  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-stone-400 text-sm">Loading plans…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center px-8">
        <Text className="text-white font-bold text-xl mb-2">Something went wrong</Text>
        <Text className="text-stone-400 text-sm text-center mb-8">{error}</Text>
        <Pressable onPress={fetchData} className="bg-amber-500 px-8 py-3.5 rounded-2xl">
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
       <LinearGradient
            colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="px-6 pt-8 pb-4"
          >
        <View className="items-start flex-row gap-3 mb-2">
          <View className="p-1 rounded-3xl bg-sky-500/20">
            <View className="w-20 h-20 rounded-2xl bg-[#6bb6d6] border border-sky-500/30 items-center justify-center">
             <Ionicons name="diamond-outline" size={28} color="#fff" />
            </View>
          </View>
          <View className="flex-col mt-4">
            <Text className="text-stone-50 text-2xl mb-1 font-bold tracking-wider">
              Subscription Plans
            </Text>
            <Text className="text-sky-50 text-sm leading-6">
              Unlock full access to ApnaStone{"\n"}marketplace features
            </Text>
            
          </View>
        </View>
      </LinearGradient>

      {/* ── Active Plan Banner ── */}
      {activePlan && (
        <View className="mx-5 mt-5 bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <Text className="text-emerald-700 font-bold text-sm uppercase tracking-widest">
              Active Plan
            </Text>
          </View>
          <Text className="text-stone-900 font-black text-xl mb-1">
            {activePlan.plan_name}
          </Text>
          <Text className="text-stone-500 text-xs mb-3">
            Expires on{" "}
            <Text className="font-bold text-stone-700">
              {formatDate(activePlan.plan_expires_at)}
            </Text>
          </Text>
          <View className="h-px bg-emerald-100 mb-3" />
          <View className="flex-row justify-between">
            <View>
              <Text className="text-stone-400 text-xs">Amount Paid</Text>
              <Text className="text-stone-800 font-bold">₹{activePlan.amount}</Text>
            </View>
            <View>
              <Text className="text-stone-400 text-xs">Transaction ID</Text>
              <Text className="text-stone-800 font-bold text-xs" numberOfLines={1}>
                {activePlan.transaction_id.slice(0, 20)}...
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Plans ── */}
      <View className="px-5 gap-4 pt-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isActive = activePlan?.plan_name === plan.plan_name;
          const isYearly = plan.duration_days >= 365;

          return (
            <Pressable
              key={plan.id}
              onPress={() => !isActive && setSelectedPlan(plan)}
              className={`rounded-3xl overflow-hidden border active:opacity-90 ${
                isActive
                  ? "border-emerald-400"
                  : isSelected
                  ? "border-amber-500"
                  : "border-stone-200"
              }`}
            >
              {/* Badge */}
              {isActive ? (
                <View className="bg-emerald-500 py-2 items-center">
                  <Text className="text-white text-xs font-black tracking-widest uppercase">
                    Current Plan · Expires {formatDate(activePlan!.plan_expires_at)}
                  </Text>
                </View>
              ) : isYearly ? (
                <View className="bg-amber-500 py-2 items-center">
                  <Text className="text-white text-xs font-black tracking-widest uppercase">
                    🏆 Best Value
                  </Text>
                </View>
              ) : null}

              <View className={`p-5 ${isActive ? "bg-emerald-50" : isSelected ? "bg-amber-50" : "bg-white"}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    {/* Radio */}
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        isActive
                          ? "border-emerald-500"
                          : isSelected
                          ? "border-amber-500"
                          : "border-stone-300"
                      }`}
                    >
                      {(isActive || isSelected) && (
                        <View
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                      )}
                    </View>

                    <View>
                      <Text className="text-stone-900 font-bold text-base">
                        {plan.plan_name}
                      </Text>
                      <Text className="text-stone-400 text-xs mt-0.5">
                        {plan.duration_days >= 365
                          ? "12 Months"
                          : `${plan.duration_days} Days`}
                      </Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View className="items-end">
                    <Text className="text-stone-900 text-2xl font-black">
                      ₹{plan.price}
                    </Text>
                    <Text className="text-stone-400 text-xs">
                      /{plan.duration_days >= 365 ? "yr" : "mo"}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-stone-400 text-xs mt-3">{plan.description}</Text>

                {/* Features */}
                <View className="mt-3 gap-2">
                  {[
                    "Unlimited product listings",
                    "Marketplace visibility",
                    "Customer inquiries",
                    plan.duration_days >= 365 ? "Priority support" : "Basic support",
                  ].map((feature, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <Text className="text-amber-500 text-xs font-bold">✓</Text>
                      <Text className="text-stone-500 text-xs">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Active label */}
                {isActive && (
                  <View className="mt-4 bg-emerald-100 rounded-xl py-2 items-center">
                    <Text className="text-emerald-700 text-xs font-bold">✓ Active</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
{/* ── TRANSACTION HISTORY ── */}
{history.length > 0 && (
  <View className="px-5 pt-12 pb-12">
    <View className="flex-row items-center gap-3 mb-4">
      <View className="w-1.5 h-7 rounded-full bg-[#3f8fb0]" />
      <View>
        <Text className="text-[10px] font-extrabold tracking-widest text-[#3f8fb0] uppercase">
          Billing
        </Text>
        <Text className="text-stone-900 text-base font-extrabold leading-tight mt-0.5">
          Transaction History
        </Text>
      </View>
    </View>

    <View className="gap-3">
      {history.map((txn, index) => {
        const isLatest = index === 0;
        const isExpired = new Date(txn.plan_expires_at) < new Date();

        return (
          <View
            key={txn.id}
            className={`bg-white rounded-3xl border overflow-hidden ${
              isLatest ? "border-sky-200" : "border-stone-100"
            }`}
          >
            {/* Top Badge */}
            {isLatest && (
              <View className="bg-[#3f8fb0] py-1.5 items-center">
                <Text className="text-white text-[10px] font-black tracking-widest uppercase">
                  Latest Transaction
                </Text>
              </View>
            )}

            <View className="p-4 gap-3">
              {/* Plan name + Amount */}
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-stone-900 font-black text-base">
                    {txn.plan_name}
                  </Text>
                  <Text className="text-stone-400 text-xs mt-0.5 capitalize">
                    {txn.type.replace("_", " ")}
                  </Text>
                </View>
                <Text className="text-stone-900 text-xl font-black">
                  ₹{txn.amount}
                </Text>
              </View>

              <View className="h-px bg-stone-100" />

              {/* Details Grid */}
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-stone-400 text-xs">Transaction ID</Text>
                  <Text className="text-stone-700 text-xs font-semibold" numberOfLines={1}>
                    {txn.transaction_id.slice(0, 24)}...
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-stone-400 text-xs">Purchase Date</Text>
                  <Text className="text-stone-700 text-xs font-semibold">
                    {formatDate(txn.created_at)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-stone-400 text-xs">Expiry Date</Text>
                  <Text className={`text-xs font-semibold ${isExpired ? "text-red-500" : "text-emerald-600"}`}>
                    {formatDate(txn.plan_expires_at)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-stone-400 text-xs">Status</Text>
                  <View className={`px-2.5 py-1 rounded-full ${isExpired ? "bg-red-50" : "bg-emerald-50"}`}>
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? "text-red-500" : "text-emerald-600"}`}>
                      {isExpired ? "Expired" : "Active"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  </View>
)}
      {/* ── Subscribe Button ── */}
      <View className="px-5 pt-6 pb-12">
        <Pressable
          onPress={handleSubscribe}
          disabled={!selectedPlan || paying || activePlan?.plan_name === selectedPlan?.plan_name}
          className={`rounded-2xl py-4 px-5 items-center gap-0.5 ${
            selectedPlan && !paying && activePlan?.plan_name !== selectedPlan?.plan_name
              ? "bg-amber-500 active:bg-amber-400"
              : "bg-stone-100"
          }`}
        >
          {paying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text
                className={`text-base font-black tracking-wide ${
                  selectedPlan ? "text-white" : "text-stone-300"
                }`}
              >
                {activePlan && selectedPlan && activePlan.plan_name !== selectedPlan.plan_name
                  ? `Upgrade — ₹${selectedPlan.price}`
                  : selectedPlan
                  ? `Buy Plan — ₹${selectedPlan.price}`
                  : "Select a Plan"}
              </Text>
              <Text
                className={`text-xs font-medium ${
                  selectedPlan ? "text-amber-100" : "text-stone-300"
                }`}
              >
                {selectedPlan ? "Secure payment via Razorpay" : "Choose a plan to continue"}
              </Text>
            </>
          )}
        </Pressable>

        <Text className="text-stone-400 text-xs text-center mt-4">
          Cancel anytime · Secure payment via Razorpay
        </Text>
      </View>
    </ScrollView>
  );
}
 
