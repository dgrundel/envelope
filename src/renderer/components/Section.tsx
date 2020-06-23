import * as React from "react";

import '@public/components/Section.scss';

export interface SectionProps {
    heading?: string;
    children: any;
}

export class Section extends React.Component<SectionProps, {}> {
    render() {
        return <div className="section">
            {this.props.heading ? <h3 className="section-heading">{this.props.heading}</h3> : ''}
            {this.props.children}
        </div>;
    }
}