/**
 * Add Transaction Screen
 * Redesigned with CategoryPicker and WalletPicker bottom sheets
 */

import {
    TransactionForm,
    TransactionFormData,
} from "@/features/transactions/components/TransactionForm";
import { useAppStore, useThemeStore } from "@/store";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

export default function AddTransactionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const themeMode = useThemeStore((state) => state.mode);
    const { addTransaction } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";

    const handleSubmit = async (data: TransactionFormData) => {
        try {
            await addTransaction({
                date: data.date,
                type: data.type,
                category: data.category,
                amount: data.amount,
                note: data.note,
                wallet_id: data.walletId,
            });

            // Reset and go back
            router.replace("/");
        } catch (error) {
            console.error("Error adding transaction:", error);
            throw error; // Re-throw to let form handle error state if needed
        }
    };

    return (
        <YStack flex={1} bg={bgColor}>
            <YStack pt={insets.top + 10} px="$4" pb="$4">
                <Text fontSize={20} fontWeight="bold" color={textColor}>
                    Tambah Transaksi
                </Text>
            </YStack>

            <TransactionForm onSubmit={handleSubmit} />
        </YStack>
    );
}
