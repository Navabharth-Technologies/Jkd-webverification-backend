import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/apiService";

// Import local logo asset
const logoImage = require("../assets/logo.png");

export function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!userId || !password) {
      setError("Please enter both User ID and password");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiService.login(userId, password);
      onLogin(response.user, response.token);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Web-specific hack: Start as readOnly to block browser autofill, enable on focus
  const [isWebAutofillBlocked, setIsWebAutofillBlocked] = useState(
    Platform.OS === "web",
  );

  const handleFocus = () => {
    if (Platform.OS === "web") {
      setIsWebAutofillBlocked(false);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={logoImage}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Login to your account</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.form}>
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>User ID</Text>
              <View style={styles.relative}>
                <View style={styles.inputIconWrapper}>
                  <Svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </Svg>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === "web" && { outlineStyle: "none" },
                  ]}
                  value={userId}
                  onChangeText={setUserId}
                  placeholder="Enter your User ID"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  readOnly={isWebAutofillBlocked}
                  onFocus={handleFocus}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.relative}>
                <View style={styles.inputIconWrapper}>
                  <Svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </Svg>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    Platform.OS === "web" && { outlineStyle: "none" },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  readOnly={isWebAutofillBlocked}
                  onFocus={handleFocus}
                />

                <TouchableOpacity
                  style={styles.eyeIconWrapper}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit}
              style={styles.buttonContainer}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading
                    ? ["#4b5563", "#6b7280", "#4b5563"]
                    : ["#9333ea", "#a855f7", "#ec4899"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Authenticating..." : "Login"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = (user, token) => {
    // Persist session data
    if (Platform.OS === "web") {
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("user_name", user.name);
      if (token) localStorage.setItem("auth_token", token);
    }
    router.replace("/onboarding-type");
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginPage onLogin={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#1a1f37", // Updated background
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "500",
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 420, // Compact proportions for elegance
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)", // Fully transparent/glass effect
    borderRadius: 16,
    padding: 20, // Refined vertical padding
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    ...Platform.select({
      web: {
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(20px)", // Crystal clear glass blur
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
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20, // Reduced from 32
  },
  logo: {
    height: 150, // Slightly smaller to fix spacing
    width: 240,
    marginTop: 0,
    marginBottom: -20,
    marginLeft: 25,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20, // Reduced from 32
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28, // Slightly reduced
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16, // Reduced from 24
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  relative: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  inputIconWrapper: {
    position: "absolute",
    left: 20,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Slightly increased opacity for better definition
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    height: 50, // Refined compact height
    paddingLeft: 60,
    paddingRight: 50, // Increased padding for eye icon
    color: "#ffffff",
    fontSize: 16,
  },
  eyeIconWrapper: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    marginTop: 32,
  },
  button: {
    height: 50, // Matches input height for consistency
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      },
      native: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
      },
    }),
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
