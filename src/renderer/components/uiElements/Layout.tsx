import { mergeStyles } from '@fluentui/react';
import * as React from "react";
import { Spacing } from './styleValues';

export interface LayoutProps {
    split?: number;
    gridTemplateColumns?: string;
    noMargin?: boolean;
    noGap?: boolean;
    alignContent?: string;
    children: any;
}

const getGridTemplateColumns = (props: LayoutProps) => {
    let gridTemplateColumns = props.gridTemplateColumns;
    if (!gridTemplateColumns) {
        const cols = props.split || 1;
        gridTemplateColumns = new Array(cols + 1).join(' 1fr');
    }
    return gridTemplateColumns;
}

export const Layout = (props: LayoutProps) => {
    const style: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: getGridTemplateColumns(props),
        gridGap: props.noGap ? 0 : Spacing.FatMargin,
        margin: props.noMargin ? 0 : Spacing.FatMargin,
        alignContent: props.alignContent,
    };

    return <div style={style}>
        {props.children}
    </div>;
};