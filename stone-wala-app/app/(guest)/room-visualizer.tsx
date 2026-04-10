import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateMarbleFloor } from '../../services/visualizerService';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_SIZE = (SCREEN_W - 48) / 2;

interface PickedImage {
  uri: string;
}

type Stage = 'idle' | 'uploading' | 'generating' | 'done' | 'error';

const PROGRESS_MESSAGES = {
  uploading: [
    'Uploading your images…',
    'Preparing room photo…',
    'Uploading marble texture…',
  ],
  generating: [
    'AI is analysing your room…',
    'Mapping marble to the floor…',
    'Blending lighting & reflections…',
    'Polishing the final surface…',
    'Almost there…',
  ],
};

export default function RoomVisualizerScreen() {
  const router = useRouter();

  const [roomImage,   setRoomImage]   = useState<PickedImage | null>(null);
  const [marbleImage, setMarbleImage] = useState<PickedImage | null>(null);
  const [resultUrl,   setResultUrl]   = useState<string | null>(null);
  const [stage,       setStage]       = useState<Stage>('idle');
  const [progress,    setProgress]    = useState(0);
  const [msgIndex,    setMsgIndex]    = useState(0);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Ref so ticker is always clearable from anywhere — no stale closure issues
  const tickerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseSwitchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTicker = useCallback(() => {
    if (tickerRef.current)    { clearInterval(tickerRef.current);  tickerRef.current    = null; }
    if (phaseSwitchRef.current){ clearTimeout(phaseSwitchRef.current); phaseSwitchRef.current = null; }
  }, []);

  // ── Pick image ──────────────────────────────────────────────────────────────
  const pickImage = useCallback(async (target: 'room' | 'marble') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const picked: PickedImage = { uri: result.assets[0].uri };
    if (target === 'room') setRoomImage(picked);
    else setMarbleImage(picked);

    setResultUrl(null);
    setStage('idle');
    setErrorMsg(null);
  }, []);

  // ── Progress ticker ─────────────────────────────────────────────────────────
  const startTicker = useCallback(
    (stageKey: 'uploading' | 'generating', from: number, to: number) => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      let current = from;
      let msgIdx = 0;
      setMsgIndex(0);

      tickerRef.current = setInterval(() => {
        current += Math.floor(Math.random() * 2) + 1;
        if (current >= to) {
          current = to;
          if (tickerRef.current) clearInterval(tickerRef.current);
          tickerRef.current = null;
        }
        setProgress(current);
        msgIdx = (msgIdx + 1) % PROGRESS_MESSAGES[stageKey].length;
        setMsgIndex(msgIdx);
      }, 1500);
    },
    []
  );

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!roomImage || !marbleImage) {
      Alert.alert('Missing images', 'Please upload both a room photo and a marble texture.');
      return;
    }

    clearTicker();
    setStage('uploading');
    setProgress(5);
    setResultUrl(null);
    setErrorMsg(null);

    // Phase 1: uploading 5 → 30%
    startTicker('uploading', 5, 30);

    // Phase 2: switch to generating after 5s
    phaseSwitchRef.current = setTimeout(() => {
      setStage('generating');
      startTicker('generating', 30, 88);
    }, 5000);

    try {
      const result = await generateMarbleFloor(roomImage.uri, marbleImage.uri);
      clearTicker();
      setProgress(100);
      setResultUrl(result.resultUrl);
      setStage('done');
    } catch (err: any) {
      clearTicker();
      setErrorMsg(err.message || 'Generation failed. Please try again.');
      setStage('error');
      setProgress(0);
    }
  }, [roomImage, marbleImage, startTicker, clearTicker]);

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!resultUrl) return;
    setDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow media library access in Settings.');
        return;
      }

      const filename  = `stone-wala-floor-${Date.now()}.jpg`;
      const localPath = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.downloadAsync(resultUrl, localPath);
      await MediaLibrary.saveToLibraryAsync(localPath);
      Alert.alert('✅ Saved!', 'Generated image saved to your photo gallery.');
    } catch (err: any) {
      Alert.alert('Download failed', err.message || 'Could not save the image.');
    } finally {
      setDownloading(false);
    }
  }, [resultUrl]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    clearTicker();
    setRoomImage(null);
    setMarbleImage(null);
    setResultUrl(null);
    setStage('idle');
    setErrorMsg(null);
    setProgress(0);
  }, [clearTicker]);

  const isLoading   = stage === 'uploading' || stage === 'generating';
  const canGenerate = !!roomImage && !!marbleImage && !isLoading;
  const currentMsg  =
    PROGRESS_MESSAGES[stage === 'uploading' ? 'uploading' : 'generating']?.[msgIndex] ?? '';

  return (
 
<>
      {/* ── Header ──────────────────────────────────────── */}
<LinearGradient
  colors={["#0f3f5a", "#1f5f7a", "#3f8fb0", "#6bb6d6"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  className="px-5 py-5 flex-row items-center"
>

  {/* Back Button */}
  <Pressable
    onPress={() => router.back()}
    className="flex-row items-center bg-white/10 border border-white/20 active:bg-white/20 rounded-xl px-3 py-2 mr-3"
  >
    <Text className="text-white text-sm font-bold">←</Text>
  </Pressable>

  {/* Title Section */}
  <View className="flex-1 justify-center">
    <Text className="text-white text-base font-bold tracking-tight">
      Room Visualizer
    </Text>
    <Text className="text-sky-100 text-xs mt-0.5">
      AI-powered marble floor preview
    </Text>
  </View>

  {/* AI Badge */}
  <View className="bg-white/90 px-3 py-1 rounded-lg ml-3">
    <Text className="text-[#1f5f7a] text-xs font-bold">AI</Text>
  </View>

</LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Info banner ── */}
        <View className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-5 flex-row gap-3 items-start">
          <Ionicons name="sparkles" size={18} color="#5c99b3" style={{ marginTop: 1 }} />
          <Text className="text-sky-600 text-sm flex-1 leading-5">
            Upload a room photo and a marble slab image. Our AI will seamlessly replace the floor with your chosen marble texture.
          </Text>
        </View>

        {/* ── Image cards ── */}
        <View className="flex-row gap-3 mb-4">
          <ImagePickCard
            label="Room Photo"
            subLabel="Interior space"
            icon="home-outline"
            image={roomImage}
            cardSize={CARD_SIZE}
            onPress={() => pickImage('room')}
          />
          <ImagePickCard
            label="Marble Texture"
            subLabel="Stone slab pattern"
            icon="layers-outline"
            image={marbleImage}
            cardSize={CARD_SIZE}
            onPress={() => pickImage('marble')}
          />
        </View>

        {/* ── Generate button ── */}
        <TouchableOpacity
  onPress={handleGenerate}
  disabled={!canGenerate}
  className={`rounded-2xl py-4 flex-row items-center justify-center gap-2.5 mb-5 ${
    canGenerate ? 'bg-[#1f5f7a]' : 'bg-sky-50 border border-sky-200'
  }`}
  activeOpacity={0.85}
>
  {isLoading ? (
    <ActivityIndicator size="small" color="#5c99b3" />
  ) : (
    <Ionicons
      name="sparkles"
      size={20}
      color={canGenerate ? '#a0d3e6' : '#3f8fb0'}
    />
  )}

  <Text
    className={`text-base font-bold tracking-tight ${
      canGenerate ? 'text-[#f0f9ff]' : 'text-[#3f8fb0]'
    }`}
  >
    {isLoading ? 'Generating…' : 'Generate Floor'}
  </Text>
</TouchableOpacity>

        {/* ── Progress card ── */}
       {isLoading && (
  <View className="bg-[#f0f9ff] rounded-3xl p-5 mb-5 shadow-sm">
    
    <View className="flex-row justify-between items-center mb-3">
      <Text
        className="text-[#1f5f7a] font-semibold text-sm flex-1 mr-2"
        numberOfLines={1}
      >
        {currentMsg}
      </Text>

      <Text className="font-bold text-sm text-[#5c99b3]">
        {progress}%
      </Text>
    </View>

    <View className="bg-[#dbeafe] rounded-full overflow-hidden h-[6px]">
      <View
        className="h-full rounded-full bg-[#3f8fb0]"
        style={{ width: `${progress}%` }}
      />
    </View>

    <Text className="text-[#6b9fb8] text-xs mt-3 text-center">
      {stage === 'uploading'
        ? 'Uploading images to AI server…'
        : 'AI is processing your room. This may take 30–90 seconds.'}
    </Text>

  </View>
)}

        {/* ── Error card ── */}
        {stage === 'error' && errorMsg && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex-row gap-3 items-start">
            <Ionicons name="alert-circle-outline" size={20} color="#ef4444" style={{ marginTop: 1 }} />
            <View className="flex-1">
              <Text className="text-red-600 font-semibold text-sm mb-1">Generation Failed</Text>
              <Text className="text-red-700 text-xs leading-5">{errorMsg}</Text>
            </View>
          </View>
        )}

        {/* ── Result card ── */}
        {resultUrl && stage === 'done' && (
          <ResultCard
            resultUrl={resultUrl}
            downloading={downloading}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}

        {/* ── Tips ── */}
        {stage === 'idle' && <TipsCard />}

      </ScrollView>
  </>
  );
}

