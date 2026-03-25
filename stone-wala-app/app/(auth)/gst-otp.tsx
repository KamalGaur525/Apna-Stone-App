import {
  checkGst,
  registerVendor,
  verifyVendorOtp,
  verifyVendorRegisterOtp,
} from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Tier = "Godown" | "Factory" | "Stone Seller";

export default function GSTOtp() {
  // ── Params from gst-login ───────────────────────────
  const params = useLocalSearchParams<{
    gst: string;
    phone: string;
    flow: "login" | "register";
    firmName?: string;
    tier?: Tier;
    whatsapp?: string;
    email?: string;
    location?: string;
  }>();

  const gst = Array.isArray(params.gst) ? params.gst[0] : params.gst;
  const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const flow = Array.isArray(params.flow) ? params.flow[0] : params.flow;
  const firmName = Array.isArray(params.firmName) ? params.firmName[0] : params.firmName;
  const tier = (Array.isArray(params.tier) ? params.tier[0] : params.tier) as Tier;
  const whatsapp = Array.isArray(params.whatsapp) ? params.whatsapp[0] : params.whatsapp;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const location = Array.isArray(params.location) ? params.location[0] : params.location;

  // ── State ───────────────────────────────────────────
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputs = useRef<TextInput[]>([]);
  const { login } = useAuthStore();

  // ── Timer ───────────────────────────────────────────
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // ── OTP Input Handlers ──────────────────────────────
  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  // ── Verify OTP ──────────────────────────────────────
  const verifyOtp = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 4) {
      Alert.alert("Invalid OTP", "Please enter the 4 digit OTP.");
      return;
    }

    try {
      setLoading(true);
      let response: any;

      if (flow === "login") {
        response = await verifyVendorOtp(phone, enteredOtp);
      } else {
        response = await verifyVendorRegisterOtp(
          phone,
          enteredOtp,
          gst,
          firmName!,
          tier!,
          whatsapp || undefined,
          email || undefined,
          location || undefined
        );
      }

      await login({ id: "", role: "vendor" }, response.token);
      router.replace("/(vendor)/dashboard");
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "OTP verification failed. Try again.";
      Alert.alert("Verification Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────
  const resendOtp = async () => {
    try {
      setResendLoading(true);

      if (flow === "login") {
        await checkGst(gst);
      } else {
        await registerVendor(
          gst,
          phone,
          firmName!,
          tier!,
          whatsapp || undefined,
          email || undefined,
          location || undefined
        );
      }

      setOtp(["", "", "", ""]);
      setTimer(60);
      inputs.current[0]?.focus();
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Unable to resend OTP. Try again.";
      Alert.alert("Resend Failed", message);
    } finally {
      setResendLoading(false);
    }
  };

  // ── UI ──────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 bg-stone-50">

        {/* Decorative Blobs */}
        <View className="absolute w-64 h-64 bg-amber-100 rounded-full opacity-50 -top-16 -right-16" />
        <View className="absolute w-48 h-48 bg-stone-200 rounded-full opacity-60 -bottom-10 -left-12" />

        <View className="flex-1 px-6 justify-center">

          {/* Header */}
          <View className="mb-10">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center mb-8 self-start active:opacity-60"
            >
              <Text className="text-stone-400 text-base mr-1">←</Text>
              <Text className="text-stone-400 text-sm font-medium">Back</Text>
            </Pressable>

            <View className="flex-col items-center gap-3 mb-3">
              <View className="w-10 h-10 bg-stone-900 rounded-xl items-center justify-center">
                <Text className="text-amber-400 text-sm font-bold">OTP</Text>
              </View>
              <Text className="text-3xl font-bold text-stone-900 tracking-tight">
                Verify OTP
              </Text>
            </View>

            <View className="flex-row items-center justify-center mt-3 mb-4 gap-2">
              <View className="h-px w-10 bg-amber-400" />
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <View className="h-px w-10 bg-amber-400" />
            </View>

            <Text className="text-stone-500 text-sm leading-6 text-center">
              OTP sent to{" "}
              <Text className="text-stone-900 font-semibold">
                +91 {phone}
              </Text>
            </Text>
            <Text className="text-stone-400 text-xs text-center mt-1">
              GST: {gst}
            </Text>
          </View>

          {/* OTP Card */}
          <View className="bg-white rounded-3xl p-6 border border-stone-100 shadow-md mb-5">
            <Text className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-6 text-center">
              Enter 4-Digit OTP
            </Text>

            <View className="flex-row justify-center gap-4 mb-2">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === "Backspace") {
                      handleBackspace(index);
                    }
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  className={`w-14 h-16 border-2 rounded-2xl text-center text-2xl font-bold ${
                    digit
                      ? "bg-stone-900 border-stone-900 text-white"
                      : "bg-stone-50 border-stone-200 text-stone-900"
                  }`}
                />
              ))}
            </View>

            <Text className="text-stone-400 text-xs text-center mt-4">
              OTP expires in{" "}
              <Text className="text-amber-500 font-semibold">10 minutes</Text>
            </Text>
          </View>

          {/* Verify Button */}
          <Pressable
            onPress={verifyOtp}
            disabled={loading}
            className="bg-stone-900 rounded-2xl py-4 px-5 active:opacity-80 shadow-sm items-center mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-center text-base font-bold tracking-wide">
                  Verify OTP
                </Text>
                <Text className="text-stone-400 text-center text-xs mt-1">
                  {flow === "register"
                    ? "Complete registration"
                    : "Login to dashboard"}
                </Text>
              </>
            )}
          </Pressable>

          {/* Resend */}
          <Pressable
            onPress={resendOtp}
            disabled={timer > 0 || resendLoading}
            className="items-center py-2"
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="#d97706" />
            ) : (
              <Text
                className={`text-sm font-semibold ${
                  timer > 0 ? "text-stone-300" : "text-amber-600"
                }`}
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View className="pb-8 px-6 flex-row justify-between items-center">
          <Text className="text-stone-400 text-xs">Powered by JKG & Sons</Text>
          <View className="w-px h-3 bg-stone-300" />
          <Text className="text-stone-400 text-xs">Owned by Aman Garg</Text>
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}