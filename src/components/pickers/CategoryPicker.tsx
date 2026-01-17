/**
 * Category Picker Component
 * Modal-based picker for selecting transaction category
 */

import { useThemeStore } from "@/store";
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

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
    "Makanan & Minuman": "🍔",
    Transportasi: "🚗",
    Belanja: "🛒",
    "Tagihan & Utilitas": "💡",
    Hiburan: "🎬",
    Kesehatan: "💊",
    Tabungan: "💰",
    Lainnya: "📦",
    // Income categories
    Gaji: "💵",
    Bonus: "🎁",
    Investasi: "📈",
    Freelance: "💻",
    Hadiah: "🎀",
};

interface CategoryPickerProps {
    categories: string[];
    selected: string;
    onSelect: (category: string) => void;
    type?: "expense" | "income";
}

export function CategoryPicker({
    categories,
    selected,
    onSelect,
    type = "expense",
}: CategoryPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const themeMode = useThemeStore((state) => state.mode);

    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBg = isDark ? "#374151" : "#F3F4F6";
    const modalBg = isDark ? "#0F0F0F" : "#F9FAFB";
    const accentColor = type === "expense" ? "#EF4444" : "#10B981";

    const handleSelect = (category: string) => {
        onSelect(category);
        setIsOpen(false);
    };

    return (
        <>
            {/* Trigger Button */}
            <TouchableOpacity
                style={[styles.trigger, { backgroundColor: inputBg }]}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <XStack items="center" gap="$2" flex={1}>
                    <Text fontSize={18}>{CATEGORY_ICONS[selected] || "📌"}</Text>
                    <Text color={textColor} flex={1}>
                        {selected}
                    </Text>
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
                                Pilih Kategori
                            </Text>
                            <Text fontSize={12} color={subtextColor}>
                                {type === "expense"
                                    ? "Kategori Pengeluaran"
                                    : "Kategori Pemasukan"}
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
                        {categories.map((item) => {
                            const isSelected = item === selected;
                            const icon = CATEGORY_ICONS[item] || "📌";

                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.item,
                                        {
                                            backgroundColor: isSelected
                                                ? type === "expense"
                                                    ? "#FEE2E2"
                                                    : "#D1FAE5"
                                                : cardBg,
                                        },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                    activeOpacity={0.7}
                                >
                                    <XStack items="center" gap="$3" flex={1}>
                                        <RNView
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: inputBg },
                                            ]}
                                        >
                                            <Text fontSize={20}>{icon}</Text>
                                        </RNView>
                                        <Text
                                            fontWeight={isSelected ? "bold" : "normal"}
                                            color={textColor}
                                            flex={1}
                                        >
                                            {item}
                                        </Text>
                                    </XStack>
                                    {isSelected && <Check size={20} color={accentColor} />}
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
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingVertical: 16,
        paddingBottom: 40,
    },
});
