import { createTheme, loadTheme } from '@fluentui/react';
import { initializeIcons } from '@uifabric/icons';

const palette = require('@renderer/palette.json');
const theme = createTheme({ 
    defaultFontStyle: { 
        fontFamily: '"Noto Sans", sans-serif',
        fontWeight: 300,
    },
    fonts: {
        tiny: {
            fontSize: '10px',
        },
        xSmall: {
            fontSize: '11px',
        },
        small: {
            fontSize: '12px',
        },
        smallPlus: {
            fontSize: '13px',
        },
        medium: {
            fontSize: '14px',
        },
        mediumPlus: {
            fontSize: '16px',
        },
        large: {
            fontSize: '18px',
        },
        xLarge: {
            fontSize: '20px',
        },
        xxLarge: {
            fontSize: '32px',
        },
        mega: {
            fontSize: '64px',
        },
    },
    palette,
});

export const initializeTheme = () => {
    initializeIcons('fonts/');
    loadTheme(theme);
};
