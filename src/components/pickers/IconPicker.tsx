/**
 * Icon Picker Component
 * Modal-based picker for selecting emoji icons
 */

import { useThemeStore } from "@/store";
import { Check, ChevronDown, Keyboard, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    View as RNView,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { Button, Text, XStack, YStack } from "tamagui";

// Curated icons for finance
const FINANCE_ICONS = [
    "💵",
    "🏦",
    "📱",
    "💳",
    "💰",
    "🪙",
    "🏧",
    "💹",
    "💴",
    "💶",
    "💷",
    "💸",
    "🤑",
    "💎",
    "🪪",
    "📊",
    "📈",
    "📉",
    "🏠",
    "🚗",
    "✈️",
    "🎓",
    "🏥",
    "🛒",
    "🍔",
    "☕",
    "🎬",
    "🎮",
    "📦",
    "🎁",
    "🎯",
    "⚡",
];

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
    label?: string;
}

export function IconPicker({
    value,
    onChange,
    label = "Icon",
}: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customEmoji, setCustomEmoji] = useState("");
    const inputRef = useRef<TextInput>(null);
    const { t } = useTranslation();
    const themeMode = useThemeStore((state) => state.mode);

    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBg = isDark ? "#374151" : "#F3F4F6";
    const modalBg = isDark ? "#0F0F0F" : "#F9FAFB";

    const handleSelect = (icon: string) => {
        onChange(icon);
        setIsOpen(false);
        setShowCustomInput(false);
        setCustomEmoji("");
    };

    const handleCustomSubmit = () => {
        if (customEmoji) {
            // Take first emoji character
            const emoji = [...customEmoji][0];
            if (emoji) {
                handleSelect(emoji);
            }
        }
    };

    const openCustomInput = () => {
        setShowCustomInput(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <>
            {/* Trigger Button */}
            <YStack>
                <Text fontSize={12} color={subtextColor} mb="$1">
                    {label}
                </Text>
                <TouchableOpacity
                    style={[styles.trigger, { backgroundColor: inputBg }]}
                    onPress={() => setIsOpen(true)}
                    activeOpacity={0.7}
                >
                    <Text fontSize={32}>{value}</Text>
                    <ChevronDown
                        size={18}
                        color={subtextColor}
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            </YStack>

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
                        <Text fontSize={18} fontWeight="bold" color={textColor}>
                            {t("icon_picker.select_icon")}
                        </Text>
                        <TouchableOpacity onPress={() => setIsOpen(false)}>
                            <RNView style={[styles.closeBtn, { backgroundColor: inputBg }]}>
                                <X size={20} color={subtextColor} />
                            </RNView>
                        </TouchableOpacity>
                    </XStack>

                    <ScrollView contentContainerStyle={styles.listContent}>
                        {/* Custom Emoji Input */}
                        {showCustomInput ? (
                            <YStack px="$4" py="$3" bg={cardBg} mb="$3" rounded="$4" mx="$4">
                                <Text fontSize={12} color={subtextColor} mb="$2">
                                    {t("icon_picker.type_emoji")}
                                </Text>
                                <XStack gap="$2" items="center">
                                    <RNView
                                        style={[
                                            styles.customInputBox,
                                            { backgroundColor: inputBg },
                                        ]}
                                    >
                                        <TextInput
                                            ref={inputRef}
                                            value={customEmoji}
                                            onChangeText={setCustomEmoji}
                                            placeholder="🎯"
                                            placeholderTextColor="#9CA3AF"
                                            style={[styles.customInput, { color: textColor }]}
                                            maxLength={2}
                                            autoFocus
                                        />
                                    </RNView>
                                    <Button
                                        flex={1}
                                        bg="#3B82F6"
                                        onPress={handleCustomSubmit}
                                        disabled={!customEmoji}
                                        opacity={customEmoji ? 1 : 0.5}
                                    >
                                        <Text color="white" fontWeight="600">
                                            {t("icon_picker.select")}
                                        </Text>
                                    </Button>
                                    <Button
                                        bg={inputBg}
                                        onPress={() => setShowCustomInput(false)}
                                    >
                                        <Text color={subtextColor}>{t("icon_picker.cancel")}</Text>
                                    </Button>
                                </XStack>
                            </YStack>
                        ) : (
                            <TouchableOpacity
                                style={[styles.customButton, { backgroundColor: cardBg }]}
                                onPress={openCustomInput}
                            >
                                <XStack items="center" gap="$2">
                                    <Keyboard size={20} color="#3B82F6" />
                                    <Text color="#3B82F6" fontWeight="600">
                                        {t("icon_picker.use_custom_emoji")}
                                    </Text>
                                </XStack>
                            </TouchableOpacity>
                        )}

                        {/* Icon Grid */}
                        <Text fontSize={12} color={subtextColor} px="$4" mb="$2">
                            {t("icon_picker.or_select_from_list")}
                        </Text>
                        <RNView style={styles.iconGrid}>
                            {FINANCE_ICONS.map((icon) => {
                                const isSelected = icon === value;
                                return (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconItem,
                                            { backgroundColor: isSelected ? "#DBEAFE" : cardBg },
                                        ]}
                                        onPress={() => handleSelect(icon)}
                                        activeOpacity={0.7}
                                    >
                                        <Text fontSize={28}>{icon}</Text>
                                        {isSelected && (
                                            <RNView style={styles.checkBadge}>
                                                <Check size={10} color="white" />
                                            </RNView>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </RNView>
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
        justifyContent: "center",
        padding: 12,
        borderRadius: 12,
        alignSelf: "flex-start",
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
    listContent: {
        paddingVertical: 16,
        paddingBottom: 40,
    },
    customButton: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    customInputBox: {
        width: 60,
        height: 50,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    customInput: {
        fontSize: 28,
        textAlign: "center",
        width: "100%",
    },
    iconGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        gap: 8,
    },
    iconItem: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    checkBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#3B82F6",
        justifyContent: "center",
        alignItems: "center",
    },
});
