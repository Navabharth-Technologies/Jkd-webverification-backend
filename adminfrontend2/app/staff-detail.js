import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";

const logoImage = require("../assets/logo.png");

export default function StaffDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (id) {
      loadUserDetails();
    }
  }, [id]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserById(id);
      if (response.success) {
        setUserData(response.user);
      } else {
        setError("User not found");
      }
    } catch (err) {
      setError(err.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoadingAction("approve");
      const response = await apiService.approveUser(id);
      if (response.success) {
        // Redirect to list with password if available
        if (response.password) {
          // Direct window.localStorage usage for web
          if (typeof window !== "undefined") {
            try {
              // Get existing vault or create new
              const existingVault = window.localStorage.getItem("staff_vault");
              const vault = existingVault ? JSON.parse(existingVault) : {};

              // Add/Update entry
              vault[String(id)] = response.password;

              // Save back to localStorage
              window.localStorage.setItem("staff_vault", JSON.stringify(vault));

              // Compatibility with existing logic (can be removed later)
              window.localStorage.setItem("temp_approved_id", String(id));
              window.localStorage.setItem("temp_password", response.password);
            } catch (e) {
              console.error("LocalStorage error:", e);
            }
          }
          router.replace("/staff-approval");
        } else {
          router.replace("/staff-approval");
        }
      }
    } catch (err) {
      // No alert here, as per instruction
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = () => {
    setShowRejectInput(true);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }

    try {
      setLoadingAction("reject");
      const response = await apiService.rejectUser(id, rejectReason);
      if (response.success) {
        alert("Staff Rejected");
        router.replace("/staff-approval");
      }
    } catch (err) {
      alert("Failed to reject user");
    } finally {
      setLoadingAction(null);
      setShowRejectInput(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>Loading verification details...</Text>
      </View>
    );
  }

  if (error || !userData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Something went wrong"}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          {/* Left: Back + Logo */}
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace("/onboarding-type")}
              activeOpacity={0.7}
            >
              <Image
                source={logoImage}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Center: Title */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Staff Verification</Text>
          </View>

          {/* Right: Spacer to balance centering */}
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              style={styles.avatarLarge}
            >
              {userData.ProfilePhoto ? (
                <Image
                  source={{
                    uri: `data:image/png;base64,${userData.ProfilePhoto}`,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.avatarTextLarge}>
                  {userData.FullName ? userData.FullName.charAt(0) : "U"}
                </Text>
              )}
            </LinearGradient>
            <Text style={styles.fullName}>{userData.FullName || "N/A"}</Text>
          </View>

          {/* Contact Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" />
              <View>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>
                  {userData.Email || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" />
              <View>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>
                  {userData.Phone || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              <View>
                <Text style={styles.detailLabel}>Registration Date</Text>
                <Text style={styles.detailValue}>
                  {userData.CreatedAt
                    ? new Date(userData.CreatedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={20} color="#94A3B8" />
              <View>
                <Text style={styles.detailLabel}>Aadhaar Number</Text>
                <Text style={styles.detailValue}>
                  {userData.AadharNumber || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#94A3B8"
              />
              <View>
                <Text style={styles.detailLabel}>PAN Number</Text>
                <Text style={styles.detailValue}>
                  {userData.PANNumber || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#94A3B8"
              />
              <View>
                <Text style={styles.detailLabel}>Current Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        userData.Status === "Approved"
                          ? "#4ade80"
                          : userData.Status === "Rejected"
                            ? "#f87171"
                            : "#facc15",
                    },
                  ]}
                >
                  {userData.Status}
                </Text>
              </View>
            </View>
          </View>

          {/* Generated Credentials Section (Bottom Right) */}
          {generatedPassword && (
            <View style={styles.credentialsContainer}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Email:</Text>
                <Text style={styles.credentialValue}>{userData.Email}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password:</Text>
                <Text style={styles.credentialValue}>{generatedPassword}</Text>
              </View>
            </View>
          )}

          {/* Reject Input Section */}
          {showRejectInput && (
            <View style={styles.rejectInputContainer}>
              <Text style={styles.rejectLabel}>Reason for Rejection:</Text>
              <TextInput
                style={styles.rejectInput}
                placeholder="Enter reason..."
                placeholderTextColor="#94A3B8"
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
              />

              <View style={styles.rejectActions}>
                <TouchableOpacity
                  style={[
                    styles.rejectActionButton,
                    { backgroundColor: "#64748B" },
                  ]}
                  onPress={() => setShowRejectInput(false)}
                >
                  <Text style={styles.rejectActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.rejectActionButton,
                    { backgroundColor: "#EF4444" },
                  ]}
                  onPress={submitReject}
                >
                  <Text style={styles.rejectActionText}>Submit Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Footer Action Buttons */}
        {!showRejectInput && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.approveButton,
                (loadingAction !== null ||
                  userData.Status === "Approved" ||
                  !!generatedPassword) &&
                  styles.disabledButton,
              ]}
              onPress={handleApprove}
              disabled={
                loadingAction !== null ||
                userData.Status === "Approved" ||
                !!generatedPassword
              }
            >
              {loadingAction === "approve" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {userData.Status === "Approved" ? "Approved" : "Approve"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.rejectButton,
                loadingAction !== null && styles.disabledButton,
              ]}
              onPress={handleReject}
              disabled={loadingAction !== null}
            >
              {/* Reject Button never loads itself here, it just opens input. Only Submit Reject loads. */}
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1f37",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#1a1f37",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    height: 100,
    backgroundColor: "rgba(28, 30, 45, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
  },
  backButton: {
    marginRight: 20,
  },
  logo: {
    width: 300,
    height: 130,
    marginRight: 0,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  avatarTextLarge: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "bold",
  },
  fullName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  username: {
    color: "#A855F7",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsContainer: {
    width: "100%",
    gap: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailLabel: {
    color: "#94A3B8",
    fontSize: 13,
    marginBottom: 2,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 600,
    gap: 16,
    marginTop: 32,
  },
  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#22C55E",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: "#f87171",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  backLink: {
    padding: 10,
  },
  backLinkText: {
    color: "#A855F7",
    fontSize: 16,
    fontWeight: "600",
  },
  credentialsContainer: {
    width: "100%",
    marginTop: 24,
    padding: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  credentialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  credentialLabel: {
    color: "#94A3B8",
    fontSize: 14,
  },
  credentialValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Platform.select({ web: "monospace", default: undefined }),
  },
  rejectInputContainer: {
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  rejectLabel: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "bold",
  },
  rejectInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    color: "#FFFFFF",
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  rejectActions: {
    flexDirection: "row",
    gap: 12,
  },
  rejectActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectActionText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
