import * as React from "react";

import '@public/components/Box.scss';

export enum BoxStyle {
    success = 'box-success',
}

export interface BoxProps {
    style?: BoxStyle;
    heading?: string;
    children: any;
}

export class Box extends React.Component<BoxProps, {}> {
    render() {
        return <div className={'box ' + (this.props.style || '')}>
            {this.props.heading ? <h2 className="box-heading">{this.props.heading}</h2> : ''}
            {this.props.children}
        </div>;
    }
}