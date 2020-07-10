import { mergeStyles } from '@fluentui/react';
import * as React from "react";
import { Colors, Mixins, Spacing } from './styleConstants';

export interface CardProps {
    heading?: any;
    children: any;
}

const cardClassName = mergeStyles(
    {
        backgroundColor: Colors.White,
        padding: Spacing.FatPadding,
        overflowX: 'auto',
    }, 
    Mixins.rounded, 
    Mixins.shadow,
);

const cardHeadingClassName = mergeStyles(
    {
        fontWeight: 400,
        margin: `0 -${Spacing.FatPadding} ${Spacing.FatPadding}`,
        padding: `0 ${Spacing.FatPadding} ${Spacing.FatPadding}`,
    },
    Mixins.borderBottom,
);

export const Card = (props: CardProps) => {
    return <div className={cardClassName}>
        {props.heading ? <h3 className={cardHeadingClassName}>{props.heading}</h3> : ''}
        {props.children}
    </div>;
}