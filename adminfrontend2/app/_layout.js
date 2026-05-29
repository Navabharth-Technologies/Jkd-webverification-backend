import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import * as Font from "expo-font";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
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
        // On Web, we prioritize CDNs/CSS over local .ttf files to avoid sub-path 404s
        const fontTasks = [];
        if (Platform.OS !== "web") {
          fontTasks.push(
            Font.loadAsync(Ionicons.font),
            Font.loadAsync(MaterialCommunityIcons.font),
            Font.loadAsync(MaterialIcons.font),
            Font.loadAsync(FontAwesome.font),
            Font.loadAsync(FontAwesome5.font),
          );
        }
        
        if (fontTasks.length > 0) {
          await Promise.all(fontTasks);
        }
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
          {/* Global Icon CDNs for maximum reliability on sub-paths */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" />
          <style>{`
            /* Fallback font-faces to bridge React Native Web and CDNs */
            @font-face {
              font-family: 'MaterialIcons';
              src: url('https://fonts.gstatic.com/s/materialicons/v142/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2') format('woff2');
            }
            @font-face {
              font-family: 'Ionicons';
              src: url('https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/fonts/ionicons.ttf') format('truetype');
            }
            @font-face {
              font-family: 'Material Community Icons';
              src: url('https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/fonts/materialdesignicons-webfont.woff2?v=7.4.47') format('woff2');
            }
            @font-face {
              font-family: 'FontAwesome';
              src: url('https://use.fontawesome.com/releases/v5.15.4/webfonts/fa-solid-900.woff2') format('woff2');
            }
            
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
