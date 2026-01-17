import type { DailyTrend } from "@/store"; // Need to export from store index
import { useThemeStore } from "@/store";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Text } from "tamagui";

interface ExpenseTrendChartProps {
    data: DailyTrend[];
}

export function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const cardBorder = isDark ? "#374151" : "#E5E7EB";
    const barColor = "#EF4444"; // Red for expense

    const screenWidth = Dimensions.get("window").width;
    const chartWidth = screenWidth - 80;
    const daysInMonth = data.length;
    // Calculate sizing to fit screen
    const spacing = 4;
    const barWidth = (chartWidth - daysInMonth * spacing) / daysInMonth;

    if (data.every((d) => d.amount === 0)) {
        return (
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: cardBg,
                        borderColor: cardBorder,
                        alignItems: "center",
                        justifyContent: "center",
                        height: 200,
                    },
                ]}
            >
                <Text fontWeight="bold" color={textColor}>
                    {t("reports.daily_expense_trend")}
                </Text>
                <Text color="#9CA3AF" fontSize={12} mt="$2">
                    {t("reports.no_data")}
                </Text>
            </View>
        );
    }

    const chartData = data.map((d) => ({
        value: d.amount,
        label: d.day % 5 === 0 || d.day === 1 ? String(d.day) : "",
        frontColor: barColor,
    }));

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
        >
            <Text fontWeight="bold" color={textColor} mb="$4">
                {t("reports.daily_expense_trend")}
            </Text>
            <View style={{ overflow: "hidden" }}>
                <BarChart
                    data={chartData}
                    barWidth={Math.max(4, barWidth)} // Ensure at least 4px
                    spacing={spacing}
                    roundedTop
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                    width={chartWidth}
                    xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 10 }}
                    noOfSections={4}
                    maxValue={Math.max(...data.map((d) => d.amount)) * 1.2}
                // If content is wider than chartWidth (due to min barWidth), it will scroll
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
});
