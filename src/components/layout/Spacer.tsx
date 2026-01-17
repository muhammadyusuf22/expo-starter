import { Stack, styled } from "tamagui";

export const Spacer = styled(Stack, {
    variants: {
        size: {
            xs: { height: 4 },
            sm: { height: 8 },
            md: { height: 16 },
            lg: { height: 24 },
            xl: { height: 32 },
            xxl: { height: 48 },
        },
        horizontal: {
            true: {},
        },
    } as const,

    defaultVariants: {
        size: "md",
    },
});

// Override width when horizontal
Spacer.staticConfig.variants = {
    ...Spacer.staticConfig.variants,
    horizontal: {
        true: (_, extras) => {
            const size = extras?.props?.size || "md";
            const sizeMap = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
            return { height: 0, width: sizeMap[size as keyof typeof sizeMap] };
        },
    },
};
