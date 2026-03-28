import RichTextEditor from "@/components/vendor/RichTextEditor";
import { API_CONFIG } from "@/constants/api";
import { getAllCategories } from "@/services/categoryService";
import { getProductById } from "@/services/vendorService";
import { getToken } from "@/utils/storage";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
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

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export default function EditProduct() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // ── Loading ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form State ───────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thirdCategory, setThirdCategory] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // ── Media ────────────────────────────────────────────
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [newVideo, setNewVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // ── Categories ───────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // ── Original Data — Change Tracking ──────────────────
  const [originalData, setOriginalData] = useState({
    name: "",
    description: "",
    subCategory: "",
    thirdCategory: "",
    categoryId: null as number | null,
  });

  // ── Has Changes ──────────────────────────────────────
  const hasChanges =
    name !== originalData.name ||
    description !== originalData.description ||
    subCategory !== originalData.subCategory ||
    thirdCategory !== originalData.thirdCategory ||
    selectedCategoryId !== originalData.categoryId ||
    newImage !== null ||
    newVideo !== null;

  // ── Fetch Data ───────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productRes, catRes] = await Promise.all([
        getProductById(Number(id)),
        getAllCategories(),
      ]);

      const p = productRes.data;
      setName(p.name || "");
      setDescription(p.description || "");
      setSubCategory(p.sub_category || "");
      setThirdCategory(p.third_category || "");
      setExistingImageUrl(p.image_url || null);

      const cats = catRes.data || [];
      setCategories(cats);
      setCategoriesLoading(false);

      const matched = cats.find((c: Category) => c.name === p.category_name);
      if (matched) setSelectedCategoryId(matched.id);

      setOriginalData({
        name: p.name || "",
        description: p.description || "",
        subCategory: p.sub_category || "",
        thirdCategory: p.third_category || "",
        categoryId: matched?.id || null,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load product.");
      setCategoriesLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // ── Pick Image ───────────────────────────────────────
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setNewImage(result.assets[0]);
  };

  // ── Pick Video ───────────────────────────────────────
  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });
    if (!result.canceled) setNewVideo(result.assets[0]);
  };

  // ── Validate ─────────────────────────────────────────
  const validate = () => {
    if (name.trim().length < 3) {
      Alert.alert("Invalid", "Product name must be at least 3 characters.");
      return false;
    }
    if (!selectedCategoryId) {
      Alert.alert("Invalid", "Please select a category.");
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const token = await getToken();

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("category_id", String(selectedCategoryId));
      formData.append("description", description.trim());
      formData.append("sub_category", subCategory.trim());
      formData.append("third_category", thirdCategory.trim());

      if (newImage) {
        formData.append("image", {
          uri: newImage.uri,
          type: newImage.mimeType || "image/jpeg",
          name: newImage.fileName || "product.jpg",
        } as any);
      }

      if (newVideo) {
        formData.append("video", {
          uri: newVideo.uri,
          type: newVideo.mimeType || "video/mp4",
          name: newVideo.fileName || "product.mp4",
        } as any);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.error || "Failed to update product.");
        return;
      }

      setOriginalData({
        name: name.trim(),
        description: description.trim(),
        subCategory: subCategory.trim(),
        thirdCategory: thirdCategory.trim(),
        categoryId: selectedCategoryId,
      });
      setNewImage(null);
      setNewVideo(null);

      Alert.alert("Success 🎉", "Product updated successfully!", [
        {
          text: "OK",
          onPress: () => router.replace({
            pathname: "/(vendor)/my-products",
            params: { refresh: "true" },
          }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
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
          Loading product…
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
          onPress={fetchData}
          className="bg-amber-500 active:bg-amber-400 px-8 py-3.5 rounded-2xl"
        >
          <Text className="text-stone-950 font-bold text-sm tracking-wide">
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-stone-100"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#f59e0b"]}
          tintColor="#f59e0b"
        />
      }
    >
      {/* ── Header ──────────────────────────────────────── */}
      <View className="bg-stone-950 px-6 pt-14 pb-10">

        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center self-start bg-amber-500/15 border border-amber-500/30 active:bg-stone-700/15 rounded-full px-4 py-2 mb-8 gap-1.5"
        >
          <Text className="text-amber-600 text-sm">←</Text>
          <Text className="text-amber-600 text-sm font-semibold">Back</Text>
        </Pressable>

        {/* Title Row */}
        <View className="flex-row items-center gap-4">
          <View className="p-0.5 rounded-2xl bg-amber-500/20">
            <View className="w-14 h-14 bg-amber-500 rounded-2xl items-center justify-center">
              <Text className="text-white text-5xl">✍</Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold tracking-tight">
              Edit Product
            </Text>
            <Text className="text-stone-400 text-sm font-medium mt-0.5">
              {hasChanges ? "Unsaved changes" : "No changes yet"}
            </Text>
          </View>

          {hasChanges && (
            <View className="bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full self-start">
              <Text className="text-amber-400 text-xs font-bold tracking-wide">
                Edited
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-4 pt-5 pb-8 gap-4">

        {/* ── Product Details Card ─────────────────────── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-amber-400" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Product Details
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5 mb-5" />

          <View className="px-5 pb-5 gap-5">

            {/* Product Name */}
            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                  Product Name
                </Text>
                <Text className="text-amber-500 text-xs font-bold">*</Text>
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholderTextColor="#a8a29e"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>

            {/* Category */}
            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                  Category
                </Text>
                <Text className="text-amber-500 text-xs font-bold">*</Text>
              </View>

              {categoriesLoading ? (
                <View className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 items-center">
                  <ActivityIndicator size="small" color="#f59e0b" />
                </View>
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`border rounded-2xl px-4 py-4 flex-row justify-between items-center ${
                      showCategoryDropdown
                        ? "bg-amber-50 border-amber-300"
                        : "bg-stone-50 border-stone-200"
                    }`}
                  >
                    <Text
                      className={
                        selectedCategory
                          ? "text-stone-900 text-base font-medium"
                          : "text-stone-400 text-base"
                      }
                    >
                      {selectedCategory ? selectedCategory.name : "Select a category"}
                    </Text>
                    <View className="w-6 h-6 rounded-full bg-stone-100 items-center justify-center">
                      <Text className="text-stone-500 text-xs">
                        {showCategoryDropdown ? "▲" : "▼"}
                      </Text>
                    </View>
                  </Pressable>

                  {showCategoryDropdown && (
                    <View className="bg-white border border-stone-200 rounded-2xl mt-1 overflow-hidden shadow-sm">
                      {categories.map((cat, index) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            setSelectedCategoryId(cat.id);
                            setShowCategoryDropdown(false);
                          }}
                          className={`px-4 py-3.5 active:bg-stone-50 flex-row items-center justify-between ${
                            index < categories.length - 1 ? "border-b border-stone-100" : ""
                          } ${selectedCategoryId === cat.id ? "bg-amber-50" : ""}`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              cat.parent_id ? "pl-4 text-stone-500" : "text-stone-800"
                            } ${selectedCategoryId === cat.id ? "text-amber-600" : ""}`}
                          >
                            {cat.parent_id ? `└ ${cat.name}` : cat.name}
                          </Text>
                          {selectedCategoryId === cat.id && (
                            <View className="w-5 h-5 rounded-full bg-amber-500 items-center justify-center">
                              <Text className="text-white text-xs font-black">✓</Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Description — RichTextEditor */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Description
              </Text>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe your product — finish, size, colour, origin, availability…"
                minHeight={120}
              />
              <Text className="text-stone-400 text-xs font-medium mt-0.5">
                Supports bold, italic, bullet points and more
              </Text>
            </View>

          </View>
        </View>

        {/* ── Sub Categories Card ──────────────────────── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-stone-300" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Sub Categories
            </Text>
            <View className="ml-auto bg-stone-100 px-2.5 py-1 rounded-full">
              <Text className="text-stone-400 text-xs font-semibold">Optional</Text>
            </View>
          </View>
          <View className="h-px bg-stone-100 mx-5 mb-5" />

          <View className="px-5 pb-5 gap-5">
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Sub Category
              </Text>
              <TextInput
                value={subCategory}
                onChangeText={setSubCategory}
                placeholder="e.g. White Marble"
                placeholderTextColor="#a8a29e"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Third Category
              </Text>
              <TextInput
                value={thirdCategory}
                onChangeText={setThirdCategory}
                placeholder="e.g. Carrara Marble"
                placeholderTextColor="#a8a29e"
                className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 text-base text-stone-900"
              />
            </View>
          </View>
        </View>

        {/* ── Media Card ───────────────────────────────── */}
        <View className="bg-white rounded-3xl border border-stone-200/60 shadow-sm overflow-hidden">
          <View className="px-5 pt-5 pb-4 flex-row items-center gap-2.5">
            <View className="w-1.5 h-5 rounded-full bg-blue-400" />
            <Text className="text-stone-400 text-xs font-bold tracking-widest uppercase">
              Media
            </Text>
          </View>
          <View className="h-px bg-stone-100 mx-5 mb-5" />

          <View className="px-5 pb-5 gap-5">

            {/* Product Image */}
            <View className="gap-1.5">
              <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                Product Image
              </Text>

              {newImage ? (
                <View>
                  <Image
                    source={{ uri: newImage.uri }}
                    className="w-full h-52 rounded-2xl"
                    resizeMode="cover"
                  />
                  <View className="absolute top-2.5 left-2.5 bg-amber-500 px-2.5 py-1 rounded-full">
                    <Text className="text-stone-950 text-xs font-black tracking-wide">
                      NEW
                    </Text>
                  </View>
                  <View className="absolute top-2.5 right-2.5">
                    <Pressable
                      onPress={() => setNewImage(null)}
                      className="bg-stone-950/80 active:opacity-70 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5"
                    >
                      <Text className="text-white text-xs font-bold">✕</Text>
                      <Text className="text-white text-xs font-semibold">Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : existingImageUrl ? (
                <View>
                  <Image
                    source={{
                     uri: existingImageUrl,
                    }}
                    className="w-full h-52 rounded-2xl"
                    resizeMode="cover"
                  />
                  <View className="absolute top-2.5 left-2.5 bg-stone-800/80 px-2.5 py-1 rounded-full">
                    <Text className="text-stone-300 text-xs font-bold tracking-wide">
                      CURRENT
                    </Text>
                  </View>
                  <View className="absolute top-2.5 right-2.5">
                    <Pressable
                      onPress={pickImage}
                      className="bg-stone-950/80 active:opacity-70 px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5"
                    >
                      <Text className="text-white text-xs font-semibold">Change Image</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={pickImage}
                  className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl py-10 items-center active:bg-amber-50 active:border-amber-300"
                >
                  <View className="w-14 h-14 rounded-2xl bg-stone-100 items-center justify-center mb-3">
                    <Text className="text-3xl">📷</Text>
                  </View>
                  <Text className="text-stone-700 text-sm font-bold">
                    Tap to select image
                  </Text>
                  <Text className="text-stone-400 text-xs font-medium mt-1">
                    JPG, PNG — Max 5MB
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Divider */}
            <View className="h-px bg-stone-100" />

            {/* Product Video */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-stone-500 text-xs font-bold uppercase tracking-wider">
                  Product Video
                </Text>
                <View className="bg-stone-100 px-2.5 py-1 rounded-full">
                  <Text className="text-stone-400 text-xs font-semibold">Optional</Text>
                </View>
              </View>

              {newVideo ? (
                <View className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-4 flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center">
                    <Text className="text-lg">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-stone-800 text-sm font-bold">
                      Video selected
                    </Text>
                    <Text
                      className="text-stone-400 text-xs font-medium mt-0.5"
                      numberOfLines={1}
                    >
                      {newVideo.fileName || "product.mp4"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setNewVideo(null)}
                    className="bg-stone-200 active:bg-stone-300 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-stone-600 text-xs font-bold">Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickVideo}
                  className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl py-8 items-center active:bg-stone-100"
                >
                  <View className="w-14 h-14 rounded-2xl bg-stone-100 items-center justify-center mb-3">
                    <Text className="text-3xl">🎥</Text>
                  </View>
                  <Text className="text-stone-700 text-sm font-bold">
                    Tap to select video
                  </Text>
                  <Text className="text-stone-400 text-xs font-medium mt-1">
                    MP4 — Max 60 seconds
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* ── Save Button ──────────────────────────────── */}
        <Pressable
          onPress={handleSubmit}
          disabled={submitting || !hasChanges}
          className={`rounded-2xl py-4 px-5 shadow-sm items-center mt-1 ${
            hasChanges ? "bg-amber-500 active:bg-amber-400" : "bg-stone-200"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#1c1917" />
          ) : (
            <View className="items-center gap-0.5">
              <Text
                className={`text-base font-black tracking-wide ${
                  hasChanges ? "text-white" : "text-stone-400"
                }`}
              >
                Save Changes
              </Text>
              <Text
                className={`text-xs font-medium ${
                  hasChanges ? "text-white" : "text-stone-400"
                }`}
              >
                {hasChanges ? "Update product on marketplace" : "No changes made"}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}