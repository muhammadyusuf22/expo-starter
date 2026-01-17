import { MotiPressable } from "moti/interactions";
import React from "react";
import { Stack } from "tamagui";
import { MyText } from "./MyText";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface MyButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    iconAfter?: React.ReactNode;
}

const getSizeStyles = (size: ButtonSize) => {
    switch (size) {
        case "sm":
            return { px: "$3" as const, py: "$2" as const };
        case "md":
            return { px: "$4" as const, py: "$3" as const };
        case "lg":
            return { px: "$5" as const, py: "$4" as const };
        default:
            return { px: "$4" as const, py: "$3" as const };
    }
};

const getTextColor = (variant: ButtonVariant) => {
    switch (variant) {
        case "primary":
            return "#FFFFFF";
        case "secondary":
            return "#FFFFFF";
        case "ghost":
            return "#8B5CF6";
        default:
            return "#FFFFFF";
    }
};

export function MyButton({
    children,
    onPress,
    variant = "primary",
    size = "md",
    fullWidth = false,
    disabled = false,
    icon,
    iconAfter,
}: MyButtonProps) {
    const sizeStyles = getSizeStyles(size);
    const textColor = getTextColor(variant);

    const getBgColor = () => {
        switch (variant) {
            case "primary":
                return "#8B5CF6";
            case "secondary":
                return "rgba(255, 255, 255, 0.1)";
            case "ghost":
                return "transparent";
            default:
                return "#8B5CF6";
        }
    };

    return (
        <MotiPressable
            onPress={disabled ? undefined : onPress}
            animate={({ pressed }) => {
                "worklet";
                return {
                    scale: pressed ? 0.96 : 1,
                    opacity: pressed ? 0.9 : 1,
                };
            }}
            transition={{
                type: "timing",
                duration: 100,
            }}
            style={fullWidth ? { flex: 1 } : undefined}
        >
            <Stack
                flexDirection="row"
                items="center"
                justify="center"
                rounded="$4"
                gap="$2"
                opacity={disabled ? 0.5 : 1}
                bg={getBgColor()}
                borderWidth={variant === "secondary" ? 1 : 0}
                borderColor={variant === "secondary" ? "$color4" : undefined}
                {...sizeStyles}
            >
                {icon}
                <MyText variant="body" fontWeight="600" color={textColor}>
                    {children}
                </MyText>
                {iconAfter}
            </Stack>
        </MotiPressable>
    );
}
