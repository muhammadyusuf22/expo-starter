import { Transaction } from "@/db";
import { useAppStore } from "@/store";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionForm, TransactionFormData } from "./TransactionForm";

interface EditTransactionSheetProps {
    transaction?: Transaction | null;
    onClose: () => void;
}

export const EditTransactionSheet = forwardRef<
    BottomSheetModal,
    EditTransactionSheetProps
>(({ transaction, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const { updateTransaction } = useAppStore();

    const snapPoints = useMemo(() => ["85%"], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        [],
    );

    const handleSubmit = async (data: TransactionFormData) => {
        if (!transaction) return;

        try {
            await updateTransaction(transaction.id, {
                date: data.date,
                type: data.type,
                category: data.category,
                amount: data.amount,
                note: data.note,
                wallet_id: data.walletId,
            });
            onClose();
        } catch (error) {
            console.error("Failed to update transaction", error);
        }
    };

    if (!transaction) return null;

    return (
        <BottomSheetModal
            ref={ref}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            onDismiss={onClose}
        >
            <BottomSheetView
                style={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
            >
                <TransactionForm
                    initialData={{
                        type: transaction.type,
                        amount: transaction.amount,
                        category: transaction.category,
                        date: transaction.date,
                        walletId: transaction.wallet_id || "", // Fallback to empty string for initialData
                        note: transaction.note,
                    }}
                    onSubmit={handleSubmit}
                    submitLabel="Simpan Perubahan"
                />
            </BottomSheetView>
        </BottomSheetModal>
    );
});

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        padding: 16,
    },
});
