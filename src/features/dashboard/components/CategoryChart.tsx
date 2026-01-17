/**
 * Category Chart Component
 * Pie/Doughnut chart showing expense breakdown by category
 */

import type { CategoryBreakdown } from "@/store";
import { useThemeStore } from "@/store";
import { useTranslation } from "react-i18next";
import { Text as RNText, View as RNView, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Text } from "tamagui";

interface CategoryChartProps {
    data: CategoryBreakdown[];
}

export function CategoryChart({ data }: CategoryChartProps) {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";

    // Sort by value desc
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    // Filter to top 5, group rest as "Other"
    // For simplicity, just showing all (assuming usually < 10)
    // If many, gifted-charts handles it well

    if (data.length === 0) {
        return (
            <RNView
                style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
            >
                <Text fontWeight="bold" color={textColor} mb="$4">
                    {t("reports.expense_by_category")}
                </Text>
                <RNView style={styles.emptyContainer}>
                    <RNText style={styles.emptyIcon}>📊</RNText>
                    <RNText style={[styles.emptyText, { color: subtextColor }]}>
                        {t("reports.no_expense_data")}
                    </RNText>
                </RNView>
            </RNView>
        );
    }

    const pieData = data.map((item) => ({
        value: item.value,
        color: item.color,
        text: "",
    }));

    return (
        <RNView
            style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
        >
            <Text fontWeight="bold" color={textColor} mb="$4">
                {t("reports.expense_by_category")}
            </Text>
            <RNView style={styles.chartContainer}>
                <PieChart
                    data={pieData}
                    donut
                    radius={70}
                    innerRadius={50}
                    innerCircleColor={cardBg}
                    showText={false}
                />
                <RNView style={styles.legend}>
                    {data.slice(0, 5).map((item) => (
                        <RNView key={item.label} style={styles.legendItem}>
                            <RNView
                                style={[styles.legendDot, { backgroundColor: item.color }]}
                            />
                            <RNText
                                style={[styles.legendText, { color: textColor }]}
                                numberOfLines={1}
                            >
                                {item.label}
                            </RNText>
                        </RNView>
                    ))}
                </RNView>
            </RNView>
        </RNView>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 24,
        height: 150,
        justifyContent: "center",
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 13,
    },
    chartContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    legend: {
        marginLeft: 20,
        flex: 1,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 11,
        flex: 1,
    },
});
