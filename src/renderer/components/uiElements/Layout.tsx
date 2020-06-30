import * as React from "react";

import '@public/components/Layout.scss';

export interface LayoutProps {
    cols?: number;
    children: any;
}

export class Layout extends React.Component<LayoutProps, {}> {
    render() {
        const cols = this.props.cols || 1;
        const style: React.CSSProperties = {
            gridTemplateColumns: new Array(cols + 1).join(' 1fr')
        };

        return <div className="layout-component" style={style}>
            {this.props.children}
        </div>;
    }
}