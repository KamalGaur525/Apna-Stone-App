import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../constants/api';

export interface VisualizeResult {
  resultUrl: string;
}

/**
 * Sends room + marble images to our backend which proxies to WaveSpeed AI.
 * Uses native fetch with FormData — NOT axios (required for multipart RN uploads).
 */
export const generateMarbleFloor = async (
  roomUri: string,
  marbleUri: string
): Promise<VisualizeResult> => {
  const token = await SecureStore.getItemAsync('token');
  // if (!token) throw new Error('Authentication required.'); // commented for testing

  const formData = new FormData();

  // React Native FormData accepts { uri, type, name } objects directly
  formData.append('room', {
    uri: roomUri,
    type: 'image/jpeg',
    name: 'room.jpg',
  } as any);

  formData.append('marble', {
    uri: marbleUri,
    type: 'image/jpeg',
    name: 'marble.jpg',
  } as any);

  const response = await fetch(`${API_CONFIG.BASE_URL}/visualizer/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type manually — fetch sets it with boundary for FormData
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Generation failed. Please try again.');
  }

  return json.data as VisualizeResult;
};