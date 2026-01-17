import { TransactionFilters } from "@/components"; // Added
import { Transaction } from "@/db"; // Removed unused import if needed, but keeping for now
import { TransactionItem } from "@/features/dashboard";
import { useAppStore, useThemeStore } from "@/store";
import { FilterType, getFilterDateRange } from "@/utils"; // Added
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
// Modified imports
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    View,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";

// Removed local FilterType definition

export default function TransactionsScreen() {
    const router = useRouter();
    const themeMode = useThemeStore((state) => state.mode);
    const { getTransactions } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const borderColor = isDark ? "#374151" : "#E5E7EB";

    const [filter, setFilter] = useState<FilterType>("all");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
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

    // Effect to reload when custom dates change
    useEffect(() => {
        if (filter === "custom") {
            setOffset(0);
            setHasMore(true);
            loadTransactions(true);
        }
    }, [customStartDate, customEndDate]);

    // Removed renderFilterChip

    return (
        <YStack flex={1} bg={bgColor} pt={50}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <XStack items="center" px="$4" pb="$4" gap="$3">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text fontSize={20} fontWeight="bold" color={textColor}>
                    Riwayat Transaksi
                </Text>
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
                        <TransactionItem transaction={item} />
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 50 }}
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
                            <Text color={subtextColor}>Belum ada transaksi</Text>
                        </YStack>
                    ) : null
                }
            />
        </YStack>
    );
}
