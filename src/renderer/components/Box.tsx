import * as React from "react";

export interface BoxProps {
    children: any;
}

export class Box extends React.Component<BoxProps, {}> {
    render() {
        return <div className="box">
            {this.props.children}
        </div>;
    }
}