import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://meal-planner-api-82e5.onrender.com/api';
export const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('meal-planner-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function cache<T>(key: string, value?: T): Promise<T | null> {
  if (value !== undefined) await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(value));
  const stored = await AsyncStorage.getItem(`cache:${key}`);
  return stored ? JSON.parse(stored) as T : null;
}
export async function saveToken(token: string) { await SecureStore.setItemAsync('meal-planner-token', token); }
export async function clearToken() { await SecureStore.deleteItemAsync('meal-planner-token'); }
export async function queuedWrite(path: string, method: 'post' | 'put' | 'delete', data?: unknown) {
  const queue = JSON.parse((await AsyncStorage.getItem('offline-queue')) || '[]');
  queue.push({ path, method, data });
  await AsyncStorage.setItem('offline-queue', JSON.stringify(queue));
}
export async function flushQueue() {
  const queue = JSON.parse((await AsyncStorage.getItem('offline-queue')) || '[]');
  for (const item of queue) await api.request({ url: item.path, method: item.method, data: item.data });
  await AsyncStorage.removeItem('offline-queue');
}
