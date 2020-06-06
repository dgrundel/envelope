import * as React from "react";

import '@public/components/Box.scss';

export interface BoxProps {
    heading?: string;
    children: any;
}

export class Box extends React.Component<BoxProps, {}> {
    render() {
        return <div className="box">
            {this.props.heading ? <h2 className="box-heading">{this.props.heading}</h2> : ''}
            {this.props.children}
        </div>;
    }
}