import { initializeIcons } from '@uifabric/icons';
import { createTheme, loadTheme } from '@fluentui/react';

const myTheme = createTheme({
    palette: {
        themePrimary: '#2b9e76',
        themeLighterAlt: '#f4fbf9',
        themeLighter: '#d4efe6',
        themeLight: '#b0e2d1',
        themeTertiary: '#6fc5a7',
        themeSecondary: '#3daa84',
        themeDarkAlt: '#268e6a',
        themeDark: '#207859',
        themeDarker: '#185942',
        neutralLighterAlt: '#faf9f8',
        neutralLighter: '#f3f2f1',
        neutralLight: '#edebe9',
        neutralQuaternaryAlt: '#e1dfdd',
        neutralQuaternary: '#d0d0d0',
        neutralTertiaryAlt: '#c8c6c4',
        neutralTertiary: '#a19f9d',
        neutralSecondary: '#605e5c',
        neutralPrimaryAlt: '#3b3a39',
        neutralPrimary: '#323130',
        neutralDark: '#201f1e',
        black: '#000000',
        white: '#ffffff',
}});

export const initializeTheme = () => {
    initializeIcons('fonts/');
    loadTheme(myTheme);
};
