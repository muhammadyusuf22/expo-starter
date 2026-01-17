/**
 * Balance Card Component
 * Gradient card showing total balance, income, and expense
 */

import { formatRupiah } from "@/utils";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface BalanceCardProps {
    balance: number;
    income: number;
    expense: number;
}

export function BalanceCard({ balance, income, expense }: BalanceCardProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <YStack gap="$3">
                    {/* Balance Label & Amount */}
                    <YStack>
                        <Text color="rgba(255,255,255,0.8)" fontSize={14}>
                            Sisa Uang (Balance)
                        </Text>
                        <Text color="white" fontSize={32} fontWeight="bold">
                            {formatRupiah(balance)}
                        </Text>
                    </YStack>

                    {/* Income / Expense Row */}
                    <XStack
                        bg="rgba(255,255,255,0.15)"
                        rounded="$4"
                        p="$3"
                        justify="space-between"
                    >
                        <YStack>
                            <Text color="rgba(255,255,255,0.7)" fontSize={12}>
                                Pemasukan
                            </Text>
                            <Text color="white" fontSize={14} fontWeight="600">
                                {formatRupiah(income)}
                            </Text>
                        </YStack>
                        <YStack items="flex-end">
                            <Text color="rgba(255,255,255,0.7)" fontSize={12}>
                                Pengeluaran
                            </Text>
                            <Text color="white" fontSize={14} fontWeight="600">
                                {formatRupiah(expense)}
                            </Text>
                        </YStack>
                    </XStack>
                </YStack>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    gradient: {
        padding: 20,
        borderRadius: 16,
    },
});
