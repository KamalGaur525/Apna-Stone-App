import { API_CONFIG, VENDOR_ENDPOINTS } from "@/constants/api";
import { getVendorProfile, updateVendorProfile } from "@/services/vendorService";
import { getToken } from "@/utils/storage";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function FirmProfile() {
  // ── Loading / Error ─────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Read-only Fields ────────────────────────────────
  const [gstNumber, setGstNumber] = useState("");
  const [firmName, setFirmName] = useState("");
  const [tier, setTier] = useState("");
  const [phone, setPhone] = useState("");

  // ── Editable Fields ─────────────────────────────────
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [about, setAbout] = useState("");

  // ── Logo Upload State ────────────────────────────────
  const [logoAsset, setLogoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // ── Original Data — Change Tracking ─────────────────
  const [originalData, setOriginalData] = useState({
    whatsapp: "", email: "", location: "", about: "",
    website: "", instagram: "", facebook: "", logoUrl: "",
  });

  // ── Has Changes Check ────────────────────────────────
  const hasChanges =
    whatsapp !== originalData.whatsapp ||
    email !== originalData.email ||
    location !== originalData.location ||
    about !== originalData.about ||
    website !== originalData.website ||
    instagram !== originalData.instagram ||
    facebook !== originalData.facebook ||
    logoUrl !== originalData.logoUrl;

  // ── Fetch Profile ────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, []);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVendorProfile();
      const d = response.data;

      // Read-only
      setGstNumber(d.gst_number || "");
      setFirmName(d.firm_name || "");
      setTier(d.tier || "");
      setPhone(d.phone || "");

      // Editable
      setLogoUrl(d.logo_url || "");
      setWhatsapp(d.whatsapp || "");
      setEmail(d.email || "");
      setFacebook(d.facebook || "");
      setInstagram(d.instagram || "");
      setWebsite(d.website || "");
      setLocation(d.location || "");
      setAbout(d.about || "");

      // ✅ Original data save — change tracking ke liye
      setOriginalData({
        whatsapp: d.whatsapp || "",
        email: d.email || "",
        location: d.location || "",
        about: d.about || "",
        website: d.website || "",
        instagram: d.instagram || "",
        facebook: d.facebook || "",
        logoUrl: d.logo_url || "",
      });
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to load profile.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Logo Press — Alert first ─────────────────────────
  const handleLogoPress = () => {
    Alert.alert(
      "Change Logo",
      "Do you want to update your firm logo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Change", onPress: pickLogo },
      ]
    );
  };

  // ── Pick Logo — same as pickImage in upload product ──
  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setLogoAsset(asset);
      await uploadLogo(asset);
    }
  };

  // ── Upload Logo — same as handleSubmit in upload product ──
  const uploadLogo = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setLogoUploading(true);
      const token = await getToken();

      const formData = new FormData();
      formData.append("logo", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || "logo.jpg",
      } as any);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${VENDOR_ENDPOINTS.UPLOAD_LOGO}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Upload Failed", data.error || "Failed to upload logo.");
        setLogoAsset(null);
        return;
      }

      // ✅ Update logoUrl with new path from server
      const newLogoUrl = data.logo_url || "";
      setLogoUrl(newLogoUrl);
      setOriginalData((prev) => ({ ...prev, logoUrl: newLogoUrl }));
      Alert.alert("Success 🎉", "Logo updated successfully!");
    } catch {
      Alert.alert("Error", "Something went wrong. Try again.");
      setLogoAsset(null);
    } finally {
      setLogoUploading(false);
    }
  };

  // ── Save Profile ─────────────────────────────────────
  const handleSave = async () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (whatsapp && whatsapp.trim().length < 10) {
      Alert.alert("Invalid WhatsApp", "Please enter a valid 10-digit number.");
      return;
    }

    try {
      setSaving(true);
      await updateVendorProfile({
        firm_name: firmName,
        gst_number: gstNumber,
        tier: tier as "Godown" | "Factory" | "Stone Seller",
        logo_url: logoUrl || undefined,
        whatsapp: whatsapp || undefined,
        email: email || undefined,
        facebook: facebook || undefined,
        instagram: instagram || undefined,
        website: website || undefined,
        location: location || undefined,
        about: about || undefined,
      });
      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(vendor)/dashboard"),
        },
      ]);
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to update profile.";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center gap-4">
        <View className="w-16 h-16 rounded-2xl bg-amber-500/10 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
        <Text className="text-stone-500 text-sm font-medium tracking-wide">
          Loading profile…
        </Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-stone-950 items-center justify-center px-8">
        <View className="w-14 h-14 rounded-2xl bg-red-500/10 items-center justify-center mb-5">
          <Text className="text-2xl">⚠</Text>
        </View>
        <Text className="text-white font-bold text-xl mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-stone-500 text-sm text-center mb-8 leading-relaxed">
          {error}
        </Text>
        <Pressable
          onPress={fetchProfile}
          className="bg-amber-500 active:bg-amber-400 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-stone-950 font-bold text-sm tracking-wide">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Helpers ───────────────────────────────────────────
  const initials =
    firmName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SV";

  // ✅ Local picked asset takes priority over server URL
  const displayLogoUri = logoAsset
    ? logoAsset.uri
    : logoUrl
    ? `${API_CONFIG.BASE_URL.replace("/api", "")}${logoUrl}`
    : null;

  return (
    <ScrollView
      className="flex-1 bg-stone-50"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
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
      {/* ── Header ─────────────────────────────────────── */}
      <View className="bg-stone-950 px-6 pt-14 pb-10">

        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 mb-8 gap-1.5"
        >
          <Text className="text-amber-600 text-sm">←</Text>
          <Text className="text-amber-600 text-sm font-semibold">Back</Text>
        </Pressable>

        {/* Avatar + Identity */}
        <View className="flex-row items-center gap-4">

          {/* ── Tappable Avatar ── */}
         <Pressable 
  onPress={handleLogoPress} 
  className="mb-4"
  style={({ pressed }) => ({
    opacity: pressed ? 0.9 : 1,
    transform: [{ scale: pressed ? 0.95 : 1 }],
  })}
> 
  <View className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
    
    {displayLogoUri ? (
      <Image
        source={{ uri: displayLogoUri }}
        className="w-20 h-20 rounded"
        resizeMode="cover"
      />
    ) : (
      <View className="w-20 h-20 rounded-2xl bg-amber-500 items-center justify-center">
        <Text className="text-white text-2xl font-bold tracking-widest shadow-sm">
          {initials}
        </Text>
      </View>
    )}
 
    <View className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-stone-900 border-[3px] border-amber-500/20 dark:border-stone-950 items-center justify-center shadow-md">
      {logoUploading ? (
        <ActivityIndicator size="small" color="#fbbf24" /> 
      ) : (
        <Feather name="camera" size={13} color="#fbbf24" />
      )}
    </View>

  </View>
</Pressable>

          <View className="flex-col">
            <View>
              <Text className="text-white text-2xl font-bold tracking-tight">
                {firmName}
              </Text>
            </View>

            <View className="flex-row items-center gap-2.5 mt-3">
              {/* Tier Badge */}
              <View className="bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                <Text className="text-amber-400 text-xs font-bold tracking-widest uppercase">
                  {tier}
                </Text>
              </View>

              <View className="bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                <Text className="text-amber-400 text-xs font-bold tracking-widest uppercase">
                  +91 {phone}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────── */}
      <View className="px-4 pt-5 pb-8 gap-4">

        {/* ── Business Info (Read-Only) ─────────────────── */}
        <View className="bg-white rounded-3xl overflow-hidden border border-stone-200/60 shadow-sm">
          {/* Card Header */}
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-stone-300" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Business Info
            </Text>
            <View className="ml-auto bg-stone-100 px-2.5 py-1 rounded-full">
              <Text className="text-stone-400 text-xs font-semibold">
                Read Only
              </Text>
            </View>
          </View>

          <View className="h-px bg-stone-100 mx-5" />

          {/* GST Row */}
          <View className="flex-row items-center px-5 py-4">
            <Text className="text-stone-500 text-sm font-semibold w-28">
              GST Number
            </Text>
            <Text className="text-stone-900 font-mono text-sm tracking-widest flex-1 text-right">
              {gstNumber || "—"}
            </Text>
          </View>

          <View className="h-px bg-stone-100 mx-5" />

          {/* Firm Name Row */}
          <View className="flex-row items-center px-5 py-4">
            <Text className="text-stone-500 text-sm font-semibold w-28">
              Firm Name
            </Text>
            <Text className="text-stone-900 text-sm font-medium flex-1 text-right">
              {firmName || "—"}
            </Text>
          </View>

          <View className="h-px bg-stone-100 mx-5" />

          {/* Tier Row */}
          <View className="flex-row items-center px-5 py-4 pb-5">
            <Text className="text-stone-500 text-sm font-semibold w-28">
              Firm Type
            </Text>
            <View className="flex-1 items-end">
              <View className="bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                <Text className="text-amber-400 text-xs font-bold tracking-widest uppercase">
                  {tier || "—"}
                </Text>
              </View>
            </View>
          </View>

          <View className="h-px bg-stone-100 mx-5" />

          {/* Phone Row */}
          <View className="flex-row items-center px-5 py-4 pb-5">
            <Text className="text-stone-500 text-sm font-semibold w-28">
              Firm Number
            </Text>
            <View className="flex-1 items-end">
              <Text className="text-stone-700 text-xs font-bold tracking-wide">
                +91 {phone}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Editable Details ─────────────────────────── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-amber-400" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Contact Details
            </Text>
          </View>

          <View className="h-px bg-stone-100 mx-5 mb-5" />

          <View className="px-5 pb-5 gap-5">
            {/* WhatsApp */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                WhatsApp Number
              </Text>
              <View className="flex-row items-center bg-stone-50 border border-stone-200 rounded-2xl px-4 gap-3">
                <Text className="text-stone-400 text-sm font-semibold">
                  +91
                </Text>
                <View className="w-px h-5 bg-stone-200" />
                <TextInput
                  value={whatsapp}
                  onChangeText={(text) =>
                    setWhatsapp(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#a8a29e"
                  maxLength={10}
                  keyboardType="phone-pad"
                  className="flex-1 py-4 text-base text-stone-900"
                />
              </View>
            </View>

            {/* Email */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Email Address
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

            {/* Location */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Location
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
                placeholderTextColor="#a8a29e"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>

            {/* About */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                About Your Firm
              </Text>
              <TextInput
                value={about}
                onChangeText={setAbout}
                placeholder="Tell customers about your firm…"
                placeholderTextColor="#a8a29e"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900 min-h-28"
              />
            </View>
          </View>
        </View>

        {/* ── Social & Web Links ───────────────────────── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-blue-400" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Social & Web
            </Text>
          </View>

          <View className="h-px bg-stone-100 mx-5 mb-5" />

          <View className="px-5 pb-5 gap-5">
            {/* Website */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Website
              </Text>
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourfirm.com"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                keyboardType="url"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>

            {/* Instagram */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Instagram
              </Text>
              <TextInput
                value={instagram}
                onChangeText={setInstagram}
                placeholder="https://instagram.com/yourfirm"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>

            {/* Facebook */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Facebook
              </Text>
              <TextInput
                value={facebook}
                onChangeText={setFacebook}
                placeholder="https://facebook.com/yourfirm"
                placeholderTextColor="#a8a29e"
                autoCapitalize="none"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>
          </View>
        </View>

        {/* ── Save Button ──────────────────────────────── */}
        <Pressable
          onPress={handleSave}
          disabled={saving || !hasChanges}
          className={`rounded-2xl py-4 px-5 shadow-sm items-center mt-1 ${
            hasChanges
              ? "bg-amber-500 active:bg-amber-400"
              : "bg-stone-200"
          }`}
        >
          {saving ? (
            <ActivityIndicator color="" />
          ) : (
            <View className="items-center gap-0.5">
              <Text className={`text-base font-black tracking-wide ${
                hasChanges ? "text-white" : "text-stone-400"
              }`}>
                Save Changes
              </Text>
              <Text className={`text-xs font-medium ${
                hasChanges ? "text-stone-100" : "text-stone-400"
              }`}>
                {hasChanges ? "Update your firm details" : "No changes made"}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}