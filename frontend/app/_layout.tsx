import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastProvider } from '../contexts/ToastContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
        </Stack>
        <StatusBar style="auto" />
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
