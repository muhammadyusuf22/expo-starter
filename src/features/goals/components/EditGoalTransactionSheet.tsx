import { GoalTransaction } from "@/db";
import { useAppStore, useThemeStore } from "@/store";
import { formatCurrencyInput } from "@/utils";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Button, Spinner, Text, XStack, YStack } from "tamagui";

interface EditGoalTransactionSheetProps {
    transaction: GoalTransaction | null;
    onClose: () => void;
}

export const EditGoalTransactionSheet = forwardRef<
    BottomSheetModal,
    EditGoalTransactionSheetProps
>(({ transaction, onClose }, ref) => {
    const themeMode = useThemeStore((state) => state.mode);
    const updateGoalTransaction = useAppStore(
        (state) => state.updateGoalTransaction,
    );

    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form when transaction changes
    useEffect(() => {
        if (transaction) {
            setAmount(transaction.amount.toString());
            setNote(transaction.note || "");
        }
    }, [transaction]);

    const snapPoints = useMemo(() => ["50%"], []);

    const isDark = themeMode === "dark";
    const bgColor = isDark ? "#1F1F1F" : "#FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const inputBg = isDark ? "#374151" : "#F3F4F6";

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        [],
    );

    const handleSubmit = async () => {
        if (!transaction) return;
        setIsSubmitting(true);
        try {
            await updateGoalTransaction(transaction.id, {
                amount: parseInt(amount.replace(/\D/g, ""), 10) || 0,
                note,
            });
            // Handle close is done by parent usually or we dismiss here
            // We can call dismiss via ref if we cast it, but better to just rely on user or parent handling.
            // But UX wise, we should close.
            // Since ref is forwarded, we can't easily access .dismiss() unless we useImperativeHandle?
            // Actually usually parent handles close via onClose prop coupled with dismiss?
            // Let's just call onClose() and let parent dismiss.
            onClose();
        } catch (error) {
            console.error("Failed to update goal transaction", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: bgColor }}
            handleIndicatorStyle={{ backgroundColor: subtextColor }}
            onDismiss={() => {
                // Reset form?
            }}
        >
            <BottomSheetScrollView style={{ padding: 20 }}>
                <Text fontSize={18} fontWeight="bold" color={textColor} mb="$4">
                    Edit {transaction?.type === "topup" ? "Topup" : "Penarikan"}
                </Text>

                <YStack gap="$3">
                    <YStack>
                        <Text fontSize={12} color={subtextColor} mb="$1">
                            Jumlah (Rp)
                        </Text>
                        <View style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                            <TextInput
                                value={formatCurrencyInput(amount)}
                                onChangeText={(t) => setAmount(t.replace(/\D/g, ""))}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                style={[styles.input, { color: textColor }]}
                            />
                        </View>
                    </YStack>

                    <YStack>
                        <Text fontSize={12} color={subtextColor} mb="$1">
                            Catatan
                        </Text>
                        <View style={[styles.sheetInput, { backgroundColor: inputBg }]}>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Catatan..."
                                placeholderTextColor="#9CA3AF"
                                style={[styles.input, { color: textColor }]}
                            />
                        </View>
                    </YStack>

                    <Button
                        bg="#3B82F6"
                        pressStyle={{ opacity: 0.8 }}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        opacity={isSubmitting ? 0.7 : 1}
                        mt="$2"
                    >
                        <XStack gap="$2" items="center" justify="center">
                            {isSubmitting ? (
                                <Spinner color="white" />
                            ) : (
                                <Text color="white" fontWeight="bold">
                                    Simpan Perubahan
                                </Text>
                            )}
                        </XStack>
                    </Button>

                    <Button chromeless onPress={onClose} pressStyle={{ opacity: 0.8 }}>
                        <Text color={subtextColor}>Batal</Text>
                    </Button>
                </YStack>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
});

const styles = StyleSheet.create({
    sheetInput: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    input: {
        fontSize: 16,
        padding: 0,
    },
});
