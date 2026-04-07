import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";
import CustomCalendar from "./components/CustomCalendar";

// Import local logo asset
const logoImage = require("../assets/logo.png");

export default function RetailerListScreen() {
  const router = useRouter();
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalRetailers, setTotalRetailers] = useState(0);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Region Selection State
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTown, setSelectedTown] = useState("");

  // Dropdown Visibility State
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showTownDropdown, setShowTownDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  // Calendar State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [period, setPeriod] = useState("");

  // Advanced Filter State
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isApplication, setIsApplication] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [dynamicLocationData, setDynamicLocationData] = useState({});

  const filterRef = useRef(null);
  const LIMIT = 20;

  useEffect(() => {
    loadRetailers();
    loadStaff();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await apiService.getLocations();
      setDynamicLocationData(data);
    } catch (err) {
      console.error("Failed to load locations:", err);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await apiService.getStaff();
      if (response.success) {
        setStaffList(response.data);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  const loadRetailers = async (isLoadMore = false) => {
    const currentOffset = isLoadMore ? offset + LIMIT : 0;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await apiService.getRetailers({
        status: filterStatus === "All" ? undefined : filterStatus,
        limit: LIMIT,
        offset: currentOffset,
        state: selectedState || undefined,
        district: selectedDistrict || undefined,
        town: selectedTown || undefined,
        period: period || undefined,
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
        staffId: selectedStaffId || undefined,
        isApplication: isApplication || undefined,
      });

      const newRetailers = response.data || [];
      if (isLoadMore) {
        setRetailers((prev) => [...prev, ...newRetailers]);
        setOffset(currentOffset);
      } else {
        setRetailers(newRetailers);
        setOffset(0);
      }
      setTotalRetailers(response.total || 0);
    } catch (err) {
      console.error("Fetch error for retailers:", err);
      setError(
        `Failed to load retailers. Error: ${err.message || "Network Error"}`,
      );
      if (!isLoadMore) setRetailers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (
      isCloseToBottom &&
      !loading &&
      !loadingMore &&
      retailers.length < totalRetailers
    ) {
      console.log(
        "DEBUG: Loading more retailers...",
        retailers.length,
        "/",
        totalRetailers,
      );
      loadRetailers(true);
    }
  };

  useEffect(() => {
    loadRetailers();

    // Auto-refresh every 15 seconds to show new retailers automatically
    const intervalId = setInterval(() => {
      if (offset === 0 && !loadingMore) {
        loadRetailers();
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [
    filterStatus,
    startDate,
    endDate,
    selectedState,
    selectedDistrict,
    selectedTown,
    period,
    selectedStaffId,
    isApplication,
  ]);

  useEffect(() => {
    if (Platform.OS === "web" && isFilterOpen) {
      const handleClickOutside = (event) => {
        // @ts-ignore - web implementation
        if (filterRef.current && !filterRef.current.contains(event.target)) {
          setIsFilterOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isFilterOpen]);

  const statuses = [
    "All",
    "New",
    "Approved",
    "Rejected",
    "Pending",
    "Self-Registered",
  ];

  const getInitial = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const filteredRetailers = (retailers || []).filter((retailer) => {
    const matchesSearch =
      (retailer.ShopName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (retailer.RetailerName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (retailer.AddressLine1 || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (retailer.Town || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (retailer.District || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // The API already filters by status (including 'New' and 'Approved'),
    // so we only need to filter the *fetched* results by search term.
    return matchesSearch;
  });

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
      case "New":
        return {
          bg: "rgba(59, 130, 246, 0.2)",
          text: "#60a5fa",
          border: "rgba(59, 130, 246, 0.3)",
        };
      default:
        return {
          bg: "rgba(107, 114, 128, 0.2)",
          text: "#9ca3af",
          border: "rgba(107, 114, 128, 0.3)",
        };
    }
  };

  const countFiltered = filteredRetailers.length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerFlex}>
            {/* Left Section: Back & Menu */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <TouchableOpacity
                  onPress={() => router.push("/onboarding-type")}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Navigation Shortcuts - Moved to Header */}
                <View
                  style={[
                    styles.shortcutsContainer,
                    { marginBottom: 0, gap: 10 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.shortcutItem}
                    activeOpacity={0.7}
                    onPress={() => router.push("/dashboard")}
                  >
                    <Ionicons name="grid-outline" size={16} color="#A855F7" />
                    <Text style={styles.shortcutText}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shortcutItem}
                    activeOpacity={0.7}
                    onPress={() => router.push("/vendor-list")}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color="#EC4899"
                    />
                    <Text style={styles.shortcutText}>Vendor Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shortcutItem}
                    activeOpacity={0.7}
                    onPress={() => router.push("/onboarding-type")}
                  >
                    <Ionicons name="home-outline" size={16} color="#3B82F6" />
                    <Text style={styles.shortcutText}>Home</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Center Section: Logo */}
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

            {/* Right Section: Empty (Filter moved) */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <View style={{ width: 44 }} />
            </View>
          </View>
        </View>
      </View>

      {/* Main Layout Container for Push Behavior */}
      <View style={styles.mainLayoutContainer}>
        {/* Content Area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.contentWrapper}>
            <View style={styles.listHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={styles.title}>Retailer Details</Text>
                <TouchableOpacity
                  onPress={() => loadRetailers()}
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, backgroundColor: "rgba(168,85,247,0.15)", borderWidth: 1, borderColor: "rgba(168,85,247,0.4)" }}
                >
                  <Ionicons name="refresh-outline" size={16} color="#A855F7" />
                  <Text style={{ color: "#A855F7", fontSize: 13, fontWeight: "600" }}>Refresh</Text>
                </TouchableOpacity>
              </View>
              {/* Search Bar & Filter Container */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={[
                    styles.searchContainer,
                    { maxWidth: 500, height: 44 },
                  ]}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color="#94A3B8"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    placeholder="Search retailers..."
                    placeholderTextColor="#94A3B8"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    style={[
                      styles.searchInput,
                      { fontSize: 14 },
                      Platform.OS === "web" && { outlineStyle: "none" },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => setIsMenuOpen(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#9333ea", "#a855f7", "#ec4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterButton}
                  >
                    <Ionicons name="filter" size={20} color="#FFFFFF" />
                    <Text style={styles.filterButtonText}>Filter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Message */}
            {loading && (
              <View style={{ padding: 20 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 16 }}>
                  Loading retailers...
                </Text>
              </View>
            )}
            {error && (
              <View style={{ padding: 20 }}>
                <Text style={{ color: "#f87171", fontSize: 16 }}>{error}</Text>
              </View>
            )}
            {!loading && filteredRetailers.length === 0 && (
              <View style={{ padding: 20 }}>
                <Text style={{ color: "#94A3B8", fontSize: 16 }}>
                  No retailers found.
                </Text>
              </View>
            )}

            {/* Grid - Fixed Width Cards */}
            <View style={styles.grid}>
              {filteredRetailers.map((retailer, index) => {
                return (
                  <View
                    key={`${retailer.RetailerId}-${index}`}
                    style={styles.cardBox}
                  >
                    <Pressable
                      style={({ hovered }) => [
                        styles.card,
                        hovered && styles.cardHovered,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/retailer-details",
                          params: { id: retailer.RetailerId.toString() },
                        })
                      }
                    >
                      <View style={styles.cardContent}>
                        {/* Profile Icon */}
                        <LinearGradient
                          colors={["#A855F7", "#EC4899"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.avatar}
                        >
                          <Text style={styles.avatarText}>
                            {getInitial(retailer.RetailerName || "R")}
                          </Text>
                        </LinearGradient>

                        <View style={styles.details}>
                          <View style={styles.cardHeaderRow}>
                            <Text style={styles.shopName} numberOfLines={1}>
                              {retailer.ShopName || "No Name"}
                            </Text>
                            {(() => {
                              let status =
                                retailer.Status ||
                                (filterStatus !== "All"
                                  ? filterStatus
                                  : "Pending");
                              if (status === "Auto-Approved") status = "New";
                              const styles_status = getStatusStyles(status);
                              return (
                                <View
                                  style={[
                                    styles.statusBadge,
                                    {
                                      backgroundColor: styles_status.bg,
                                      borderColor: styles_status.border,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusText,
                                      { color: styles_status.text },
                                    ]}
                                  >
                                    {status}
                                  </Text>
                                </View>
                              );
                            })()}
                          </View>

                          <Text style={styles.retailerNameText}>
                            {retailer.RetailerName || "No Owner"}
                          </Text>

                          <View style={styles.locationRow}>
                            <Ionicons
                              name="location-outline"
                              size={16}
                              color="#A855F7"
                              style={styles.locationIcon}
                            />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {`${retailer.AddressLine1 || ""}, ${retailer.Town || ""}, ${retailer.District || ""}`}
                            </Text>
                          </View>

                          <View style={styles.onboardingDateRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#94A3B8"
                              style={styles.onboardingDateIcon}
                            />
                            <Text style={styles.onboardingDateText}>
                              Onboarded:{" "}
                              {retailer.OnboardingDate
                                ? new Date(
                                    retailer.OnboardingDate,
                                  ).toLocaleDateString("en-IN")
                                : "N/A"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Loading More Indicator */}
            {loadingMore && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: "#A855F7", fontSize: 16 }}>
                  Loading more...
                </Text>
              </View>
            )}

            {/* End of List Message */}
            {!loading &&
              !loadingMore &&
              retailers.length > 0 &&
              retailers.length >= totalRetailers && (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={{ color: "#94A3B8", fontSize: 14 }}>
                    No more retailers to load
                  </Text>
                </View>
              )}
          </View>
        </ScrollView>

        {/* Integrated Side Menu (Integrated instead of Overlay) */}
        {isMenuOpen && (
          <View style={styles.sideMenu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setSelectedState("");
                setSelectedDistrict("");
                setSelectedTown("");
                setFilterStatus("All");
                setStartDate(null);
                setEndDate(null);
                setDropdownSearch("");
              }}
              style={{
                alignSelf: "flex-end",
                marginRight: 16,
                marginBottom: 10,
              }}
            >
              <Text
                style={{ color: "#e8e3e6ff", fontSize: 14, fontWeight: "600" }}
              >
                Clear
              </Text>
            </TouchableOpacity>

            <ScrollView
              style={styles.menuContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Region */}
              <View style={styles.menuSection}>
                <Text style={styles.menuLabel}>Region</Text>

                {/* State Dropdown */}
                <View style={{ marginBottom: 8, zIndex: 3000 }}>
                  <View style={styles.menuInput}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        setShowStateDropdown(!showStateDropdown);
                        setShowDistrictDropdown(false);
                        setShowTownDropdown(false);
                        setDropdownSearch("");
                      }}
                    >
                      <Text
                        style={[
                          styles.menuInputText,
                          selectedState && { color: "#FFFFFF" },
                        ]}
                      >
                        {selectedState || "Select State"}
                      </Text>
                    </TouchableOpacity>
                    {selectedState ? (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedState("");
                          setSelectedDistrict("");
                          setSelectedTown("");
                          setShowStateDropdown(false);
                        }}
                        style={{ paddingHorizontal: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        setShowStateDropdown(!showStateDropdown);
                        setShowDistrictDropdown(false);
                        setShowTownDropdown(false);
                        setDropdownSearch("");
                      }}
                    >
                      <Ionicons
                        name={showStateDropdown ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>

                  {showStateDropdown && (
                    <View style={styles.dropdownList}>
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search State..."
                        placeholderTextColor="#94A3B8"
                        value={dropdownSearch}
                        onChangeText={setDropdownSearch}
                        autoFocus={Platform.OS === "web"}
                      />

                      <ScrollView
                        style={{ maxHeight: 150 }}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {Object.keys(dynamicLocationData)
                          .filter((state) =>
                            state
                              .toLowerCase()
                              .includes(dropdownSearch.toLowerCase()),
                          )
                          .sort()
                          .map((state) => (
                            <TouchableOpacity
                              key={state}
                              style={styles.dropdownListItem}
                              onPress={() => {
                                setSelectedState(state);
                                setSelectedDistrict("");
                                setSelectedTown("");
                                setShowStateDropdown(false);
                                setDropdownSearch("");
                              }}
                            >
                              <Text style={styles.dropdownListItemText}>
                                {state}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        {Object.keys(dynamicLocationData).filter((state) =>
                          state
                            .toLowerCase()
                            .includes(dropdownSearch.toLowerCase()),
                        ).length === 0 && (
                          <View style={{ padding: 10 }}>
                            <Text
                              style={{
                                color: "#64748B",
                                fontSize: 13,
                                textAlign: "center",
                              }}
                            >
                              No state found
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* District Dropdown */}
                <View style={{ marginBottom: 8, zIndex: 2000 }}>
                  <View style={styles.menuInput}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        setShowDistrictDropdown(!showDistrictDropdown);
                        setShowStateDropdown(false);
                        setShowTownDropdown(false);
                        setDropdownSearch("");
                      }}
                    >
                      <Text
                        style={[
                          styles.menuInputText,
                          selectedDistrict && { color: "#FFFFFF" },
                        ]}
                      >
                        {selectedDistrict || "Select District"}
                      </Text>
                    </TouchableOpacity>
                    {selectedDistrict ? (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDistrict("");
                          setSelectedTown("");
                          setShowDistrictDropdown(false);
                        }}
                        style={{ paddingHorizontal: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        setShowDistrictDropdown(!showDistrictDropdown);
                        setShowStateDropdown(false);
                        setShowTownDropdown(false);
                        setDropdownSearch("");
                      }}
                    >
                      <Ionicons
                        name={
                          showDistrictDropdown ? "chevron-up" : "chevron-down"
                        }
                        size={16}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>

                  {showDistrictDropdown && (
                    <View style={styles.dropdownList}>
                      {!selectedState ? (
                        <View style={{ padding: 16 }}>
                          <Text
                            style={{
                              color: "#94A3B8",
                              fontSize: 13,
                              textAlign: "center",
                            }}
                          >
                            Please select a State first
                          </Text>
                        </View>
                      ) : (
                        <>
                          <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search District..."
                            placeholderTextColor="#94A3B8"
                            value={dropdownSearch}
                            onChangeText={setDropdownSearch}
                            autoFocus={Platform.OS === "web"}
                          />

                          <ScrollView
                            style={{ maxHeight: 150 }}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                          >
                            {Object.keys(
                              dynamicLocationData[selectedState] || {},
                            )
                              .filter((district) =>
                                district
                                  .toLowerCase()
                                  .includes(dropdownSearch.toLowerCase()),
                              )
                              .sort()
                              .map((district) => (
                                <TouchableOpacity
                                  key={district}
                                  style={styles.dropdownListItem}
                                  onPress={() => {
                                    setSelectedDistrict(district);
                                    setSelectedTown("");
                                    setShowDistrictDropdown(false);
                                    setDropdownSearch("");
                                  }}
                                >
                                  <Text style={styles.dropdownListItemText}>
                                    {district}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            {Object.keys(
                              dynamicLocationData[selectedState] || {},
                            ).filter((d) =>
                              d
                                .toLowerCase()
                                .includes(dropdownSearch.toLowerCase()),
                            ).length === 0 && (
                              <View style={{ padding: 10 }}>
                                <Text
                                  style={{
                                    color: "#64748B",
                                    fontSize: 13,
                                    textAlign: "center",
                                  }}
                                >
                                  No district found
                                </Text>
                              </View>
                            )}
                          </ScrollView>
                        </>
                      )}
                    </View>
                  )}
                </View>

                {/* Town Dropdown */}
                <View style={{ zIndex: 1000 }}>
                  <View style={styles.menuInput}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        setShowTownDropdown(!showTownDropdown);
                        setShowStateDropdown(false);
                        setShowDistrictDropdown(false);
                        setDropdownSearch("");
                      }}
                    >
                      <Text
                        style={[
                          styles.menuInputText,
                          selectedTown && { color: "#FFFFFF" },
                        ]}
                      >
                        {selectedTown || "Select Town"}
                      </Text>
                    </TouchableOpacity>
                    {selectedTown ? (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedTown("");
                          setShowTownDropdown(false);
                        }}
                        style={{ paddingHorizontal: 8 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        setShowTownDropdown(!showTownDropdown);
                        setShowStateDropdown(false);
                        setShowDistrictDropdown(false);
                        setDropdownSearch("");
                      }}
                    >
                      <Ionicons
                        name={showTownDropdown ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  </View>

                  {showTownDropdown && (
                    <View style={styles.dropdownList}>
                      {!selectedDistrict ? (
                        <View style={{ padding: 16 }}>
                          <Text
                            style={{
                              color: "#94A3B8",
                              fontSize: 13,
                              textAlign: "center",
                            }}
                          >
                            Please select a District first
                          </Text>
                        </View>
                      ) : (
                        <>
                          <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search Town..."
                            placeholderTextColor="#94A3B8"
                            value={dropdownSearch}
                            onChangeText={setDropdownSearch}
                            autoFocus={Platform.OS === "web"}
                          />

                          <ScrollView
                            style={{ maxHeight: 150 }}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                          >
                            {(
                              STATE_DISTRICT_TOWN_DATA[selectedState]?.[
                                selectedDistrict
                              ] || []
                            )
                              .filter((town) =>
                                town
                                  .toLowerCase()
                                  .includes(dropdownSearch.toLowerCase()),
                              )
                              .sort()
                              .map((town) => (
                                <TouchableOpacity
                                  key={town}
                                  style={styles.dropdownListItem}
                                  onPress={() => {
                                    setSelectedTown(town);
                                    setShowTownDropdown(false);
                                    setDropdownSearch("");
                                  }}
                                >
                                  <Text style={styles.dropdownListItemText}>
                                    {town}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            {(
                              dynamicLocationData[selectedState]?.[
                                selectedDistrict
                              ] || []
                            ).filter((t) =>
                              t
                                .toLowerCase()
                                .includes(dropdownSearch.toLowerCase()),
                            ).length === 0 && (
                              <View style={{ padding: 10 }}>
                                <Text
                                  style={{
                                    color: "#64748B",
                                    fontSize: 13,
                                    textAlign: "center",
                                  }}
                                >
                                  No town found
                                </Text>
                              </View>
                            )}
                          </ScrollView>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Filter */}
              <View style={styles.menuSection}>
                <Text style={styles.menuLabel}>Filter</Text>
                <View style={styles.filterOptions}>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterOptionBtn,
                        filterStatus === status && styles.filterOptionBtnActive,
                      ]}
                      onPress={() => {
                        setFilterStatus(status);
                        // setIsMenuOpen(false); // Optional: close on select
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filterStatus === status &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date */}
              <View style={styles.menuSection}>
                <Text style={styles.menuLabel}>Date</Text>
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
                      : "Select Date"}
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

              {/* Individual Executive (Staff) */}
              <View style={styles.menuSection}>
                <Text style={styles.menuLabel}>
                  Individual Executive (Staff)
                </Text>
                <TouchableOpacity
                  style={styles.menuInput}
                  onPress={() => {
                    setShowStaffDropdown(!showStaffDropdown);
                    setShowStateDropdown(false);
                    setShowDistrictDropdown(false);
                    setShowTownDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.menuInputText,
                      selectedStaffId && { color: "#FFFFFF" },
                    ]}
                  >
                    {selectedStaffId
                      ? staffList.find(
                          (s) =>
                            s.UserId.toString() === selectedStaffId.toString(),
                        )?.Username || "Select Staff"
                      : "All Staff"}
                  </Text>
                  <Ionicons
                    name={showStaffDropdown ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#94A3B8"
                  />
                </TouchableOpacity>

                {showStaffDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      style={{ maxHeight: 150 }}
                      nestedScrollEnabled={true}
                    >
                      <TouchableOpacity
                        style={styles.dropdownListItem}
                        onPress={() => {
                          setSelectedStaffId("");
                          setShowStaffDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownListItemText}>
                          All Staff
                        </Text>
                      </TouchableOpacity>
                      {staffList.map((staff) => (
                        <TouchableOpacity
                          key={staff.UserId}
                          style={styles.dropdownListItem}
                          onPress={() => {
                            setSelectedStaffId(staff.UserId);
                            setShowStaffDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownListItemText}>
                            {staff.Username}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
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
    backgroundColor: "#1a1f37", // Updated background
    width: "100%",
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
  header: {
    width: "100%",
    backgroundColor: "rgba(28, 30, 45, 0.7)", // Transparent header
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    height: 120, // Increased height for larger logo
    justifyContent: "center",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
      },
    }),
  },
  headerInner: {
    width: "100%",
    maxWidth: 1400, // Slightly wider to allow more "dead end" feel
    alignSelf: "center",
    paddingHorizontal: 24,
  },
  headerFlex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  backButton: {
    padding: 4,
  },
  logo: {
    height: 130,
    width: 300,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 500, // Constant search bar width
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 17,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    width: "100%",
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 1200, // Strictly constant content width
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
    zIndex: 100,
    position: "relative",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  filterContainer: {
    position: "relative",
    zIndex: 200,
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.5,
    borderColor: "#A855F7", // Vibrant purple border
    borderRadius: 12,
    height: 48,
    width: 150,
    paddingHorizontal: 12,
  },
  selectedFilterText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownMenu: {
    position: "absolute",
    top: 56,
    right: 0,
    width: 150,
    backgroundColor: "rgba(30, 33, 46, 0.98)",
    borderRadius: 12,
    padding: 6,
    borderWidth: 1.5,
    borderColor: "#A855F7",
    zIndex: 300,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(25px)",
      },
    }),
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dropdownItemActive: {
    backgroundColor: "#3B82F6", // Blue highlighting from screenshot
  },
  dropdownItemText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    color: "#FFFFFF",
  },
  filterIcon: {
    marginLeft: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -12, // Gap compensation
  },
  cardBox: {
    padding: 12,
    // Responsive Fixed Layout:
    // 1. width '33%' forces ~3 columns on web (leaving slight gap for safety)
    // 2. minWidth 340 forces wrapping to 2 or 1 column on smaller screens
    // 3. flexGrow 0 prevents cards from stretching larger than their column width
    width: Platform.OS === "web" ? "33%" : "100%",
    minWidth: 340,
    flexGrow: 0,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)", // Glass card
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 24,
    height: 180, // Fixed height for constant unit feel
    width: "100%",
    ...Platform.select({
      web: {
        backdropFilter: "blur(10px)",
        transition: "all 0.3s ease",
      },
    }),
  },
  cardHovered: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(168, 85, 247, 0.4)",
    transform: [{ scale: 1.02 }],
    ...Platform.select({
      web: {
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
    }),
  },
  cardContent: {
    flexDirection: "row",
    gap: 16,
    height: "100%",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  shopName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  retailerNameText: {
    color: "#94A3B8",
    fontSize: 15,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  locationIcon: {
    marginTop: 1,
  },
  locationText: {
    color: "#94A3B8",
    fontSize: 14,
    flex: 1,
  },
  onboardingDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  onboardingDateIcon: {
    marginRight: 6,
  },
  onboardingDateText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  mainLayoutContainer: {
    flex: 1,
    flexDirection: "row",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    ...Platform.select({
      web: {
        cursor: "default",
      },
    }),
  },
  sideMenu: {
    width: 300,
    backgroundColor: "#1E212E",
    height: "100%",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
    ...Platform.select({
      web: {
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
      },
    }),
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  menuInputText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOptionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterOptionBtnActive: {
    backgroundColor: "#A855F7",
    borderColor: "#A855F7",
  },
  filterOptionText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  filterOptionTextActive: {
    color: "#FFFFFF",
  },
  menuButton: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A855F7",
  },
  menuButtonText: {
    color: "#A855F7",
    fontSize: 14,
    fontWeight: "bold",
  },
  dropdownList: {
    backgroundColor: "#1E212E", // Solid and matches menu background
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)", // Slight purple highlight
    overflow: "hidden", // Ensures rounded corners clip content
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dropdownSearchInput: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownListItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownListItemText: {
    color: "#CBD5E1",
    fontSize: 14,
  },
  navMenuButton: {
    padding: 4,
  },
  navMenuDropdown: {
    position: "absolute",
    top: 80,
    left: 20,
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
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  shortcutsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    alignSelf: "flex-start",
    flexWrap: "wrap",
  },
  shortcutItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 8,
  },
  shortcutText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

const webStyles = {
  htmlSelect: {
    appearance: "none",
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    paddingLeft: 12,
    fontSize: 15,
    cursor: "pointer",
    width: "100%",
    height: "100%",
    outline: "none",
  },
};
