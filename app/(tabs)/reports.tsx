/**
 * Reports Screen
 * Monthly financial insights: Income, Expense, Net, and Trends.
 */

import { CategoryChart } from "@/features/dashboard";
import { ExpenseTrendChart, MonthPicker } from "@/features/reports";
import { MonthlyReport, useAppStore, useThemeStore } from "@/store";
import { formatRupiah } from "@/utils";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    View as RNView,
    ScrollView,
    StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const themeMode = useThemeStore((state) => state.mode);
    const { getMonthlyReport } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";

    // Date State
    const current = new Date();
    const [selectedMonth, setSelectedMonth] = useState(current.getMonth());
    const [selectedYear, setSelectedYear] = useState(current.getFullYear());

    // Data State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState<MonthlyReport | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            // month is 0-indexed in state, but 1-indexed for logic if needed,
            // but check getMonthlyReport implementation (Step 1289):
            // const startStr = `${year}-${String(month).padStart(2, "0")}-01`;
            // If month is 1, string is "01".
            // So we need to pass (selectedMonth + 1).
            const data = await getMonthlyReport(selectedMonth + 1, selectedYear);
            setReportData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleMonthChange = (m: number, y: number) => {
        setSelectedMonth(m);
        setSelectedYear(y);
    };

    if (loading && !reportData && !refreshing) {
        return (
            <YStack flex={1} bg={bgColor} items="center" justify="center">
                <ActivityIndicator size="large" color="#10B981" />
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg={bgColor} pt={insets.top + 10}>
            {/* Header */}
            <YStack px="$4">
                <Text fontSize={24} fontWeight="bold" color={textColor}>
                    Laporan
                </Text>
                <MonthPicker
                    month={selectedMonth}
                    year={selectedYear}
                    onMonthChange={handleMonthChange}
                />
            </YStack>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {reportData && (
                    <YStack gap="$4">
                        {/* Summary Cards */}
                        <XStack gap="$3">
                            {/* Income */}
                            <YStack
                                flex={1}
                                bg={cardBg}
                                p="$3"
                                style={[styles.summaryCard, { borderColor: cardBorder }]}
                            >
                                <Text fontSize={11} color={subtextColor}>
                                    Pemasukan
                                </Text>
                                <Text fontWeight="bold" color="#10B981" fontSize={14}>
                                    {formatRupiah(reportData.totalIncome)}
                                </Text>
                            </YStack>
                            {/* Expense */}
                            <YStack
                                flex={1}
                                bg={cardBg}
                                p="$3"
                                style={[styles.summaryCard, { borderColor: cardBorder }]}
                            >
                                <Text fontSize={11} color={subtextColor}>
                                    Pengeluaran
                                </Text>
                                <Text fontWeight="bold" color="#EF4444" fontSize={14}>
                                    {formatRupiah(reportData.totalExpense)}
                                </Text>
                            </YStack>
                            {/* Net */}
                            <YStack
                                flex={1}
                                bg={cardBg}
                                p="$3"
                                style={[styles.summaryCard, { borderColor: cardBorder }]}
                            >
                                <Text fontSize={11} color={subtextColor}>
                                    Sisa
                                </Text>
                                <Text
                                    fontWeight="bold"
                                    color={reportData.netSavings >= 0 ? "#3B82F6" : "#EF4444"}
                                    fontSize={14}
                                >
                                    {formatRupiah(reportData.netSavings)}
                                </Text>
                            </YStack>
                        </XStack>

                        {/* Expense Trend */}
                        <ExpenseTrendChart data={reportData.dailyTrend} />

                        {/* Category Breakdown */}
                        <CategoryChart data={reportData.categoryBreakdown} />

                        {/* Detailed List */}
                        <YStack
                            gap="$2"
                            bg={cardBg}
                            p="$4"
                            style={{
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: cardBorder,
                            }}
                        >
                            <Text fontWeight="bold" color={textColor} mb="$2">
                                Detail Kategori
                            </Text>
                            {reportData.categoryBreakdown.map((item, index) => (
                                <XStack
                                    key={index}
                                    justify="space-between"
                                    items="center"
                                    py="$2"
                                    borderBottomWidth={
                                        index < reportData.categoryBreakdown.length - 1 ? 1 : 0
                                    }
                                    borderColor={cardBorder}
                                >
                                    <XStack items="center" gap="$2">
                                        <RNView
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                        <Text color={textColor} fontSize={13}>
                                            {item.label}
                                        </Text>
                                    </XStack>
                                    <XStack gap="$2">
                                        <Text color={textColor} fontWeight="600" fontSize={13}>
                                            {formatRupiah(item.value)}
                                        </Text>
                                        <Text color={subtextColor} fontSize={11}>
                                            {reportData.totalExpense > 0
                                                ? Math.round(
                                                    (item.value / reportData.totalExpense) * 100,
                                                ) + "%"
                                                : "0%"}
                                        </Text>
                                    </XStack>
                                </XStack>
                            ))}
                            {reportData.categoryBreakdown.length === 0 && (
                                <Text
                                    color={subtextColor}
                                    style={{ textAlign: "center" }}
                                    py="$4"
                                >
                                    Belum ada pengeluaran
                                </Text>
                            )}
                        </YStack>
                    </YStack>
                )}
            </ScrollView>
        </YStack>
    );
}

const styles = StyleSheet.create({
    summaryCard: {
        borderRadius: 12,
        borderWidth: 1,
    },
});
