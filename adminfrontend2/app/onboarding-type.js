import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  SafeAreaView,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Import local logo asset
const logoImage = require("../assets/logo.png");

export default function OnboardingTypeScreen() {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    if (Platform.OS === "web") {
      const savedName = localStorage.getItem("user_name");
      if (savedName) {
        setUserName(savedName);
      }
    }
  }, []);

  const handleLogout = () => {
    // console.log('Attempting logout...');
    // Clear session data
    if (Platform.OS === "web") {
      localStorage.removeItem("user_name");
    }
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Backdrop Layer to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        />
      )}

      <View style={styles.card}>
        {/* Internal Backdrop to close dropdown when clicking inside the card */}
        {isDropdownOpen && (
          <TouchableOpacity
            style={styles.internalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
          />
        )}

        {/* Profile Icon in Top Right */}
        <TouchableOpacity
          style={styles.profileIconContainer}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          activeOpacity={0.7}
        >
          <View style={styles.profileIconCircle}>
            <Ionicons name="person-outline" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <LinearGradient
                colors={["#A855F7", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.smallAvatar}
              >
                <Ionicons name="person-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.userName}>{userName}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#f87171"
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => router.replace("/onboarding-type")}
          activeOpacity={0.7}
        >
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>

        {/* Title and Subtitle */}
        <View style={styles.header}>
          <Text style={styles.title}>Verification Of Onboarding Details</Text>
          <Text style={styles.subtitle}>
            select an option below to View Details
          </Text>
        </View>

        {/* Selection Buttons */}
        <View style={styles.optionsContainer}>
          <Pressable
            style={({ hovered }) => [
              styles.optionButton,
              hovered && styles.optionHovered,
            ]}
            onPress={() => router.push("/staff-approval")}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(168, 85, 247, 0.15)" },
                ]}
              >
                <Ionicons name="people-outline" size={22} color="#A855F7" />
              </View>
              <Text style={styles.optionText}>Staff Executive Approval</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable
            style={({ hovered }) => [
              styles.optionButton,
              hovered && styles.optionHovered,
            ]}
            onPress={() => router.push("/retailer-list")}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(168, 85, 247, 0.15)" },
                ]}
              >
                <Ionicons name="storefront-outline" size={22} color="#A855F7" />
              </View>
              <Text style={styles.optionText}>Retailer Details</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          <Pressable
            style={({ hovered }) => [
              styles.optionButton,
              hovered && styles.optionHovered,
            ]}
            onPress={() => router.push("/vendor-list")}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: "rgba(168, 85, 247, 0.15)" },
                ]}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={22}
                  color="#A855F7"
                />
              </View>
              <Text style={styles.optionText}>Vendor Details</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
        </View>



        <TouchableOpacity
          style={styles.dashboardLink}
          onPress={() => router.push("/dashboard")}
          activeOpacity={0.7}
        >
          <View style={styles.dashboardLinkContent}>
            <Ionicons
              name="grid-outline"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.dashboardLinkText}>Admin Dashboard</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1f37", // Updated background
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    position: "relative",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: "transparent",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)", // Glass effect
    borderRadius: 24,
    padding: 30, // Reduced padding
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    position: "relative",
    zIndex: 100, // Ensure card is above backdrop
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...Platform.select({
      web: {
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(20px)",
      },
      native: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  profileIconContainer: {
    position: "absolute",
    top: 24,
    right: 24,
    zIndex: 10,
  },
  dropdown: {
    position: "absolute",
    top: 80,
    right: 24,
    width: 220,
    backgroundColor: "#1E212E",
    borderRadius: 16,
    padding: 8,
    zIndex: 1000,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(20px)",
      },
    }),
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    color: "#f87171",
    fontSize: 15,
    fontWeight: "600",
  },
  profileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  logoContainer: {
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 300, // Further reduced
    height: 150, // Further reduced
    marginBottom: -30,
    marginLeft: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32, // Reduced margin
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20, // Further reduced
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6, // Further reduced
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 12, // Further reduced
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
    gap: 12, // Reduced gap
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14, // Slightly smaller radius
    padding: 8, // Further reduced
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    ...Platform.select({
      web: {
        transition: "all 0.3s ease",
      },
    }),
  },
  optionHovered: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    transform: [{ scale: 1.02 }],
    ...Platform.select({
      web: {
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
    }),
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 32, // Further reduced
    height: 32, // Further reduced
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 14, // Further reduced
    fontWeight: "600",
  },
  dashboardLink: {
    marginTop: 24, // Reduced margin
    width: "100%",
    alignItems: "center",
  },
  dashboardLinkContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 16, // Reduced padding
    backgroundColor: "#9f00d7", // Updated purple background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9f00d7", // Match background for a solid look
  },
  dashboardLinkText: {
    color: "#FFFFFF", // Updated to white
    fontSize: 13, // Reduced font size
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  navMenuButtonContainer: {
    position: "absolute",
    top: 24,
    left: 24,
    zIndex: 10,
  },
  navMenuDropdown: {
    position: "absolute",
    top: 80,
    left: "50%",
    marginLeft: -240 + 24, // Adjusted relative to card maxWidth (480) and padding
    backgroundColor: "#1E212E",
    borderRadius: 12,
    padding: 8,
    zIndex: 2000,
    minWidth: 180,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
      },
    }),
  },
  navMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  navMenuText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  navMenuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1500,
    backgroundColor: "transparent",
  },
  internalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: "transparent",
  },
});
