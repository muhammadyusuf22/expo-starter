/**
 * Home Screen - Dashboard
 */

import {
    BalanceCard,
    BudgetProgress,
    CategoryChart,
    SavingsRateCard,
    TransactionList,
} from "@/features/dashboard";
import { useAppStore, useThemeStore } from "@/store";
import { getTodayFullDate } from "@/utils";
import { useRouter } from "expo-router";
import { Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
    View as RNView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner, Text, XStack, YStack } from "tamagui";

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const { isLoading, dashboard } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const headerBg = isDark ? "#0F0F0F" : "#FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const iconBtnBg = isDark ? "#374151" : "#F3F4F6";

    if (isLoading || !dashboard) {
        return (
            <YStack flex={1} bg={bgColor} items="center" justify="center">
                <Spinner size="large" color="#10B981" />
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg={bgColor}>
            {/* Header */}
            <YStack bg={headerBg} pt={insets.top} px="$4" pb="$3">
                <XStack justify="space-between" items="center">
                    <YStack>
                        <XStack items="center" gap="$2">
                            <Text fontSize={20} fontWeight="bold" color={textColor}>
                                Spen<Text color="#10B981">duit</Text>
                            </Text>
                            <RNView
                                style={{
                                    backgroundColor: isDark ? "#374151" : "#E5E7EB",
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                }}
                            >
                                <Text fontSize={10} fontWeight="bold" color={subtextColor}>
                                    Lite
                                </Text>
                            </RNView>
                        </XStack>
                        <Text fontSize={12} color={subtextColor}>
                            {getTodayFullDate()}
                        </Text>
                    </YStack>
                    <TouchableOpacity onPress={() => router.push("/settings")}>
                        <RNView
                            style={[styles.settingsBtn, { backgroundColor: iconBtnBg }]}
                        >
                            <Settings size={16} color={subtextColor} />
                        </RNView>
                    </TouchableOpacity>
                </XStack>
            </YStack>

            {/* Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                <YStack gap="$4">
                    {/* Balance Card */}
                    <BalanceCard
                        balance={dashboard.balance}
                        income={dashboard.totalIncome}
                        expense={dashboard.totalExpense}
                    />

                    {/* Savings Rate */}
                    <SavingsRateCard rate={dashboard.savingsRate} />

                    {/* Budget Monitoring */}
                    <BudgetProgress budgets={dashboard.budgetOverview} />

                    {/* Category Chart */}
                    <CategoryChart data={dashboard.categoryBreakdown} />

                    {/* Recent Transactions */}
                    <TransactionList limit={5} />
                </YStack>
            </ScrollView>
        </YStack>
    );
}

const styles = StyleSheet.create({
    settingsBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
});