// ─── Image Pick Card ──────────────────────────────────────────────────────────
function ImagePickCard({
  label, subLabel, icon, image, cardSize, onPress,
}: {
  label: string;
  subLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  image: PickedImage | null;
  cardSize: number;
  onPress: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text className="text-stone-800 font-semibold text-sm mb-0.5">{label}</Text>
      <Text className="text-stone-500 text-xs mb-2">{subLabel}</Text>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          width: cardSize,
          height: cardSize,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: '#fff',
          borderWidth: image ? 0 : 1.5,
          borderColor: '#e7e5e4',
          borderStyle: image ? 'solid' : 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 6,
        }}
      >
        {image ? (
          <>
            <Image
              source={{ uri: image.uri }}
              style={{ width: cardSize, height: cardSize }}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(28,25,23,0.7)',
                paddingVertical: 8,
                alignItems: 'center',
              }}
            >
              <Text className="text-stone-50 text-xs font-semibold">Tap to change</Text>
            </View>
          </>
        ) : (
          <View className="items-center gap-2">
            <View className="bg-sky-50 rounded-2xl p-3.5">
              <Ionicons name={icon} size={28} color="#5c99b3" />
            </View>
            <Text className="text-stone-500 text-xs font-medium">Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({
  resultUrl, downloading, onDownload, onReset,
}: {
  resultUrl: string;
  downloading: boolean;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <View
      className="bg-white rounded-3xl overflow-hidden mb-5"
      style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 }}
    >
      <View className="bg-green-50 border-b border-green-100 px-4 py-3 flex-row items-center gap-2">
        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
        <Text className="text-green-700 font-bold text-sm">Floor Generated Successfully!</Text>
      </View>

      <Image
        source={{ uri: resultUrl }}
        style={{ width: '100%', aspectRatio: 1 }}
        resizeMode="cover"
      />

      <View className="p-4 gap-3">
        <TouchableOpacity
          onPress={onDownload}
          disabled={downloading}
          className="rounded-2xl py-3.5 flex-row items-center justify-center gap-2 bg-sky-50 border border-sky-200 text-sky-600"
         
          activeOpacity={0.85}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#f59e0b" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#3f8fb0" />
          )}
          <Text className="text-sky-600 font-bold text-base">
            {downloading ? 'Saving…' : 'Save to Gallery'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onReset}
          className="border border-stone-200 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={18} color="#78716c" />
          <Text className="text-stone-500 font-semibold text-base">Try Another Design</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tips Card ────────────────────────────────────────────────────────────────
function TipsCard() {
  const tips = [
    { icon: 'camera-outline' as const, text: 'Use a clear, well-lit room photo taken from a straight angle.' },
    { icon: 'image-outline' as const, text: 'Choose a high-resolution marble texture for best results.' },
    { icon: 'resize-outline' as const, text: 'Rooms with visible floor area produce the most realistic output.' },
  ];

  return (
    <View
      className="bg-white rounded-3xl p-4"
      style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 }}
    >
      <Text className="text-stone-900 font-bold text-base mb-3">Tips for best results</Text>
      <View className="gap-3">
        {tips.map((tip, i) => (
          <View key={i} className="flex-row gap-3 items-start">
            <View className="bg-sky-50 rounded-xl p-2">
              <Ionicons name={tip.icon} size={16} color="#3f8fb0" />
            </View>
            <Text className="text-stone-600 text-sm flex-1 leading-5 mt-1">{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}