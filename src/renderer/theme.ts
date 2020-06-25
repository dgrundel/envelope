import { createTheme, loadTheme } from '@fluentui/react';
import { initializeIcons } from '@uifabric/icons';

const palette = require('@renderer/palette.json');
const theme = createTheme({ palette });

export const initializeTheme = () => {
    initializeIcons('fonts/');
    loadTheme(theme);
};
