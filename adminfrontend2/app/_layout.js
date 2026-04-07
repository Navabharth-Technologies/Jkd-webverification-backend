import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import * as Font from "expo-font";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import Head from "expo-router/head";

export default function Layout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // SAFEGUARD: If fonts take more than 10 seconds, boot the app anyway
    // This prevents the browser/Metro from throwing hard "6000ms timeout" errors
    const safeguardTimeout = setTimeout(() => {
      if (isMounted) {
        console.log("DEBUG: Font safeguard triggered (10s timeout reached)");
        setFontsLoaded(true);
      }
    }, 10000);

    async function loadFonts() {
      try {
        // Explicitly load fonts used in the app to prevent late-loading timeouts
        await Promise.all([
          Font.loadAsync(Ionicons.font),
          Font.loadAsync(MaterialCommunityIcons.font),
        ]);
      } catch (e) {
        console.warn("Font loading failed, proceeding with system fonts", e);
      } finally {
        if (isMounted) {
          clearTimeout(safeguardTimeout);
          setFontsLoaded(true);
        }
      }
    }
    loadFonts();

    return () => {
      isMounted = false;
      clearTimeout(safeguardTimeout);
    };
  }, []);

  // Prevent components from rendering icons until fonts are ready or safeguard is hit.
  // This blocks the browser from starting its own faulty 6s timeout timers.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#1a1f37" }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1f37" }}>
      {Platform.OS === "web" && (
        <Head>
          <link rel="icon" href="/favicon.png?v=2" />
          <link rel="shortcut icon" href="/favicon.png?v=2" />
          <style>{`
            input:-webkit-autofill,
            input:-webkit-autofill:hover, 
            input:-webkit-autofill:focus, 
            input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 30px #232840 inset !important;
                -webkit-text-fill-color: white !important;
                caret-color: white !important;
                transition: background-color 5000s ease-in-out 0s;
            }
          `}</style>
        </Head>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding-type" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="retailer-list" />
        <Stack.Screen name="vendor-list" />
        <Stack.Screen name="retailer-details" />
        <Stack.Screen name="vendor-details" />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}
