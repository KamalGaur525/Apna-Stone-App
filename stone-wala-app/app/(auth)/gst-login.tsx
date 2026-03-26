import { checkGst, registerVendor, verifyGSTNumber } from "@/services/authService";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Tier = "Godown" | "Factory" | "Stone Seller";
type GstVerifyState = "idle" | "checking" | "valid" | "invalid" | "registered";

const TIERS: Tier[] = ["Godown", "Factory", "Stone Seller"];
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function GSTLogin() {
  const [gst, setGst] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Registration Form State ─────────────────────────
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [firmName, setFirmName] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // ── GST Verify State ────────────────────────────────
  const [gstVerifyState, setGstVerifyState] = useState<GstVerifyState>("idle");
  const [gstVerifyMessage, setGstVerifyMessage] = useState("");

  // ── Auto verify on 15 chars ─────────────────────────
  useEffect(() => {
    if (gst.length < 15) {
      setGstVerifyState("idle");
      setGstVerifyMessage("");
      return;
    }
    if (!GST_REGEX.test(gst)) {
      setGstVerifyState("invalid");
      setGstVerifyMessage("Invalid GST format. Please check and re-enter.");
      return;
    }
    const verify = async () => {
      setGstVerifyState("checking");
      try {
        const result = await verifyGSTNumber(gst);
        if (result.alreadyRegistered) {
          setGstVerifyState("registered");
          setGstVerifyMessage("GST already registered. Click below to login.");
          return;
        }
        if (!result.valid) {
          setGstVerifyState("invalid");
          setGstVerifyMessage(result.message || "GST not found or inactive.");
          return;
        }
        setGstVerifyState("valid");
        setGstVerifyMessage("GST verified successfully!");
        if (result.firmName) setFirmName(result.firmName);
        if (result.state) setLocation(result.state);
      } catch {
        setGstVerifyState("invalid");
        setGstVerifyMessage("Could not verify GST. Check your connection.");
      }
    };
    verify();
  }, [gst]);

  // ── GST Validation ──────────────────────────────────
  const isValidGST = (value: string) => GST_REGEX.test(value);

  // ── Step 1: Check GST ───────────────────────────────
  const handleVerify = async () => {
    const formattedGST = gst.trim().toUpperCase();

    if (formattedGST.length !== 15) {
      Alert.alert("Invalid GST", "GST number must be 15 characters.");
      return;
    }
    if (!isValidGST(formattedGST)) {
      Alert.alert("Invalid Format", "Please enter a valid GST number.");
      return;
    }
    if (gstVerifyState === "invalid") {
      Alert.alert("Invalid GST", gstVerifyMessage || "Please enter a valid GST number.");
      return;
    }
    if (gstVerifyState === "registered") {
      // Already registered — go to login OTP directly
      try {
        setLoading(true);
        const response = await checkGst(formattedGST);
        if (response.exists) {
          router.push({
            pathname: "/(auth)/gst-otp",
            params: {
              gst: formattedGST,
              phone: response.phone,
              flow: "login",
            },
          });
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.error || "Unable to verify GST. Try again.";
        Alert.alert("Verification Failed", message);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (gstVerifyState !== "valid") {
      Alert.alert("Please Wait", "GST verification in progress.");
      return;
    }

    // GST is valid + new — show registration form
    setShowRegisterForm(true);
  };

  // ── Step 2: Register New Vendor ─────────────────────
  const handleRegister = async () => {
    const formattedGST = gst.trim().toUpperCase();
    const formattedPhone = phone.trim();
    const formattedFirmName = firmName.trim();
    const formattedWhatsapp = whatsapp.trim();
    const formattedEmail = email.trim();
    const formattedLocation = location.trim();

    if (formattedPhone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }
    if (formattedFirmName.length < 2) {
      Alert.alert("Invalid Firm Name", "Firm name must be at least 2 characters.");
      return;
    }
    if (!selectedTier) {
      Alert.alert("Select Tier", "Please select your firm type.");
      return;
    }
    if (formattedWhatsapp && formattedWhatsapp.length < 10) {
      Alert.alert("Invalid WhatsApp", "Please enter a valid WhatsApp number.");
      return;
    }
    if (formattedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setRegisterLoading(true);
      await registerVendor(
        formattedGST,
        formattedPhone,
        formattedFirmName,
        selectedTier,
        formattedWhatsapp || undefined,
        formattedEmail || undefined,
        formattedLocation || undefined
      );

      router.push({
        pathname: "/(auth)/gst-otp",
        params: {
          gst: formattedGST,
          phone: formattedPhone,
          firmName: formattedFirmName,
          tier: selectedTier,
          whatsapp: formattedWhatsapp || "",
          email: formattedEmail || "",
          location: formattedLocation || "",
          flow: "register",
        },
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Registration failed. Try again.";
      Alert.alert("Registration Failed", message);
    } finally {
      setRegisterLoading(false);
    }
  };

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

        {/* Header */}
        <View className="mb-10">
          <Pressable
            onPress={() => {
              if (showRegisterForm) {
                setShowRegisterForm(false);
              } else {
                router.back();
              }
            }}
            className="flex-row items-center mb-8 self-start active:opacity-60"
          >
            <Text className="text-stone-400 text-base mr-1">←</Text>
            <Text className="text-stone-400 text-sm font-medium">
              {showRegisterForm ? "Back to GST Check" : "Back"}
            </Text>
          </Pressable>

          <View className="flex-col items-center gap-3 mb-3">
            <View className="w-10 h-10 bg-stone-900 rounded-xl items-center justify-center">
              <Text className="text-amber-400 text-sm font-bold">
                {showRegisterForm ? "NEW" : "GST"}
              </Text>
            </View>
            <Text className="text-3xl font-bold text-stone-900 tracking-tight">
              {showRegisterForm ? "Register Firm" : "GST Login"}
            </Text>
          </View>

          <View className="flex-row items-center justify-center mt-3 mb-4 gap-2">
            <View className="h-px w-10 bg-amber-400" />
            <View className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <View className="h-px w-10 bg-amber-400" />
          </View>

          <Text className="text-stone-500 text-sm leading-6 text-center">
            {showRegisterForm
              ? "Fill your firm details to get started"
              : "Enter your GST number to access\nyour firm's seller dashboard"}
          </Text>
        </View>

        {/* ── GST Check Form ── */}
        {!showRegisterForm && (
          <>
            <View className="bg-white rounded-3xl p-6 border border-stone-100 shadow-md mb-5">
              <Text className="text-stone-400 text-xs font-semibold tracking-widest uppercase mb-5">
                Seller Verification
              </Text>

              <Text className="text-stone-700 text-sm font-semibold mb-2">
                GST Number
              </Text>

              <TextInput
                value={gst}
                onChangeText={(text) => setGst(text.toUpperCase())}
                placeholder="27AAAAA0000A1Z5"
                placeholderTextColor="#a8a29e"
                maxLength={15}
                autoCapitalize="characters"
                className="bg-stone-50 rounded-2xl px-4 py-4 text-base text-stone-900 tracking-widest font-mono"
                style={{
                  borderWidth: 1,
                  borderColor:
                    gstVerifyState === "valid" || gstVerifyState === "registered"
                      ? "#f59e0b"
                      : gstVerifyState === "invalid"
                      ? "#ef4444"
                      : "#e7e5e4",
                }}
              />

              {/* Status Messages */}
              {gstVerifyState === "checking" && (
                <View className="flex-row items-center mt-2 gap-1">
                  <ActivityIndicator size="small" color="#f59e0b" />
                  <Text className="text-amber-500 text-xs">Verifying GST...</Text>
                </View>
              )}
              {gstVerifyState === "valid" && (
                <Text
                  className="text-xs mt-2 font-semibold"
                  style={{ color: "#f59e0b" }}
                >
                  ✓ {gstVerifyMessage}
                </Text>
              )}
              {gstVerifyState === "registered" && (
                <Text
                  className="text-xs mt-2 font-semibold"
                  style={{ color: "#d97706" }}
                >
                  ⚠ {gstVerifyMessage}
                </Text>
              )}
              {gstVerifyState === "invalid" && (
                <Text className="text-red-400 text-xs mt-2">
                  {gstVerifyMessage}
                </Text>
              )}

              <View className="flex-row justify-between items-center mt-3">
                <Text className="text-xs text-stone-400">
                  Format: 27AAAAA0000A1Z5
                </Text>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: gst.length === 15 ? "#f59e0b" : "#d4d0cc" }}
                >
                  {gst.length}/15
                </Text>
              </View>

              <View className="mt-3 h-1 bg-stone-100 rounded-full overflow-hidden">
                <View
                  style={{
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: gst.length === 15 ? "#fbbf24" : "#d4d0cc",
                    width: `${(gst.length / 15) * 100}%`,
                  }}
                />
              </View>
            </View>

            <Pressable
              onPress={handleVerify}
              disabled={
                loading ||
                gstVerifyState === "checking" ||
                gstVerifyState === "invalid"
              }
              className="rounded-2xl py-4 px-5 active:opacity-80 shadow-sm items-center"
              style={{
                backgroundColor:
                  loading ||
                  gstVerifyState === "checking" ||
                  gstVerifyState === "invalid"
                    ? "#a8a29e"
                    : "#1c1917",
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-center text-base font-bold tracking-wide">
                    {gstVerifyState === "registered"
                      ? "Login with this GST"
                      : "Verify GST Number"}
                  </Text>
                  <Text
                    className="text-center text-xs mt-1"
                    style={{ color: "#a8a29e" }}
                  >
                    {gstVerifyState === "registered"
                      ? "OTP will be sent to registered mobile"
                      : "Secure verification via GSTIN portal"}
                  </Text>
                </>
              )}
            </Pressable>

            <View className="flex-row items-start mt-5 gap-2 px-1">
              <Text className="text-amber-500 text-xs font-bold mt-0.5">ℹ</Text>
              <Text className="text-stone-400 text-xs leading-5 flex-1">
                GST not registered yet?{" "}
                <Text className="text-amber-600 font-semibold">
                  Enter your GST above — we'll guide you to register.
                </Text>
              </Text>
            </View>
          </>
        )}

        {/* ── Registration Form ── */}
        {showRegisterForm && (
          <>
            <View className="bg-white rounded-3xl p-6 border border-stone-100 shadow-md mb-5 gap-5">
              <Text className="text-stone-400 text-xs font-semibold tracking-widest uppercase">
                New Firm Registration
              </Text>

              {/* GST — readonly */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  GST Number
                </Text>
                <View className="bg-stone-100 border border-stone-200 rounded-2xl px-4 py-4">
                  <Text
                    className="tracking-widest font-mono text-base"
                    style={{ color: "#a8a29e" }}
                  >
                    {gst.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Phone — Required */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Mobile Number <Text className="text-amber-500">*</Text>
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setPhone(cleaned);
                  }}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#a8a29e"
                  maxLength={10}
                  keyboardType="phone-pad"
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>

              {/* Firm Name — auto-filled or manual */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Firm Name <Text className="text-amber-500">*</Text>
                  {firmName !== "" && gstVerifyState === "valid" && (
                    <Text
                      className="text-xs font-normal"
                      style={{ color: "#f59e0b" }}
                    >
                      {" "}
                      (auto-filled from GST)
                    </Text>
                  )}
                </Text>
                <TextInput
                  value={firmName}
                  onChangeText={setFirmName}
                  placeholder="Enter your firm name"
                  placeholderTextColor="#a8a29e"
                  className="bg-stone-50 rounded-2xl px-4 py-4 text-base text-stone-900"
                  style={{
                    borderWidth: 1,
                    borderColor:
                      firmName !== "" && gstVerifyState === "valid"
                        ? "#f59e0b"
                        : "#e7e5e4",
                  }}
                />
              </View>

              {/* Tier — Required */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-3">
                  Firm Type <Text className="text-amber-500">*</Text>
                </Text>
                <View className="gap-2">
                  {TIERS.map((tier) => (
                    <Pressable
                      key={tier}
                      onPress={() => setSelectedTier(tier)}
                      className={`flex-row items-center px-4 py-3 rounded-2xl border ${
                        selectedTier === tier
                          ? "bg-stone-900 border-stone-900"
                          : "bg-stone-50 border-stone-200"
                      }`}
                    >
                      <View
                        className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          selectedTier === tier
                            ? "bg-amber-400 border-amber-400"
                            : "border-stone-300"
                        }`}
                      />
                      <Text
                        className={`text-sm font-semibold ${
                          selectedTier === tier ? "text-white" : "text-stone-700"
                        }`}
                      >
                        {tier}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Divider */}
              <View className="flex-row items-center gap-3">
                <View className="flex-1 h-px bg-stone-100" />
                <Text className="text-stone-400 text-xs font-semibold">
                  OPTIONAL DETAILS
                </Text>
                <View className="flex-1 h-px bg-stone-100" />
              </View>

              {/* WhatsApp — Optional */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  WhatsApp Number
                  <Text className="text-stone-400 text-xs font-normal">
                    {" "}
                    (optional)
                  </Text>
                </Text>
                <TextInput
                  value={whatsapp}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setWhatsapp(cleaned);
                  }}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#a8a29e"
                  maxLength={10}
                  keyboardType="phone-pad"
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>

              {/* Email — Optional */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Email Address
                  <Text className="text-stone-400 text-xs font-normal">
                    {" "}
                    (optional)
                  </Text>
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="firm@example.com"
                  placeholderTextColor="#a8a29e"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
                />
              </View>

              {/* Location — Optional */}
              <View>
                <Text className="text-stone-700 text-sm font-semibold mb-2">
                  Location / Address
                  <Text className="text-stone-400 text-xs font-normal">
                    {" "}
                    (optional)
                  </Text>
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

            <Pressable
              onPress={handleRegister}
              disabled={registerLoading}
              className="bg-stone-900 rounded-2xl py-4 px-5 active:opacity-80 shadow-sm items-center"
            >
              {registerLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-center text-base font-bold tracking-wide">
                    Register & Get OTP
                  </Text>
                  <Text
                    className="text-center text-xs mt-1"
                    style={{ color: "#a8a29e" }}
                  >
                    OTP will be sent to your mobile
                  </Text>
                </>
              )}
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