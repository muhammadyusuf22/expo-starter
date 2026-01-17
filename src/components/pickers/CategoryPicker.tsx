/**
 * Category Picker Component
 * Modal-based picker for selecting transaction category
 */

import { useThemeStore } from "@/store";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    Platform,
    View as RNView,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Text, XStack, YStack } from "tamagui";

const EXPENSE_CATEGORIES = [
    { name: "Makanan & Minuman", icon: "🍔" },
    { name: "Transportasi", icon: "🚗" },
    { name: "Belanja", icon: "🛒" },
    { name: "Tagihan & Utilitas", icon: "💡" },
    { name: "Hiburan", icon: "🎬" },
    { name: "Kesehatan", icon: "💊" },
    { name: "Tabungan", icon: "💰" },
    { name: "Lainnya", icon: "📦" },
];

const INCOME_CATEGORIES = [
    { name: "Gaji", icon: "💵" },
    { name: "Bonus", icon: "🎁" },
    { name: "Investasi", icon: "📈" },
    { name: "Freelance", icon: "💻" },
    { name: "Hadiah", icon: "🎀" },
];

interface CategoryPickerProps {
    value: string;
    onChange: (category: string) => void;
    type: "income" | "expense";
}

export function CategoryPicker({ value, onChange, type }: CategoryPickerProps) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const themeMode = useThemeStore((state) => state.mode);
    const isDark = themeMode === "dark";

    const bgColor = isDark ? "#0F0F0F" : "#F9FAFB";
    const modalBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const itemBg = isDark ? "#374151" : "#F3F4F6";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBg = isDark ? "#374151" : "#F3F4F6";
    const accentColor = type === "expense" ? "#EF4444" : "#10B981";

    const categories =
        type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const selectedCategory = categories.find((c) => c.name === value);

    const handleSelect = (category: string) => {
        onChange(category);
        setVisible(false);
    };

    return (
        <YStack>
            <TouchableOpacity onPress={() => setVisible(true)}>
                <XStack
                    bg={itemBg}
                    p="$3"
                    rounded="$4"
                    justify="space-between"
                    items="center"
                >
                    <XStack items="center" gap="$2">
                        <Text fontSize={20}>{selectedCategory?.icon || "📁"}</Text>
                        <Text color={textColor}>
                            {selectedCategory?.name || t("category.select_category")}
                        </Text>
                    </XStack>
                    <ChevronDown size={16} color={subtextColor} />
                </XStack>
            </TouchableOpacity>

            <Modal
                visible={visible}
                animationType="slide"
                transparent={Platform.OS === "ios"}
                onRequestClose={() => setVisible(false)}
            >
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                {Platform.OS === "android" && (
                    <RNView
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                    />
                )}
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
                                {t("category.select_category")}
                            </Text>
                            <Text fontSize={12} color={subtextColor}>
                                {type === "expense"
                                    ? t("category.expense_category")
                                    : t("category.income_category")}
                            </Text>
                        </YStack>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <RNView style={[styles.closeBtn, { backgroundColor: inputBg }]}>
                                <X size={20} color={subtextColor} />
                            </RNView>
                        </TouchableOpacity>
                    </XStack>

                    {/* List */}
                    <ScrollView contentContainerStyle={styles.listContent}>
                        {categories.map((item) => {
                            const isSelected = item.name === value;

                            return (
                                <TouchableOpacity
                                    key={item.name}
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
                                    onPress={() => handleSelect(item.name)}
                                    activeOpacity={0.7}
                                >
                                    <XStack items="center" gap="$3" flex={1}>
                                        <RNView
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: inputBg },
                                            ]}
                                        >
                                            <Text fontSize={20}>{item.icon}</Text>
                                        </RNView>
                                        <Text
                                            fontWeight={isSelected ? "bold" : "normal"}
                                            color={textColor}
                                            flex={1}
                                        >
                                            {item.name}
                                        </Text>
                                    </XStack>
                                    {isSelected && <Check size={20} color={accentColor} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </YStack>
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
