/**
 * Wallet Picker Component
 * Modal-based picker for selecting wallet
 */

import type { Wallet } from "@/db";
import { useThemeStore } from "@/store";
import { formatRupiah } from "@/utils";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import {
    Modal,
    View as RNView,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface WalletPickerProps {
    wallets: Wallet[];
    selected: string;
    onSelect: (walletId: string) => void;
    hasError?: boolean;
}

export function WalletPicker({
    wallets,
    selected,
    onSelect,
    hasError = false,
}: WalletPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const themeMode = useThemeStore((state) => state.mode);

    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBg = isDark ? "#374151" : "#F3F4F6";
    const modalBg = isDark ? "#0F0F0F" : "#F9FAFB";

    const selectedWallet = wallets.find((w) => w.id === selected);

    const handleSelect = (walletId: string) => {
        onSelect(walletId);
        setIsOpen(false);
    };

    return (
        <>
            {/* Trigger Button */}
            <TouchableOpacity
                style={[
                    styles.trigger,
                    {
                        backgroundColor: inputBg,
                        borderWidth: hasError ? 2 : 0,
                        borderColor: hasError ? "#EF4444" : "transparent",
                    },
                ]}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <XStack items="center" gap="$2" flex={1}>
                    <Text fontSize={18}>{selectedWallet?.icon || "💰"}</Text>
                    <YStack flex={1}>
                        <Text color={textColor}>
                            {selectedWallet?.name || "Pilih Wallet"}
                        </Text>
                        {selectedWallet && (
                            <Text fontSize={11} color={subtextColor}>
                                {formatRupiah(selectedWallet.current_balance || 0)}
                            </Text>
                        )}
                    </YStack>
                </XStack>
                <ChevronDown size={18} color={subtextColor} />
            </TouchableOpacity>

            {/* Modal Picker */}
            <Modal
                visible={isOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsOpen(false)}
            >
                <SafeAreaView
                    style={[styles.modalContainer, { backgroundColor: modalBg }]}
                >
                    {/* Header */}
                    <XStack
                        px="$4"
                        py="$3"
                        justify="space-between"
                        items="center"
                        style={{ backgroundColor: cardBg }}
                    >
                        <YStack>
                            <Text fontSize={18} fontWeight="bold" color={textColor}>
                                Pilih Wallet
                            </Text>
                            <Text fontSize={12} color={subtextColor}>
                                Dari mana transaksi ini?
                            </Text>
                        </YStack>
                        <TouchableOpacity onPress={() => setIsOpen(false)}>
                            <RNView style={[styles.closeBtn, { backgroundColor: inputBg }]}>
                                <X size={20} color={subtextColor} />
                            </RNView>
                        </TouchableOpacity>
                    </XStack>

                    {/* List */}
                    <ScrollView contentContainerStyle={styles.listContent}>
                        {wallets.map((item) => {
                            const isSelected = item.id === selected;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.item,
                                        { backgroundColor: isSelected ? "#DBEAFE" : cardBg },
                                    ]}
                                    onPress={() => handleSelect(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <XStack items="center" gap="$3" flex={1}>
                                        <RNView
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: inputBg },
                                            ]}
                                        >
                                            <Text fontSize={24}>{item.icon}</Text>
                                        </RNView>
                                        <YStack flex={1}>
                                            <Text
                                                fontWeight={isSelected ? "bold" : "normal"}
                                                color={textColor}
                                            >
                                                {item.name}
                                            </Text>
                                            <Text fontSize={12} color={subtextColor}>
                                                {formatRupiah(item.current_balance || 0)}
                                            </Text>
                                        </YStack>
                                    </XStack>
                                    {isSelected && <Check size={20} color="#3B82F6" />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        borderRadius: 12,
    },
    modalContainer: {
        flex: 1,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingVertical: 16,
        paddingBottom: 40,
    },
});
