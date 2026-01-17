import { DatePicker } from "@/components/pickers";
import { Transaction } from "@/db";
import { TransactionItem } from "@/features/dashboard";
import { useAppStore, useThemeStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    View,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";

type FilterType = "all" | "today" | "week" | "month" | "custom";

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

    const getFilterDateRange = (type: FilterType) => {
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        if (type === "today") {
            return { startDate: today, endDate: today };
        }
        if (type === "week") {
            const d = new Date(now);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(d.setDate(diff));
            const startOfWeek = monday.toISOString().split("T")[0];
            return { startDate: startOfWeek, endDate: today };
        }
        if (type === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            // Local time adjustment to avoid timezone issues when converting to ISO
            const year = startOfMonth.getFullYear();
            const month = String(startOfMonth.getMonth() + 1).padStart(2, "0");
            const day = String(startOfMonth.getDate()).padStart(2, "0");
            return { startDate: `${year}-${month}-${day}`, endDate: today };
        }
        if (type === "custom") {
            return { startDate: customStartDate, endDate: customEndDate };
        }
        return undefined;
    };

    const loadTransactions = async (refresh = false, newFilter?: FilterType) => {
        const currentFilter = newFilter || filter;
        if (!refresh && !hasMore && currentFilter === filter) return;
        if (isLoading) return;

        setIsLoading(true);
        try {
            const currentOffset = refresh ? 0 : offset;
            const dateRange = getFilterDateRange(currentFilter);

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

    const renderFilterChip = (label: string, value: FilterType) => {
        const isActive = filter === value;
        return (
            <TouchableOpacity
                onPress={() => handleFilterChange(value)}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isActive
                        ? "#10B981"
                        : isDark
                            ? "#374151"
                            : "#E5E7EB",
                    marginRight: 8,
                }}
            >
                <Text
                    color={isActive ? "white" : textColor}
                    fontWeight={isActive ? "bold" : "normal"}
                    fontSize={13}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

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
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={
                        [
                            { label: "Semua", value: "all" },
                            { label: "Hari Ini", value: "today" },
                            { label: "Minggu Ini", value: "week" },
                            { label: "Bulan Ini", value: "month" },
                            { label: "Custom", value: "custom" },
                        ] as { label: string; value: FilterType }[]
                    }
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => renderFilterChip(item.label, item.value)}
                    style={{ marginBottom: filter === "custom" ? 16 : 0 }}
                />

                {filter === "custom" && (
                    <YStack
                        bg={cardBg}
                        p="$4"
                        mt="$1"
                        gap="$3"
                        style={{
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor,
                        }}
                    >
                        <Text fontWeight="600" fontSize={14} color={textColor}>
                            Rentang Waktu
                        </Text>
                        <XStack gap="$3" items="center">
                            <YStack flex={1} gap="$2">
                                <Text fontSize={12} color={subtextColor}>
                                    Dari
                                </Text>
                                <DatePicker
                                    value={customStartDate}
                                    onChange={setCustomStartDate}
                                />
                            </YStack>
                            <YStack pt="$6">
                                <ArrowRight size={16} color={subtextColor} />
                            </YStack>
                            <YStack flex={1} gap="$2">
                                <Text fontSize={12} color={subtextColor}>
                                    Sampai
                                </Text>
                                <DatePicker value={customEndDate} onChange={setCustomEndDate} />
                            </YStack>
                        </XStack>
                    </YStack>
                )}
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
