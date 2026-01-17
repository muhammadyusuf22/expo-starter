import {
    Blur,
    Canvas,
    Group,
    LinearGradient,
    RoundedRect,
    vec,
} from "@shopify/react-native-skia";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { GetProps, Stack, styled } from "tamagui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CardContainer = styled(Stack, {
    position: "relative",
    overflow: "hidden",
    rounded: "$6",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",

    variants: {
        size: {
            sm: {
                minH: 120,
            },
            md: {
                minH: 180,
            },
            lg: {
                minH: 220,
            },
        },
    } as const,

    defaultVariants: {
        size: "md",
    },
});

type CardContainerProps = GetProps<typeof CardContainer>;

interface GlassCardProps extends CardContainerProps {
    children: React.ReactNode;
    width?: number;
    height?: number;
    gradientColors?: string[];
    blurAmount?: number;
}

export function GlassCard({
    children,
    width = SCREEN_WIDTH - 32,
    height = 180,
    gradientColors = [
        "rgba(99, 102, 241, 0.4)",
        "rgba(139, 92, 246, 0.2)",
        "rgba(16, 185, 129, 0.1)",
    ],
    blurAmount = 15,
    ...props
}: GlassCardProps) {
    const borderRadius = 24;

    return (
        <CardContainer width={width} height={height} {...props}>
            {/* Skia Canvas for glassmorphism effect */}
            <Canvas style={[StyleSheet.absoluteFill, { borderRadius }]}>
                <Group>
                    {/* Background blur layer */}
                    <RoundedRect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        r={borderRadius}
                    >
                        <LinearGradient
                            start={vec(0, 0)}
                            end={vec(width, height)}
                            colors={gradientColors}
                        />
                    </RoundedRect>

                    {/* Blur effect */}
                    <Blur blur={blurAmount} />

                    {/* Subtle overlay for glass effect */}
                    <RoundedRect
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        r={borderRadius}
                    >
                        <LinearGradient
                            start={vec(0, 0)}
                            end={vec(0, height)}
                            colors={[
                                "rgba(255, 255, 255, 0.15)",
                                "rgba(255, 255, 255, 0.05)",
                            ]}
                        />
                    </RoundedRect>
                </Group>
            </Canvas>

            {/* Content */}
            <View style={styles.content}>{children}</View>
        </CardContainer>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: 20,
        zIndex: 1,
    },
});
