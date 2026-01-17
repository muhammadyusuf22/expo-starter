import React, { useState } from "react";
import { GetProps, Stack, styled, Input as TamaguiInput } from "tamagui";
import { MyText } from "./MyText";

const InputFrame = styled(TamaguiInput, {
    bg: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    rounded: "$4",
    px: "$4",
    py: "$3",
    fontSize: 16,
    color: "$color",
    fontFamily: "$body",
    placeholderTextColor: "rgba(255, 255, 255, 0.4)",

    focusStyle: {
        borderColor: "#8B5CF6",
        bg: "rgba(99, 102, 241, 0.08)",
    },

    variants: {
        hasError: {
            true: {
                borderColor: "$red10",
                focusStyle: {
                    borderColor: "$red10",
                },
            },
        },
        disabled: {
            true: {
                opacity: 0.5,
                bg: "rgba(255, 255, 255, 0.02)",
            },
        },
    } as const,
});

type InputFrameProps = GetProps<typeof InputFrame>;

interface InputProps extends InputFrameProps {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({ label, error, helperText, ...props }: InputProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <Stack gap="$1.5">
            {label && (
                <MyText variant="label" color="#A0A0B2">
                    {label}
                </MyText>
            )}
            <InputFrame
                hasError={!!error}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {error && (
                <MyText variant="caption" color="$red10">
                    {error}
                </MyText>
            )}
            {helperText && !error && (
                <MyText variant="caption" color="#A0A0B2">
                    {helperText}
                </MyText>
            )}
        </Stack>
    );
}
