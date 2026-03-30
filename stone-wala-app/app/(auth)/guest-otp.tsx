import { saveGuestProfile, sendGuestOtp, verifyGuestOtp } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function GuestOtp() {

  const params = useLocalSearchParams<{ phone: string }>();
const phone = Array.isArray(params.phone) ? params.phone[0] : params.phone;

  // ── OTP State ───────────────────────────────────────
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const [tempToken, setTempToken] = useState<string | null>(null);

  // ── Profile Form State ──────────────────────────────
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

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
    const response = await verifyGuestOtp(phone, enteredOtp);

    if (response.isNewUser) {
      // ✅ Naya user — profile form dikhao
      setTempToken(response.token);
      setShowProfileForm(true);
    } else {
      // ✅ Existing user — seedha login
      await login({ id: response.id || "", role: "guest", name: response.name || "" }, response.token);
    }
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
      await sendGuestOtp(phone);
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

  // ── Save Profile ────────────────────────────────────
 const handleSaveProfile = async () => {
  const formattedName = name.trim();
  const formattedWhatsapp = whatsapp.trim();
  const formattedEmail = email.trim();
  const formattedLocation = location.trim();

  if (formattedName.length < 2) {
    Alert.alert("Invalid Name", "Please enter your full name.");
    return;
  }
  if (formattedWhatsapp && formattedWhatsapp.length < 10) {
    Alert.alert("Invalid WhatsApp", "Please enter a valid 10-digit number.");
    return;
  }
  if (formattedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedEmail)) {
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
  }

  try {
    setProfileLoading(true);

    // ✅ Token manually pass karo — abhi SecureStore mein nahi hai
    await saveGuestProfile(
      {
        name: formattedName,
        whatsapp: formattedWhatsapp || undefined,
        email: formattedEmail || undefined,
        location: formattedLocation || undefined,
      },
      tempToken!
    );

    // ✅ Ab login() call karo — _layout redirect karega
    await login({ id: "", role: "guest", name: formattedName }, tempToken!);
  } catch (error: any) {
    const message =
      error?.response?.data?.error || "Failed to save profile. Try again.";
    Alert.alert("Error", message);
  } finally {
    setProfileLoading(false);
  }
};

 

  // ── Skip Profile ────────────────────────────────────
  const handleSkip = () => {
    router.replace("/(guest)/home");
  };

  // ── UI ──────────────────────────────────────────────
  return (
    <ScrollView
      className="flex-1 bg-stone-50"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Decorative Blobs */}
      <View className="absolute w-64 h-64 bg-amber-100 rounded-full opacity-50 -top-16 -right-16" />
      <View className="absolute w-48 h-48 bg-stone-200 rounded-full opacity-60 -bottom-10 -left-12" />

      <View className="flex-1 px-6 justify-center py-12">

        {/* ── OTP Screen ── */}
        {!showProfileForm && (
          <>
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
                    Access marketplace
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
          </>
        )}

        {/* ── Profile Form ── */}
        {showProfileForm && (
          <>
            {/* Header */}
            <View className="mb-10">
              <View className="flex-col items-center gap-3 mb-3">
                <View className="w-10 h-10 bg-stone-900 rounded-xl items-center justify-center">
                  <Text className="text-amber-400 text-sm font-bold">👤</Text>
                </View>
                <Text className="text-3xl font-bold text-stone-900 tracking-tight">
                  Your Profile
                </Text>
              </View>

              <View className="flex-row items-center justify-center mt-3 mb-4 gap-2">
                <View className="h-px w-10 bg-amber-400" />
                <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <View className="h-px w-10 bg-amber-400" />
              </View>

              <Text className="text-stone-500 text-sm leading-6 text-center">
                Help vendors reach you better
              </Text>
            </View>

            {/* Form Card */}
            <View className="bg-white rounded-3xl p-6 border border-stone-100 shadow-md mb-5 gap-5">
              <Text className="text-stone-400 text-xs font-semibold tracking-widest uppercase">
                Profile Details
              </Text>

              {/* Name — Required */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Full Name <Text className="text-amber-500">*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#a8a29e"
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>

              {/* Divider */}
              <View className="flex-row items-center gap-3">
                <View className="flex-1 h-px bg-stone-100" />
                <Text className="text-stone-400 text-xs font-semibold">
                  OPTIONAL
                </Text>
                <View className="flex-1 h-px bg-stone-100" />
              </View>

              {/* WhatsApp */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  WhatsApp Number
                  <Text className="text-stone-400 text-xs font-normal"> (optional)</Text>
                </Text>
                <TextInput
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#a8a29e"
                  maxLength={10}
                  keyboardType="phone-pad"
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>

              {/* Email */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Email Address
                  <Text className="text-stone-400 text-xs font-normal"> (optional)</Text>
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#a8a29e"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>

              {/* Location */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Location
                  <Text className="text-stone-400 text-xs font-normal"> (optional)</Text>
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, State"
                  placeholderTextColor="#a8a29e"
                  multiline
                  numberOfLines={2}
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSaveProfile}
              disabled={profileLoading}
              className="bg-stone-900 rounded-2xl py-4 px-5 active:opacity-80 shadow-sm items-center mb-3"
            >
              {profileLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-center text-base font-bold tracking-wide">
                    Save & Continue
                  </Text>
                  <Text className="text-stone-400 text-center text-xs mt-1">
                    Start exploring marketplace
                  </Text>
                </>
              )}
            </Pressable>

            {/* Skip */}
            <Pressable
              onPress={handleSkip}
              className="items-center py-2"
            >
              <Text className="text-stone-400 text-sm font-semibold">
                Skip for now
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Footer */}
      <View className="pb-8 px-6 flex-row justify-between items-center">
        <Text className="text-stone-400 text-xs">Powered by JKG & Sons</Text>
        <View className="w-px h-3 bg-stone-300" />
        <Text className="text-stone-400 text-xs">Owned by Aman Garg</Text>
      </View>
    </ScrollView>
  );
}