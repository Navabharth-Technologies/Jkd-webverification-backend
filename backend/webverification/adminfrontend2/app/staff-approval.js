import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";
import CustomCalendar from "./components/CustomCalendar";

// Import local logo asset
const logoImage = require("../assets/logo.png");

export default function StaffApprovalDashboard() {
  const router = useRouter();
  const { approvedId, password } = useLocalSearchParams();

  // State for local storage params
  const [recentApprovals, setRecentApprovals] = useState({});

  useEffect(() => {
    // Load persistent vault from localStorage
    if (typeof window !== "undefined") {
      const loadVault = () => {
        const storedVault = window.localStorage.getItem("staff_vault");
        if (storedVault) {
          try {
            const parsedVault = JSON.parse(storedVault);
            setRecentApprovals(parsedVault);
          } catch (e) {
            console.error("Error parsing staff_vault:", e);
          }
        }
      };

      loadVault();

      // Check if there are temporary navigation params to add to vault
      const tempId = window.localStorage.getItem("temp_approved_id");
      const tempPass = window.localStorage.getItem("temp_password");

      if (tempId && tempPass) {
        const existingVault = window.localStorage.getItem("staff_vault");
        const vault = existingVault ? JSON.parse(existingVault) : {};
        vault[tempId] = tempPass;
        window.localStorage.setItem("staff_vault", JSON.stringify(vault));
        setRecentApprovals(vault);

        // Keep these for one cycle or clear them
        window.localStorage.removeItem("temp_approved_id");
        window.localStorage.removeItem("temp_password");
      }
    }
  }, [approvedId, password]);

  const [searchTerm, setSearchTerm] = useState("");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("All");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [period, setPeriod] = useState("all");

  const filterRef = useRef(null);

  useEffect(() => {
    loadStaffMembers();

    const interval = setInterval(() => {
      loadStaffMembers(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [filterStatus, startDate, endDate]); // Removed approvedId to dependency array, no longer needed directly

  useEffect(() => {
    if (Platform.OS === "web" && isMenuOpen) {
      const handleClickOutside = (event) => {
        // @ts-ignore
        if (filterRef.current && !filterRef.current.contains(event.target)) {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMenuOpen]);

  const loadStaffMembers = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const response = await apiService.getStaffList({
        status: filterStatus === "All" ? undefined : filterStatus,
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
      });
      if (response.success) {
        const mappedStaff = response.users.map((u) => {
          let rawStatus = u.Status || "Pending";
          let normalizedStatus = "Pending";

          const lowerStatus = rawStatus.toLowerCase();
          if (lowerStatus === "approved") normalizedStatus = "Approved";
          else if (lowerStatus === "rejected") normalizedStatus = "Rejected";

          return {
            id: u.UserId,
            name: u.FullName || "N/A",
            email: u.Email || "N/A",
            phone: u.Phone || "N/A",
            status: normalizedStatus,
            date: u.CreatedAt
              ? new Date(u.CreatedAt).toLocaleDateString("en-GB")
              : "",
            aadhar: u.AadharNumber || "N/A",
            pan: u.PANNumber || "N/A",
          };
        });
        setStaff(mappedStaff);
      }
    } catch (error) {
      console.error("Failed to load staff members:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
      );

      if (newStatus === "Approved") {
        await apiService.approveUser(id);
      } else if (newStatus === "Rejected") {
        await apiService.rejectUser(id);
      }
    } catch (error) {
      alert("Failed to update status");
      loadStaffMembers();
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Approved":
        return {
          bg: "rgba(34, 197, 94, 0.2)",
          text: "#4ade80",
          border: "rgba(34, 197, 94, 0.3)",
        };
      case "Rejected":
        return {
          bg: "rgba(239, 68, 68, 0.2)",
          text: "#f87171",
          border: "rgba(239, 68, 68, 0.3)",
        };
      case "Pending":
        return {
          bg: "rgba(234, 179, 8, 0.2)",
          text: "#facc15",
          border: "rgba(234, 179, 8, 0.3)",
        };
      default:
        return {
          bg: "rgba(107, 114, 128, 0.2)",
          text: "#9ca3af",
          border: "rgba(107, 114, 128, 0.3)",
        };
    }
  };

  const statuses = ["All", "Pending", "Approved", "Rejected"];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerFlex}>
            <View style={styles.headerLeft}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => router.replace("/onboarding-type")}
                  activeOpacity={0.7}
                  style={{ marginRight: 12, padding: 4 }}
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
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Staff Management</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#94A3B8"
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Search staff..."
                  placeholderTextColor="#94A3B8"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  style={[
                    styles.searchInput,
                    Platform.OS === "web" && { outlineStyle: "none" },
                  ]}
                />

                <TouchableOpacity
                  onPress={() => setIsMenuOpen(true)}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons name="filter" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.mainLayoutContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.centerWrapper}>
            {/* Pill Filters */}
            <View style={styles.pillContainer}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.pill,
                    filterStatus === status && styles.pillActive,
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      filterStatus === status && styles.pillTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Staff List */}
            <View style={styles.verticalList}>
              {loading ? (
                <ActivityIndicator
                  color="#A855F7"
                  size="large"
                  style={{ marginTop: 40 }}
                />
              ) : (
                staff
                  .filter((s) => {
                    const matchesStatus =
                      filterStatus === "All" || s.status === filterStatus;
                    const matchesSearch = s.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());

                    return matchesStatus && matchesSearch;
                  })
                  .map((member) => {
                    const styles_status = getStatusStyles(member.status);
                    const sessionPassword = recentApprovals[member.id];
                    const isRecentlyApproved = sessionPassword !== undefined;

                    return (
                      <View key={member.id} style={styles.modernCard}>
                        <TouchableOpacity
                          style={styles.cardMain}
                          onPress={() =>
                            router.push({
                              pathname: "/staff-detail",
                              params: { id: member.id },
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.cardHeaderRow}>
                            <LinearGradient
                              colors={["#A855F7", "#EC4899"]}
                              style={styles.avatarModern}
                            >
                              <Text style={styles.avatarTextModern}>
                                {member.name.charAt(0)}
                              </Text>
                            </LinearGradient>
                            <View style={styles.nameSection}>
                              <Text style={styles.nameModern}>
                                {member.name}
                              </Text>
                              <Text style={styles.subtextModern}>
                                applied: {member.date}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statusBadgeModern,
                                {
                                  backgroundColor: styles_status.bg,
                                  borderColor: styles_status.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusTextModern,
                                  { color: styles_status.text },
                                ]}
                              >
                                {member.status}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.infoGrid}>
                            <View style={styles.infoRow}>
                              <Ionicons
                                name="mail-outline"
                                size={16}
                                color="#94A3B8"
                              />
                              <Text style={styles.infoValue}>
                                {member.email}
                              </Text>
                            </View>

                            {isRecentlyApproved && (
                              <View style={styles.infoRow}>
                                <Ionicons
                                  name="key-outline"
                                  size={16}
                                  color="#4ade80"
                                />
                                <Text
                                  style={[
                                    styles.infoValue,
                                    { color: "#4ade80", fontWeight: "bold" },
                                  ]}
                                >
                                  Password: {sessionPassword}
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              )}
            </View>
          </View>
        </ScrollView>

        {isMenuOpen && (
          <View style={styles.sideMenu} ref={filterRef}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.menuSection}>
                <Text style={styles.menuLabel}>Select Date Range</Text>
                <TouchableOpacity
                  style={styles.menuInput}
                  onPress={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  <Text
                    style={[
                      styles.menuInputText,
                      startDate && { color: "#FFFFFF" },
                    ]}
                  >
                    {startDate
                      ? endDate
                        ? `${startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                        : startDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })
                      : "All Time"}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
                {isCalendarOpen && (
                  <CustomCalendar
                    visible={isCalendarOpen}
                    onClose={() => setIsCalendarOpen(false)}
                    onSelectRange={(start, end, p) => {
                      setStartDate(start);
                      setEndDate(end);
                      setPeriod(p);
                    }}
                    startDate={startDate}
                    endDate={endDate}
                    inline={true}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1f37", // Dark Navy
  },
  header: {
    width: "100%",
    backgroundColor: "rgba(28, 30, 45, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    height: 100,
    justifyContent: "center",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
      },
    }),
  },
  headerInner: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  headerFlex: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: "center",
  },
  headerRight: {
    flex: 2,
    alignItems: "flex-end",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  logo: {
    width: 300,
    height: 130,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    width: "100%",
    maxWidth: 300,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  mainLayoutContainer: {
    flex: 1,
    flexDirection: "row",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 32,
    alignItems: "center",
  },
  centerWrapper: {
    width: "100%",
    maxWidth: 800,
    paddingHorizontal: 20,
  },
  pillContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  pillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "#A855F7",
  },
  pillText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  verticalList: {
    gap: 20,
  },
  modernCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  cardMain: {
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatarModern: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTextModern: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  nameSection: {
    flex: 1,
  },
  nameModern: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  subtextModern: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  subtextSmall: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 1,
  },
  statusBadgeModern: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusTextModern: {
    fontSize: 12,
    fontWeight: "bold",
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoValue: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  inlineActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  inlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  rejectInline: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.05)",
  },
  approveInline: {},
  rejectText: {
    color: "#f87171",
    fontWeight: "bold",
  },
  approveText: {
    color: "#4ade80",
    fontWeight: "bold",
  },
  sideMenu: {
    width: 320,
    backgroundColor: "#1E212E",
    height: "100%",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
    padding: 24,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  menuTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  menuContent: {
    flex: 1,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuLabel: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  menuInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 14,
  },
  menuInputText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
