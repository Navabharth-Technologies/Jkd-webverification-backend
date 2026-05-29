import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Modal,
    TextInput,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";

const logoImage = require("../assets/logo.png");

export default function ProductDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [remark, setRemark] = useState("");
    const [actionType, setActionType] = useState(null);

    useEffect(() => {
        loadProductDetails();
    }, [id]);

    const loadProductDetails = async () => {
        try {
            setLoading(true);
            const data = await apiService.getProductById(id);
            setProduct(data);
        } catch (err) {
            setError("Failed to load product details");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (type) => {
        setActionType(type);
        setIsModalVisible(true);
    };

    const submitStatusUpdate = async () => {
        try {
            setLoading(true);
            await apiService.updateProductStatus(id, actionType, remark);
            setIsModalVisible(false);
            loadProductDetails();
        } catch (err) {
            alert("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !product) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error || "Product not found"}</Text>
                <TouchableOpacity onPress={loadProductDetails} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageContainer}>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                        {product.images && product.images.length > 0 ? (
                            product.images.map((img, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image
                                        source={{ uri: apiService.getProductImageUrl(img.ImageId) }}
                                        style={styles.productImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            ))
                        ) : (
                            <View style={styles.noImagePlaceholder}>
                                <Ionicons name="image-outline" size={80} color="rgba(255,255,255,0.1)" />
                                <Text style={{ color: '#94A3B8', marginTop: 10 }}>No Image Available</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.productName}>{product.ProductName}</Text>
                    <Text style={styles.vendorName}>By {product.VendorName}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Status</Text>
                            <Text style={[styles.statValue, { color: product.Status === 'Approved' ? '#4ade80' : product.Status === 'Rejected' ? '#f87171' : '#facc15' }]}>
                                {product.Status}
                            </Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>SKU</Text>
                            <Text style={styles.statValue}>{product.SKU || 'N/A'}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Brand</Text>
                            <Text style={styles.statValue}>{product.BrandModel || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.detailCard}>
                        <Text style={styles.sectionTitle}>General Information</Text>
                        <InfoRow label="Product Description" value={product.ProductDescription || 'N/A'} />
                        <InfoRow label="Price" value={`₹${product.Price || '0'}`} />
                        <InfoRow label="Stock" value={product.StockQuantity || '0'} />
                        <InfoRow label="Category" value={product.CategoryName || 'N/A'} />
                        <InfoRow label="Return" value={product.ProductReturn} />
                        <InfoRow label="Exchange" value={product.ProductExchange} />
                    </View>

                    {product.attributes && product.attributes.length > 0 && (
                        <View style={styles.detailCard}>
                            <Text style={styles.sectionTitle}>Product Attributes</Text>
                            {product.attributes.map((attr, idx) => (
                                <InfoRow key={idx} label={attr.AttributeName} value={attr.AttributeValue} />
                            ))}
                        </View>
                    )}
                </View>

                {product.Status === 'Pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleAction('Rejected')}
                        >
                            <Text style={styles.buttonText}>Reject Product</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleAction('Approved')}
                        >
                            <LinearGradient
                                colors={['#A855F7', '#EC4899']}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.buttonText}>Approve Product</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {actionType === 'Approved' ? 'Approve Product' : 'Reject Product'}
                        </Text>
                        <TextInput
                            style={styles.remarkInput}
                            placeholder="Enter remark (optional)..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            value={remark}
                            onChangeText={setRemark}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalBtn} onPress={() => setIsModalVisible(false)}>
                                <Text style={{ color: '#94A3B8' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalSubmit]} onPress={submitStatusUpdate}>
                                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#1a1f37" },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.03)' },
    backButton: { marginRight: 15 },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 40 },
    imageContainer: { height: 300, backgroundColor: 'rgba(0,0,0,0.2)' },
    imageWrapper: { width: 400, height: 300, justifyContent: 'center', alignItems: 'center' },
    productImage: { width: '90%', height: '90%' },
    noImagePlaceholder: { flex: 1, width: 400, justifyContent: 'center', alignItems: 'center' },
    infoSection: { padding: 20 },
    productName: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    vendorName: { color: '#A855F7', fontSize: 16, marginBottom: 20 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
    statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, alignItems: 'center' },
    statLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
    statValue: { color: '#FFFFFF', fontWeight: 'bold' },
    detailCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    sectionTitle: { color: '#A855F7', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    infoLabel: { color: '#94A3B8', flex: 1 },
    infoValue: { color: '#FFFFFF', flex: 2, textAlign: 'right' },
    actionButtons: { flexDirection: 'row', paddingHorizontal: 20, gap: 15 },
    actionButton: { flex: 1, height: 50, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    approveButton: {},
    rejectButton: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#ef4444' },
    gradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#1E212E', borderRadius: 20, padding: 25 },
    modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    remarkInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 15, color: '#FFFFFF', height: 100, textAlignVertical: 'top', marginBottom: 25 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
    modalBtn: { padding: 10 },
    modalSubmit: { backgroundColor: '#A855F7', borderRadius: 8, paddingHorizontal: 20 },
    errorText: { color: '#f87171', fontSize: 18, marginBottom: 20 },
    retryButton: { backgroundColor: '#A855F7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryText: { color: '#FFFFFF', fontWeight: 'bold' },
});
