/**
 * Date Picker Component
 * Elegant date picker for selecting transaction date
 */

import { useThemeStore } from "@/store";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar, ChevronDown } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    Platform,
    View as RNView,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import { Button, Text, XStack, YStack } from "tamagui";

interface DatePickerProps {
    value: string; // YYYY-MM-DD format
    onChange: (date: string) => void;
}

// Format date to YYYY-MM-DD
function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Check if date is today
function isToday(dateStr: string): boolean {
    const today = formatDateString(new Date());
    return dateStr === today;
}

// Check if date is yesterday
function isYesterday(dateStr: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === formatDateString(yesterday);
}

export function DatePicker({ value, onChange }: DatePickerProps) {
    const { t, i18n } = useTranslation();
    const [showPicker, setShowPicker] = useState(false);
    const themeMode = useThemeStore((state) => state.mode);

    const isDark = themeMode === "dark";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";
    const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
    const cardBg = isDark ? "#1F1F1F" : "#FFFFFF";
    const inputBg = isDark ? "#374151" : "#F3F4F6";
    const modalBg = isDark ? "#0F0F0F" : "#F9FAFB";

    const dateValue = useMemo(() => new Date(value), [value]);

    const displayText = useMemo(() => {
        if (isToday(value)) return t("date_picker.today");
        if (isYesterday(value)) return t("date_picker.yesterday");

        // Use Intl or toLocaleDateString for localized formatting
        return new Date(value).toLocaleDateString(i18n.language, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }, [value, i18n.language, t]);

    const handleDateChange = (
        event: DateTimePickerEvent,
        selectedDate?: Date,
    ) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
        }
        if (selectedDate && event.type === "set") {
            onChange(formatDateString(selectedDate));
            if (Platform.OS === "ios") {
                // Don't close on iOS, let user confirm
            }
        }
    };

    const handleConfirm = () => {
        setShowPicker(false);
    };

    const handleQuickSelect = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        onChange(formatDateString(date));
        if (Platform.OS === "android") {
            setShowPicker(false);
        }
    };

    // Android: Show native picker directly
    if (Platform.OS === "android") {
        return (
            <>
                <TouchableOpacity
                    style={[styles.trigger, { backgroundColor: inputBg }]}
                    onPress={() => setShowPicker(true)}
                    activeOpacity={0.7}
                >
                    <XStack items="center" gap="$2" flex={1}>
                        <RNView
                            style={[
                                styles.iconContainer,
                                { backgroundColor: isDark ? "#2D3748" : "#E5E7EB" },
                            ]}
                        >
                            <Calendar size={16} color="#3B82F6" />
                        </RNView>
                        <YStack flex={1}>
                            <Text color={textColor} fontWeight="600">
                                {displayText}
                            </Text>
                            <Text fontSize={11} color={subtextColor}>
                                {value}
                            </Text>
                        </YStack>
                    </XStack>
                    <ChevronDown size={18} color={subtextColor} />
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={dateValue}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                    />
                )}
            </>
        );
    }

    // iOS: Show in modal
    return (
        <>
            <TouchableOpacity
                style={[styles.trigger, { backgroundColor: inputBg }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
            >
                <XStack items="center" gap="$2" flex={1}>
                    <RNView
                        style={[
                            styles.iconContainer,
                            { backgroundColor: isDark ? "#2D3748" : "#E5E7EB" },
                        ]}
                    >
                        <Calendar size={16} color="#3B82F6" />
                    </RNView>
                    <YStack flex={1}>
                        <Text color={textColor} fontWeight="600">
                            {displayText}
                        </Text>
                        <Text fontSize={11} color={subtextColor}>
                            {value}
                        </Text>
                    </YStack>
                </XStack>
                <ChevronDown size={18} color={subtextColor} />
            </TouchableOpacity>

            <Modal
                visible={showPicker}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPicker(false)}
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
                            {t("date_picker.select_date")}
                        </Text>
                        <Button size="$3" bg="#3B82F6" onPress={handleConfirm}>
                            <Text color="white" fontWeight="600">
                                {t("date_picker.done")}
                            </Text>
                        </Button>
                    </XStack>

                    {/* Quick Select Buttons */}
                    <XStack px="$4" py="$3" gap="$2">
                        <Button
                            flex={1}
                            size="$3"
                            bg={isToday(value) ? "#DBEAFE" : inputBg}
                            onPress={() => handleQuickSelect(0)}
                        >
                            <Text
                                color={isToday(value) ? "#3B82F6" : textColor}
                                fontWeight="600"
                            >
                                {t("date_picker.today")}
                            </Text>
                        </Button>
                        <Button
                            flex={1}
                            size="$3"
                            bg={isYesterday(value) ? "#DBEAFE" : inputBg}
                            onPress={() => handleQuickSelect(-1)}
                        >
                            <Text
                                color={isYesterday(value) ? "#3B82F6" : textColor}
                                fontWeight="600"
                            >
                                {t("date_picker.yesterday")}
                            </Text>
                        </Button>
                    </XStack>

                    {/* Date Picker */}
                    <RNView style={styles.pickerContainer}>
                        <DateTimePicker
                            value={dateValue}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            textColor={textColor}
                            style={{ width: "100%", height: 200 }}
                        />
                    </RNView>

                    {/* Selected Date Display */}
                    <YStack items="center" py="$4">
                        <Text fontSize={24} fontWeight="bold" color={textColor}>
                            {new Date(value).toLocaleDateString(i18n.language, {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </Text>
                    </YStack>
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
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        flex: 1,
    },
    pickerContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
});
