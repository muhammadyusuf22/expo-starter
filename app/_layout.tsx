import { initializeDatabase } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TamaguiProvider, Theme } from "tamagui";
import config from "../tamagui.config";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const themeMode = useThemeStore((state) => state.mode);
  const initialize = useAppStore((state) => state.initialize);

  const [fontsLoaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    async function setup() {
      try {
        // Initialize database
        await initializeDatabase();
        setDbReady(true);

        // Load all data
        await initialize();
      } catch (error) {
        console.error("[App] Setup error:", error);
      }
    }
    setup();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={config} defaultTheme={themeMode}>
        <Theme name={themeMode}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
        </Theme>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
