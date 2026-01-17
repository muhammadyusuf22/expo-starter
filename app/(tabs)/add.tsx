/**
 * Add Transaction Screen
 * Redesigned with CategoryPicker and WalletPicker bottom sheets
 */

import { CategoryPicker, DatePicker, WalletPicker } from "@/components";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput, getCurrentDateString } from "@/utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

export default function AddTransactionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const themeMode = useThemeStore((state) => state.mode);
    const { wallets, addTransaction } = useAppStore();

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const inputBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBorder = isDark ? "#374151" : "#E5E7EB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const placeholderColor = isDark ? "#6B7280" : "#9CA3AF";
    const labelColor = isDark ? "#9CA3AF" : "#6B7280";

    // Form state
    const [type, setType] = useState<"expense" | "income">("expense");
    const [date, setDate] = useState(getCurrentDateString());
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Makanan & Minuman");
    const [walletId, setWalletId] = useState(wallets[0]?.id || "WALLET-CASH");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories =
        type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

    const handleTypeChange = (newType: "expense" | "income") => {
        setType(newType);
        // Reset category to first item of new type
        setCategory(
            newType === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
        );
    };

    const handleSubmit = async () => {
        if (!amount) return;
        setIsSubmitting(true);

        try {
            const numericAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
            await addTransaction({
                date,
                type,
                category,
                amount: numericAmount,
                note: note || null,
                wallet_id: walletId,
            });

            // Reset and go back
            router.replace("/");
        } catch (error) {
            console.error("Error adding transaction:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <YStack flex={1} bg={bgColor}>
            <YStack pt={insets.top + 10} px="$4" pb="$4">
                <Text fontSize={20} fontWeight="bold" color={textColor}>
                    Tambah Transaksi
                </Text>
            </YStack>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <YStack gap="$4">
                        {/* Type Toggle */}
                        <XStack bg={isDark ? "#1F1F1F" : "#E5E7EB"} p="$1" rounded="$4">
                            <Button
                                flex={1}
                                size="$3"
                                bg={type === "expense" ? "white" : "transparent"}
                                pressStyle={{ opacity: 0.8 }}
                                onPress={() => handleTypeChange("expense")}
                            >
                                <Text
                                    color={type === "expense" ? "#EF4444" : labelColor}
                                    fontWeight="600"
                                >
                                    Pengeluaran
                                </Text>
                            </Button>
                            <Button
                                flex={1}
                                size="$3"
                                bg={type === "income" ? "white" : "transparent"}
                                pressStyle={{ opacity: 0.8 }}
                                onPress={() => handleTypeChange("income")}
                            >
                                <Text
                                    color={type === "income" ? "#10B981" : labelColor}
                                    fontWeight="600"
                                >
                                    Pemasukan
                                </Text>
                            </Button>
                        </XStack>

                        {/* Amount - Larger and more prominent */}
                        <YStack>
                            <Text fontSize={12} color={labelColor} mb="$2">
                                Jumlah (Rp)
                            </Text>
                            <RNView
                                style={[
                                    styles.amountContainer,
                                    { backgroundColor: inputBg, borderColor: inputBorder },
                                ]}
                            >
                                <Text fontSize={16} color={labelColor}>
                                    Rp
                                </Text>
                                <TextInput
                                    value={amount}
                                    onChangeText={(text) => setAmount(formatCurrencyInput(text))}
                                    placeholder="0"
                                    placeholderTextColor={placeholderColor}
                                    keyboardType="numeric"
                                    style={[styles.amountInput, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>

                        {/* Date Picker */}
                        <YStack>
                            <Text fontSize={12} color={labelColor} mb="$2">
                                Tanggal
                            </Text>
                            <DatePicker value={date} onChange={setDate} />
                        </YStack>

                        {/* Category Picker */}
                        <YStack>
                            <Text fontSize={12} color={labelColor} mb="$2">
                                Kategori
                            </Text>
                            <CategoryPicker
                                categories={categories}
                                selected={category}
                                onSelect={setCategory}
                                type={type}
                            />
                        </YStack>

                        {/* Wallet Picker */}
                        <YStack>
                            <Text fontSize={12} color={labelColor} mb="$2">
                                Wallet
                            </Text>
                            <WalletPicker
                                wallets={wallets}
                                selected={walletId}
                                onSelect={setWalletId}
                            />
                        </YStack>

                        {/* Note */}
                        <YStack>
                            <Text fontSize={12} color={labelColor} mb="$2">
                                Catatan
                            </Text>
                            <RNView
                                style={[
                                    styles.inputContainer,
                                    { backgroundColor: inputBg, borderColor: inputBorder },
                                ]}
                            >
                                <TextInput
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Opsional"
                                    placeholderTextColor={placeholderColor}
                                    style={[styles.input, { color: textColor }]}
                                />
                            </RNView>
                        </YStack>

                        {/* Submit Button */}
                        <Button
                            size="$5"
                            bg="#10B981"
                            pressStyle={{ opacity: 0.8 }}
                            disabled={isSubmitting || !amount}
                            opacity={isSubmitting || !amount ? 0.5 : 1}
                            onPress={handleSubmit}
                        >
                            <XStack gap="$2" items="center" justify="center">
                                {isSubmitting ? (
                                    <Spinner color="white" />
                                ) : (
                                    <Text color="white" fontWeight="bold" fontSize={16}>
                                        Simpan Transaksi
                                    </Text>
                                )}
                            </XStack>
                        </Button>
                    </YStack>
                </ScrollView>
            </KeyboardAvoidingView>
        </YStack>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    input: {
        fontSize: 16,
        padding: 0,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 16,
        gap: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: "bold",
        padding: 0,
    },
});
