import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Platform,
    TextInput,
    ActivityIndicator,
    SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../services/apiService";

const logoImage = require("../assets/logo.png");

export default function ProductListScreen() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadProducts(0, true);

        // Set up polling interval (every 30 seconds)
        const intervalId = setInterval(() => {
            if (page === 0 && !refreshing) {
                loadProducts(0, true);
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [filterStatus]);

    const loadProducts = async (pageNum, shouldReplace = false) => {
        try {
            if (pageNum === 0) setLoading(true);
            const response = await apiService.getProducts({
                status: filterStatus === "All" ? undefined : filterStatus,
                offset: pageNum * 20,
                limit: 20,
            });

            if (response.success) {
                if (shouldReplace) {
                    setProducts(response.data);
                } else {
                    setProducts((prev) => [...prev, ...response.data]);
                }
                setHasMore(response.data.length === 20);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts(0, true);
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            loadProducts(page + 1);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Approved":
                return "#4ade80";
            case "Rejected":
                return "#f87171";
            case "Pending":
                return "#facc15";
            default:
                return "#94A3B8";
        }
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
                router.push({
                    pathname: "/product-details",
                    params: { id: item.ProductId.toString() },
                })
            }
        >
            <View style={styles.cardContent}>
                <View style={styles.productIcon}>
                    <Ionicons name="cube-outline" size={32} color="#A855F7" />
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                        {item.ProductName}
                    </Text>
                    <Text style={styles.vendorName} numberOfLines={1}>
                        Vendor: {item.VendorName || "N/A"}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.skuText}>SKU: {item.SKU || "N/A"}</Text>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(item.Status) + "20" },
                            ]}
                        >
                            <Text style={[styles.statusText, { color: getStatusColor(item.Status) }]}>
                                {item.Status || "Pending"}
                            </Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.replace("/onboarding-type")}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                <Text style={styles.headerTitle}>Product Catalog</Text>
            </View>

            <View style={styles.filterBar}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        placeholderTextColor="#94A3B8"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
                    {["All", "Pending", "Approved", "Rejected"].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.statusPill,
                                filterStatus === status && styles.statusPillActive,
                            ]}
                            onPress={() => setFilterStatus(status)}
                        >
                            <Text
                                style={[
                                    styles.statusPillText,
                                    filterStatus === status && styles.statusPillTextActive,
                                ]}
                            >
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && page === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#A855F7" />
                </View>
            ) : (
                <FlatList
                    data={products.filter((p) =>
                        p.ProductName.toLowerCase().includes(searchTerm.toLowerCase())
                    )}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.ProductId.toString()}
                    contentContainerStyle={styles.listContent}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a1f37",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    backButton: {
        marginRight: 15,
    },
    logo: {
        width: 120,
        height: 40,
        marginRight: 15,
    },
    headerTitle: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
    },
    filterBar: {
        padding: 20,
        gap: 15,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: "#FFFFFF",
        fontSize: 16,
    },
    statusFilters: {
        flexDirection: "row",
    },
    statusPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginRight: 10,
    },
    statusPillActive: {
        backgroundColor: "#A855F7",
    },
    statusPillText: {
        color: "#94A3B8",
        fontWeight: "600",
    },
    statusPillTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    productIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    vendorName: {
        color: "#94A3B8",
        fontSize: 14,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    skuText: {
        color: "rgba(148, 163, 184, 0.7)",
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 50,
    },
    emptyText: {
        color: "#94A3B8",
        fontSize: 16,
    },
});
