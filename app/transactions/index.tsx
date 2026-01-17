import { TransactionFilters } from "@/components"; // Added
import { Transaction } from "@/db"; // Removed unused import if needed, but keeping for now
import { TransactionItem } from "@/features/dashboard";
import { useAppStore, useThemeStore } from "@/store";
import { FilterType, getFilterDateRange } from "@/utils"; // Added
import { Stack, useRouter } from "expo-router";
// Modified imports
import { EditTransactionSheet } from "@/features/transactions/components/EditTransactionSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    View,
} from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";

// Removed local FilterType definition

import { ArrowLeft, Search } from "lucide-react-native";
import { useTranslation } from "react-i18next";
// import { Button, Input } from "tamagui"; // Removed duplicate imports, already in tamagui import below or need to be merged

export default function TransactionsScreen() {
    const { t } = useTranslation(); // Hook
    const router = useRouter();
    const themeMode = useThemeStore((state) => state.mode);
    const { getTransactions, deleteTransaction } = useAppStore();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const borderColor = isDark ? "#374151" : "#E5E7EB";

    const [filter, setFilter] = useState<FilterType>("all");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState(""); // Restore searchQuery
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Custom Date Range
    const getCurrentDate = () => new Date().toISOString().split("T")[0];
    const [customStartDate, setCustomStartDate] = useState(getCurrentDate());
    const [customEndDate, setCustomEndDate] = useState(getCurrentDate());

    // Removed getFilterDateRange definition

    const loadTransactions = async (refresh = false, newFilter?: FilterType) => {
        const currentFilter = newFilter || filter;
        if (!refresh && !hasMore && currentFilter === filter) return;
        if (isLoading) return;

        setIsLoading(true);
        try {
            const currentOffset = refresh ? 0 : offset;
            const dateRange = getFilterDateRange(
                currentFilter,
                customStartDate,
                customEndDate,
            );

            const data = await getTransactions(20, currentOffset, dateRange);

            if (refresh) {
                setTransactions(data);
                setOffset(20);
            } else {
                setTransactions((prev) => [...prev, ...data]);
                setOffset((prev) => prev + 20);
            }

            if (data.length < 20) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (error) {
            console.error("Failed to load transactions", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        loadTransactions(true);
    }, []);

    const handleFilterChange = (newFilter: FilterType) => {
        setFilter(newFilter);
        setOffset(0);
        setHasMore(true);
        // We trigger a refresh-like load but with the new filter
        // We need to pass the new filter because state update might be async
        loadTransactions(true, newFilter);
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        loadTransactions(true);
    };

    const handleEdit = (tx: Transaction) => {
        setSelectedTransaction(tx);
        bottomSheetRef.current?.present();
    };

    const handleDelete = (tx: Transaction) => {
        Alert.alert(
            "Hapus Transaksi",
            "Apakah Anda yakin ingin menghapus transaksi ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTransaction(tx.id);
                        loadTransactions(true);
                    },
                },
            ],
        );
    };

    // Effect to reload when custom dates change
    useEffect(() => {
        if (filter === "custom") {
            setOffset(0);
            setHasMore(true);
            loadTransactions(true);
        }
    }, [customStartDate, customEndDate]);

    // Effect to reload when search query changes
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        loadTransactions(true);
    }, [searchQuery]);

    // Removed renderFilterChip

    return (
        <YStack flex={1} bg={bgColor} pt={50}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <XStack items="center" px="$4" pb="$4" gap="$3">
                <XStack items="center" gap="$3">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            padding: 8,
                            borderRadius: 16,
                            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "white",
                        }}
                    >
                        <ArrowLeft size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text fontSize={20} fontWeight="bold" color={textColor}>
                        {t("tabs.transactions")}
                    </Text>
                </XStack>
            </XStack>

            {/* Filters */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 0 }}>
                <TransactionFilters
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    customStartDate={customStartDate}
                    onCustomStartDateChange={setCustomStartDate}
                    customEndDate={customEndDate}
                    onCustomEndDateChange={setCustomEndDate}
                />
            </View>

            {/* Search Bar */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: cardBg,
                    marginHorizontal: 16,
                    marginTop: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    borderColor: borderColor,
                    borderWidth: 1,
                }}
            >
                <Search size={20} color={subtextColor} />
                <Input
                    flex={1}
                    placeholder={t("transactions.search_placeholder")}
                    bg="transparent"
                    borderWidth={0}
                    color={textColor}
                    placeholderTextColor={subtextColor}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* List */}
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        style={{
                            backgroundColor: cardBg,
                            marginHorizontal: 16,
                            marginBottom: 12,
                            borderRadius: 12,
                        }}
                    >
                        <TransactionItem
                            transaction={item}
                            onPress={() => handleEdit(item)}
                            onDelete={() => handleDelete(item)}
                        />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 50, paddingTop: 16 }}
                onEndReached={() => loadTransactions(false)}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
                }
                ListFooterComponent={
                    isLoading && !isRefreshing ? (
                        <ActivityIndicator
                            size="small"
                            color="#10B981"
                            style={{ margin: 20 }}
                        />
                    ) : null
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <YStack items="center" py="$10">
                            <Text fontSize={40} mb="$2">
                                📝
                            </Text>
                            <Text color={subtextColor}>
                                {t("transactions.no_transactions")}
                            </Text>
                        </YStack>
                    ) : null
                }
            />
            <View />

            <EditTransactionSheet
                ref={bottomSheetRef}
                transaction={selectedTransaction}
                onClose={() => {
                    bottomSheetRef.current?.dismiss();
                    setSelectedTransaction(null);
                    loadTransactions(true);
                }}
            />
        </YStack>
    );
}
