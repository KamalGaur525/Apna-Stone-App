import { sendGuestOtp } from "@/services/authService";
import { router } from "expo-router";
import { useState } from "react";
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

export default function GuestLogin() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const formattedPhone = phone.trim();

    if (formattedPhone.length !== 10) {
      Alert.alert("Invalid Number", "Phone number must be 10 digits.");
      return;
    }

    try {
      setLoading(true);
      await sendGuestOtp(formattedPhone);

      router.push({
        pathname: "/(auth)/guest-otp",
        params: { phone: formattedPhone },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Unable to send OTP. Try again.";
      Alert.alert("Failed", message);
    } finally {
      setLoading(false);
    }
  };

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
                <Text className="text-amber-400 text-sm font-bold">G</Text>
              </View>
              <Text className="text-3xl font-bold text-stone-900 tracking-tight">
                Guest Login
              </Text>
            </View>

            <View className="flex-row items-center justify-center mt-3 mb-4 gap-2">
              <View className="h-px w-10 bg-amber-400" />
              <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <View className="h-px w-10 bg-amber-400" />
            </View>

            <Text className="text-stone-500 text-sm leading-6 text-center">
              Enter your phone number to explore{"\n"}stone marketplace instantly
            </Text>
          </View>

          {/* Input Card */}
          <View className="bg-white rounded-3xl p-6 border border-stone-100 shadow-md mb-5">
            <Text className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-5">
              Quick Access
            </Text>

            <Text className="text-stone-700 text-sm font-semibold mb-2">
              Phone Number
            </Text>

            <TextInput
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "");
                setPhone(cleaned);
              }}
              placeholder="Enter your phone number"
              placeholderTextColor="#a8a29e"
              maxLength={10}
              keyboardType="number-pad"
              className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
            />

            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-xs text-stone-400">
                We'll send you a secure OTP
              </Text>
              <Text
                className={`text-xs font-semibold ${
                  phone.length === 10 ? "text-amber-500" : "text-stone-300"
                }`}
              >
                {phone.length}/10
              </Text>
            </View>

            <View className="mt-3 h-1 bg-stone-100 rounded-full overflow-hidden">
              <View
                className={`h-1 rounded-full ${
                  phone.length === 10 ? "bg-amber-400" : "bg-stone-300"
                }`}
                style={{ width: `${(phone.length / 10) * 100}%` }}
              />
            </View>
          </View>

          {/* Button */}
          <Pressable
            onPress={handleVerify}
            disabled={loading}
            className="bg-stone-900 rounded-2xl py-4 px-5 active:opacity-80 shadow-sm items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-center text-base font-bold tracking-wide">
                  Send OTP
                </Text>
                <Text className="text-stone-400 text-center text-xs mt-1">
                  Fast & secure login
                </Text>
              </>
            )}
          </Pressable>

          {/* Info Note */}
          <View className="flex-row items-start mt-5 gap-2 px-1">
            <Text className="text-amber-500 text-xs font-bold mt-0.5">ℹ</Text>
            <Text className="text-stone-400 text-xs leading-5 flex-1">
              You can browse products without GST. To sell products, please login
              as a vendor using your GST number.
            </Text>
          </View>
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