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
  Modal,
  Dimensions,
  TextInput,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";

// Import local logo asset
const logoImage = require("../assets/logo.png");

// Helper to get image URI from binary streams
const getPhotoUrl = (photoId) => {
  if (!photoId) return null;
  const url = apiService.getVendorPhotoUrl(photoId);
  console.log(`DEBUG: Generated Vendor Photo URL for ID ${photoId}:`, url);
  return url;
};
const getDocUrl = (docId) => {
  if (!docId) return null;
  const url = apiService.getVendorDocUrl(docId);
  console.log(`DEBUG: Generated Vendor Doc URL for ID ${docId}:`, url);
  return url;
};

const fixedVendorDetail = null; // Removed dummy data

export default function VendorDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageScale, setImageScale] = useState(1);
  const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);

  useEffect(() => {
    if (id) {
      loadVendorDetails();
    }
  }, [id]);

  const loadVendorDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getVendorById(id);
      if (!data) throw new Error("No vendor data found");
      console.log(
        "DEBUG: Full payload received from getVendorById:",
        JSON.stringify(data, null, 2),
      );
      setVendorData(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load vendor details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    setPendingStatus(status);
    setIsReasonModalVisible(true);
  };

  const submitReason = async () => {
    if (!reasonText.trim()) {
      alert("Please provide a reason.");
      return;
    }

    try {
      await apiService.updateVendorStatus(id, pendingStatus, reasonText);
      setActionStatus(pendingStatus);

      // Determine approvedBy based on new status
      const newApprovedBy = pendingStatus === "Approved" ? "Admin" : "";

      setVendorData((prev) => ({
        ...prev,
        CurrentStatus: pendingStatus,
        status: pendingStatus,
        Remark: reasonText,
        reason: reasonText,
        ApprovedBy: newApprovedBy,
        approvedBy: newApprovedBy,
      }));

      setIsReasonModalVisible(false);
      setReasonText("");
      setPendingStatus(null);
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const getPhotoByType = (types, indexFallback) => {
    const photoArray = findValueByKey(vendorData, [
      "photos",
      "Photos",
      "BusinessPhotos",
      "vendor_photos",
      "photo_list",
      "VendorBusinessPhotos",
      "vendorPhotos",
    ]);
    if (!Array.isArray(photoArray)) {
      console.log(
        "DEBUG: Vendor photoArray is NOT an array or missing:",
        photoArray,
      );
      return null;
    }
    if (photoArray.length === 0) {
      console.log(
        "DEBUG: Vendor photoArray is empty for vendor:",
        vendorData?.VendorId,
      );
      return null;
    }

    const typeList = Array.isArray(types) ? types : [types];

    // Find photo by type
    const photo = photoArray.find((p) => {
      const pType = String(
        findValueByKey(p, [
          "PhotoType",
          "type",
          "photo_type",
          "Type",
          "documentType",
          "DocumentType",
          "photoType",
        ]) || "",
      ).toLowerCase();
      return pType && typeList.some((t) => pType.includes(t.toLowerCase()));
    });

    if (photo) {
      const pid = findValueByKey(photo, [
        "PhotoId",
        "id",
        "photo_id",
        "photoId",
        "DocumentId",
        "documentId",
        "PhotoID",
      ]);
      console.log(`DEBUG: Found vendor photo for types [${typeList}]:`, pid);
      return getPhotoUrl(pid);
    }

    if (indexFallback !== undefined && photoArray[indexFallback]) {
      const pid = findValueByKey(photoArray[indexFallback], [
        "PhotoId",
        "id",
        "photo_id",
        "photoId",
        "DocumentId",
        "documentId",
        "PhotoID",
      ]);
      console.log(
        `DEBUG: Using vendor fallback index ${indexFallback} for types [${typeList}]:`,
        pid,
      );
      return getPhotoUrl(pid);
    }
    return null;
  };

  const getDocByType = (types, indexFallback) => {
    const docArray = findValueByKey(vendorData, [
      "documents",
      "Documents",
      "VendorDocuments",
      "document_list",
    ]);
    if (!Array.isArray(docArray) || docArray.length === 0) return null;
    const typeList = Array.isArray(types) ? types : [types];

    // Find doc by type
    const doc = docArray.find((d) => {
      const dType = String(
        findValueByKey(d, ["DocumentType", "type", "document_type", "Type"]) ||
          "",
      ).toLowerCase();
      return dType && typeList.some((t) => dType.includes(t.toLowerCase()));
    });

    if (doc) {
      const did = findValueByKey(doc, [
        "DocumentId",
        "id",
        "document_id",
        "documentId",
      ]);
      return getDocUrl(did);
    }

    if (indexFallback !== undefined && docArray[indexFallback]) {
      const did = findValueByKey(docArray[indexFallback], [
        "DocumentId",
        "id",
        "document_id",
        "documentId",
      ]);
      return getDocUrl(did);
    }
    return null;
  };

  const openImagePreview = (imageUri) => {
    setPreviewImage(imageUri);
    setImageScale(1);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
    setImageScale(1);
  };

  const zoomIn = () => {
    setImageScale((prev) => Math.min(prev + 0.5, 4));
  };

  const zoomOut = () => {
    setImageScale((prev) => Math.max(prev - 0.5, 0.5));
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}: <Text style={styles.infoValue}>{value}</Text>
      </Text>
    </View>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  // Aggressive helper to find a value by partial key match (case-insensitive)
  const findValueByKey = (obj, searchKeys) => {
    if (!obj) return null;
    const keys = Object.keys(obj);
    for (const sk of searchKeys) {
      // Priority 1: Exact match (case-sensitive)
      if (obj[sk] !== undefined && obj[sk] !== null && obj[sk] !== "")
        return obj[sk];
      // Priority 2: Case-insensitive match
      const foundKey = keys.find((k) => k.toLowerCase() === sk.toLowerCase());
      if (
        foundKey &&
        obj[foundKey] !== undefined &&
        obj[foundKey] !== null &&
        obj[foundKey] !== ""
      ) {
        return obj[foundKey];
      }
      // Priority 3: Partial match fallback
      const partialKey = keys.find((k) =>
        k.toLowerCase().includes(sk.toLowerCase()),
      );
      if (
        partialKey &&
        obj[partialKey] !== undefined &&
        obj[partialKey] !== null &&
        obj[partialKey] !== ""
      ) {
        return obj[partialKey];
      }
    }
    return null;
  };

  const ClickableImage = ({ uri, style }) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() => uri && openImagePreview(uri)}
          activeOpacity={0.8}
        >
          {uri ? (
            <Image
              source={{
                uri: uri,
                headers: { "ngrok-skip-browser-warning": "true" },
              }}
              style={style}
              resizeMode="cover"
              onError={(e) =>
                console.log(
                  "DEBUG: Vendor Image Load Error:",
                  e.nativeEvent.error,
                  "for URI:",
                  uri,
                )
              }
            />
          ) : (
            <View
              style={[
                style,
                {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={32}
                color="rgba(255, 255, 255, 0.2)"
              />
            </View>
          )}
          {uri && (
            <View style={styles.imageOverlay}>
              <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Image Preview Modal */}
      <Modal
        visible={previewImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Image Preview</Text>
            <TouchableOpacity
              onPress={closeImagePreview}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.zoomControls}>
            <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
              <Ionicons
                name="remove-circle-outline"
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{Math.round(imageScale * 100)}%</Text>
            <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.imageScrollView}
            contentContainerStyle={styles.imageScrollContent}
            maximumZoomScale={4}
            minimumZoomScale={0.5}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
          >
            {previewImage && (
              <Image
                source={{
                  uri: previewImage,
                  headers: { "ngrok-skip-browser-warning": "true" },
                }}
                style={[
                  styles.previewImage,
                  { transform: [{ scale: imageScale }] },
                ]}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Reason Modal */}
      <Modal
        visible={isReasonModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsReasonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reasonModalContainer}>
            <Text style={styles.reasonModalTitle}>Provide Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter your reason here..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={reasonText}
              onChangeText={setReasonText}
            />

            <View style={styles.reasonModalButtons}>
              <TouchableOpacity
                style={styles.reasonCancelButton}
                onPress={() => {
                  setIsReasonModalVisible(false);
                  setReasonText("");
                }}
              >
                <Text style={styles.reasonButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reasonSubmitButton}
                onPress={submitReason}
              >
                <LinearGradient
                  colors={["#A855F7", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.reasonButtonText}>Submit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push("/vendor-list")}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

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
          <Text style={styles.headerTitle}>Vendor Details - Review</Text>
        </View>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 18 }}>
            Loading details...
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ color: "#f87171", fontSize: 18, textAlign: "center" }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadVendorDetails}
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: "#A855F7",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        vendorData && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.contentWrapper}>
              <Text style={styles.mainTitle}>Vendor Details</Text>

              {/* Basic Information */}
              <SectionHeader title="BASIC INFORMATION" />
              <View style={styles.infoCard}>
                <InfoRow
                  label="Business Name"
                  value={vendorData.BusinessName || "N/A"}
                />
                <InfoRow
                  label="Vendor Name"
                  value={vendorData.VendorName || "N/A"}
                />
                <InfoRow
                  label="Email Address"
                  value={vendorData.EmailAddress || "N/A"}
                />
                <InfoRow
                  label="WhatsApp Number"
                  value={
                    vendorData.WhatsAppNumber ||
                    vendorData.whatsAppNumber ||
                    "N/A"
                  }
                />
                <InfoRow
                  label="Market"
                  value={vendorData.Market || vendorData.market || "N/A"}
                />
                <InfoRow
                  label="Location"
                  value={
                    findValueByKey(vendorData, [
                      "Location",
                      "City",
                      "State",
                      "ShopCity",
                      "CityName",
                      "city",
                      "state",
                    ]) || "N/A"
                  }
                />
                <InfoRow
                  label="Pincode"
                  value={
                    findValueByKey(vendorData, [
                      "Pincode",
                      "PinCode",
                      "ZipCode",
                      "pin_code",
                      "zip",
                    ]) || "N/A"
                  }
                />
                <InfoRow
                  label="Business Address"
                  value={`${findValueByKey(vendorData, ["AddressLine1"]) || ""}, ${findValueByKey(vendorData, ["AddressLine2"]) ? findValueByKey(vendorData, ["AddressLine2"]) + ", " : ""}${findValueByKey(vendorData, ["Town"]) || ""}, ${findValueByKey(vendorData, ["District"]) || ""}, ${findValueByKey(vendorData, ["State"]) || ""}`}
                />

                <InfoRow
                  label="GST Number"
                  value={
                    findValueByKey(vendorData, [
                      "GSTNumber",
                      "gst",
                      "GST",
                      "GST_No",
                      "gst_no",
                    ]) || "N/A"
                  }
                />
                <InfoRow
                  label="Aadhar Card Number"
                  value={
                    findValueByKey(vendorData, [
                      "AadharCardNumber",
                      "aadhar",
                      "Aadhar",
                      "AadharNo",
                      "Aadhar_No",
                      "aadhar_no",
                    ]) || "N/A"
                  }
                />
                <InfoRow
                  label="PAN Card Number"
                  value={
                    findValueByKey(vendorData, [
                      "PanCardNumber",
                      "pan",
                      "PanNumber",
                      "PanNo",
                      "PAN",
                      "Pan_No",
                      "pan_number",
                      "PanCardNo",
                      "pan_card_no",
                    ]) || "N/A"
                  }
                />

                <InfoRow
                  label="Status"
                  value={
                    findValueByKey(vendorData, [
                      "CurrentStatus",
                      "status",
                      "Status",
                      "status_name",
                    ]) || "Pending"
                  }
                />

                <InfoRow
                  label="Approved By"
                  value={
                    findValueByKey(vendorData, [
                      "CurrentStatus",
                      "status",
                      "Status",
                    ]) === "Approved" &&
                    !(
                      findValueByKey(vendorData, [
                        "reason",
                        "Reason",
                        "Remark",
                        "remark",
                        "DbRemark",
                      ]) || ""
                    )
                      .toLowerCase()
                      .includes("auto-approved")
                      ? findValueByKey(vendorData, [
                          "approvedBy",
                          "ApprovedBy",
                          "approved_by",
                        ]) || "Admin"
                      : ""
                  }
                />

                <InfoRow
                  label="Reason"
                  value={
                    findValueByKey(vendorData, [
                      "reason",
                      "Reason",
                      "Remark",
                      "remark",
                      "DbRemark",
                    ]) || ""
                  }
                />
                <InfoRow
                  label="Onboarded By"
                  value={
                    findValueByKey(vendorData, [
                      "onboardedBy",
                      "OnboardedBy",
                      "StaffUsername",
                      "registered_by",
                    ]) || ""
                  }
                />
                <InfoRow
                  label="Onboarding Date"
                  value={
                    vendorData.OnboardingDate
                      ? new Date(vendorData.OnboardingDate).toLocaleDateString(
                          "en-IN",
                        )
                      : "N/A"
                  }
                />
              </View>

              <SectionHeader title="BUSINESS PHOTOS (FRONT, BOARD, INSIDE)" />
              <Text style={styles.clickHint}>
                Click on any image to view in full screen
              </Text>
              <View style={styles.photoRow}>
                <View style={styles.photoItem}>
                  <Text style={styles.photoLabel}>Front</Text>
                  <ClickableImage
                    uri={getPhotoByType(["Front", "Photo1", "1"], 0)}
                    style={styles.photoImage}
                  />
                </View>
                <View style={styles.photoItem}>
                  <Text style={styles.photoLabel}>Board</Text>
                  <ClickableImage
                    uri={getPhotoByType(["Board", "Office", "Photo2", "2"], 1)}
                    style={styles.photoImage}
                  />
                </View>
                <View style={styles.photoItem}>
                  <Text style={styles.photoLabel}>Inside</Text>
                  <ClickableImage
                    uri={getPhotoByType(
                      ["Inside", "Warehouse", "Photo3", "3"],
                      2,
                    )}
                    style={styles.photoImage}
                  />
                </View>
              </View>

              {/* Business Documents */}
              <SectionHeader title="BUSINESS DOCUMENTS" />
              <View style={styles.documentItem}>
                <Text style={styles.photoLabel}>
                  License / Business Document
                </Text>
                <ClickableImage
                  uri={getDocByType(
                    ["License", "ShopDocument", "BusinessDocument", "Doc1"],
                    0,
                  )}
                  style={styles.documentImage}
                />
              </View>

              {/* KYC - Aadhar */}
              <SectionHeader title="KYC DOCUMENTS - AADHAR CARD" />
              <View style={styles.photoRow}>
                <View style={styles.kycItem}>
                  <Text style={styles.photoLabel}>Aadhar Front</Text>
                  <ClickableImage
                    uri={getDocByType(["AadharFront", "AadharCardFront"])}
                    style={styles.kycImage}
                  />
                </View>
                <View style={styles.kycItem}>
                  <Text style={styles.photoLabel}>Aadhar Back</Text>
                  <ClickableImage
                    uri={getDocByType(["AadharBack", "AadharCardBack"])}
                    style={styles.kycImage}
                  />
                </View>
              </View>

              {/* KYC - PAN */}
              <SectionHeader title="KYC DOCUMENTS - PAN CARD" />
              <View style={styles.documentItem}>
                <Text style={styles.photoLabel}>PAN Card Image</Text>
                <ClickableImage
                  uri={getDocByType(["Pan", "PANCard", "PanCardPhoto"])}
                  style={styles.documentImage}
                />
              </View>

              {/* Declaration */}
              <SectionHeader title="DECLARATION" />
              <View style={styles.declarationBox}>
                <Text style={styles.declarationText}>
                  <Text style={styles.declarationStatus}>Status: </Text>I
                  declare that all the information provided is accurate and
                  complete
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.approveButton,
                    findValueByKey(vendorData, [
                      "CurrentStatus",
                      "status",
                      "Status",
                    ]) === "Approved" && styles.disabledButton,
                  ]}
                  onPress={() => handleAction("Approved")}
                  disabled={
                    findValueByKey(vendorData, [
                      "CurrentStatus",
                      "status",
                      "Status",
                    ]) === "Approved"
                  }
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleAction("Rejected")}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.pendingButton]}
                  onPress={() => handleAction("Pending")}
                >
                  <Text style={styles.actionButtonText}>Pending</Text>
                </TouchableOpacity>
              </View>

              {/* Success Message Feedback */}
              {actionStatus && (
                <View style={styles.successMessageBox}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text style={styles.successMessageText}>
                    {actionStatus} Successfully!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1f37",
  },
  header: {
    height: 120,
    backgroundColor: "#1a1f37",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  backButton: {
    marginRight: 16,
  },
  logo: {
    width: 300,
    height: 130,
    marginRight: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  contentWrapper: {
    width: "90%",
    maxWidth: 1000,
  },
  mainTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  sectionHeader: {
    color: "#A855F7",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 16,
  },
  clickHint: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 12,
    fontStyle: "italic",
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    color: "#94A3B8",
    fontSize: 16,
  },
  infoValue: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  photoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
  },
  photoItem: {
    flex: 1,
    minWidth: 280,
  },
  photoLabel: {
    color: "#94A3B8",
    fontSize: 15,
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 8,
    padding: 6,
  },
  documentItem: {
    width: "100%",
    marginBottom: 16,
  },
  documentImage: {
    width: "100%",
    maxWidth: 400,
    height: 250,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  kycItem: {
    flex: 1,
    minWidth: 280,
  },
  kycImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  declarationBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  declarationText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
  },
  declarationStatus: {
    color: "#94A3B8",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 16,
    marginBottom: 40,
    flexWrap: "wrap",
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#475569",
    opacity: 0.6,
  },
  approveButton: {
    backgroundColor: "#22C55E",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  pendingButton: {
    backgroundColor: "#F59E0B",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  successMessageBox: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
    alignSelf: "flex-end",
    minWidth: 250,
    ...Platform.select({
      web: {
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
    }),
  },
  successMessageText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  zoomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  zoomButton: {
    padding: 8,
  },
  zoomText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "center",
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  previewImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  reasonModalContainer: {
    width: "90%",
    maxWidth: 500,
    backgroundColor: "#2D2D44",
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
      },
    }),
  },
  reasonModalTitle: {
    color: "#A855F7",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  reasonInput: {
    backgroundColor: "#1E1E2E",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    height: 150,
    textAlignVertical: "top",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  reasonModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  reasonCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#474761",
  },
  reasonSubmitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: "center",
  },
  reasonButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
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
});
