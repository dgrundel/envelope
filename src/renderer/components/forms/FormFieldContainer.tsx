import * as React from "react";

import '@public/components/forms/FormFieldContainer.scss';

export enum FormFieldLayout {
    Horizontal = 'form-field-container-layout-horizontal',
    Vertical = 'form-field-container-layout-vertical',
}

export interface FormFieldContainerProps {
    label: string;
    layout?: FormFieldLayout;
    hint?: string;
    error?: any;
    children?: any;
}

export class FormFieldContainer extends React.Component<FormFieldContainerProps, {}> {
    render() {
        return <label className={`form-field-container ${this.props.layout ? this.props.layout : FormFieldLayout.Horizontal}`}>
            <span className="form-field-container-label">
                {this.props.label}
            </span>
            {this.props.hint && <span className="form-field-container-hint">{this.props.hint}</span>}
            <span className="form-field-container-input">
                {this.props.children}
            </span>
            {this.props.error && <span className="form-field-container-error">{this.props.error}</span>}
        </label>;
    }
}