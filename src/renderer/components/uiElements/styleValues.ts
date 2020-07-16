import { IStyle } from '@fluentui/react';

export enum Colors {
    // named colors
    Black = '#000000',
    LightGray = '#e5e5e5',
    White = '#ffffff',

    // semantic colors
    Error = '#d54343',
    Success = '#3ac47d',
    Warning = '#e9c525',
};

export enum Spacing {
    FatMargin = '1.5rem',
    FatPadding = '1rem',
};

export enum Sizes {
    BorderWidth = '1px',
}

export const Mixins: Record<string, IStyle> = {
    borderBottom: {
        borderBottom: `${Sizes.BorderWidth} solid ${Colors.LightGray}`
    },
    rounded: {
        borderRadius: '.25rem',
    },
    shadow: {
        boxShadow: `0 0.46875rem 2.1875rem rgba(4,9,20,0.03),
            0 0.9375rem 1.40625rem rgba(4,9,20,0.03),
            0 0.25rem 0.53125rem rgba(4,9,20,0.05),
            0 0.125rem 0.1875rem rgba(4,9,20,0.03)`,
    },
};
