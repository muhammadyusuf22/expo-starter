import { CategoryPicker, DatePicker, WalletPicker } from "@/components";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import {
    formatCurrencyInput,
    formatRupiah,
    getCurrentDateString,
} from "@/utils";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    View as RNView,
    ScrollView,
    StyleSheet,
    TextInput,
} from "react-native";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

export interface TransactionFormData {
    type: "expense" | "income";
    date: string;
    amount: number;
    category: string;
    walletId: string;
    note: string | null;
}

interface TransactionFormProps {
    initialData?: Partial<TransactionFormData>;
    onSubmit: (data: TransactionFormData) => Promise<void>;
    submitLabel?: string;
}

import { useTranslation } from "react-i18next";

export function TransactionForm({
    initialData,
    onSubmit,
    submitLabel = "Save",
}: TransactionFormProps) {
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);
    const { wallets } = useAppStore();

    const isDark = themeMode === "dark";
    const inputBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBorder = isDark ? "#374151" : "#E5E7EB";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const placeholderColor = isDark ? "#6B7280" : "#9CA3AF";
    const labelColor = isDark ? "#9CA3AF" : "#6B7280";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280"; // Assuming subtextColor is similar to labelColor

    // Form state
    const [type, setType] = useState<"expense" | "income">(
        initialData?.type || "expense",
    );
    const [date, setDate] = useState(initialData?.date || getCurrentDateString());
    const [amount, setAmount] = useState(
        initialData?.amount ? initialData.amount.toString() : "",
    );
    const [category, setCategory] = useState(
        initialData?.category || "Makanan & Minuman",
    );
    const [walletId, setWalletId] = useState(
        initialData?.walletId || wallets[0]?.id || "WALLET-CASH",
    );
    const [note, setNote] = useState(initialData?.note || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when screen gains focus (for fresh form on each visit)
    useFocusEffect(
        useCallback(() => {
            // Only reset if no initialData (i.e., adding new transaction, not editing)
            if (!initialData) {
                setType("expense");
                setDate(getCurrentDateString());
                setAmount("");
                setCategory(EXPENSE_CATEGORIES[0]);
                setWalletId(wallets[0]?.id || "WALLET-CASH");
                setNote("");
            }
        }, [initialData, wallets]),
    );

    // Check if wallet has sufficient balance for expense
    const selectedWallet = useMemo(
        () => wallets.find((w) => w.id === walletId),
        [wallets, walletId],
    );

    const numericAmount = useMemo(
        () => parseInt(amount.replace(/\D/g, ""), 10) || 0,
        [amount],
    );

    const isInsufficientBalance = useMemo(() => {
        if (type !== "expense") return false;
        if (!selectedWallet) return false;
        if (numericAmount === 0) return false;
        return (selectedWallet.current_balance || 0) < numericAmount;
    }, [type, selectedWallet, numericAmount]);

    const handleTypeChange = (newType: "expense" | "income") => {
        setType(newType);
        // Reset category if switching type, unless it was initial value and valid?
        // Simpler: just reset to first item.
        setCategory(
            newType === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0],
        );
    };

    const handleSubmit = async () => {
        if (!amount) return;
        setIsSubmitting(true);

        try {
            const numericAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
            await onSubmit({
                date,
                type,
                category,
                amount: numericAmount,
                note: note || null,
                walletId,
            });
        } catch (error) {
            console.error("Error adding transaction:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
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
                                {t("transaction.expense")}
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
                                {t("transaction.income")}
                            </Text>
                        </Button>
                    </XStack>

                    {/* Amount */}
                    <YStack>
                        <Text fontSize={14} fontWeight="600" color={textColor} mb="$2">
                            {t("form.amount")}
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
                        <Text fontSize={14} fontWeight="600" color={textColor} mb="$2">
                            {t("form.date")}
                        </Text>
                        <DatePicker value={date} onChange={setDate} />
                    </YStack>

                    {/* Category Picker */}
                    <YStack>
                        <Text fontSize={14} fontWeight="600" color={textColor} mb="$2">
                            {t("form.category")}
                        </Text>
                        <CategoryPicker
                            value={category}
                            onChange={setCategory}
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
                            hasError={isInsufficientBalance}
                        />
                        {isInsufficientBalance && (
                            <Text fontSize={12} color="#EF4444" mt="$1">
                                {t("form.insufficient_balance", {
                                    balance: formatRupiah(selectedWallet?.current_balance || 0),
                                })}
                            </Text>
                        )}
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
                        disabled={isSubmitting || !amount || isInsufficientBalance}
                        opacity={isSubmitting || !amount || isInsufficientBalance ? 0.5 : 1}
                        onPress={handleSubmit}
                    >
                        <XStack gap="$2" items="center" justify="center">
                            {isSubmitting ? (
                                <Spinner color="white" />
                            ) : (
                                <Text color="white" fontWeight="bold" fontSize={16}>
                                    {submitLabel}
                                </Text>
                            )}
                        </XStack>
                    </Button>
                </YStack>
            </ScrollView>
        </KeyboardAvoidingView>
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
