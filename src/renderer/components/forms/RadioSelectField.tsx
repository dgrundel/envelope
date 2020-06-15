import * as React from "react";
import { FormFieldContainer, FormFieldContainerProps } from "./FormFieldContainer";

import '@public/components/forms/RadioSelectField.scss';

export interface RadioSelectFieldOption {
    value: string;
    label?: string;
}

export interface RadioSelectFieldProps extends FormFieldContainerProps {
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string;
    options: RadioSelectFieldOption[];
}

export class RadioSelectField extends React.Component<RadioSelectFieldProps, {}> {
    render() {
        return <FormFieldContainer
            {...this.props}
        >
            {this.props.options.map(option => <label 
                key={option.value}
                className="radio-select-field-label"
            >
                <input 
                    type="radio"
                    name={this.props.name}
                    value={option.value}
                    checked={this.props.value === option.value}
                    onChange={(e) => this.props.onChange(e)}
                />
                {option.label || option.value}
            </label>)}
        </FormFieldContainer>;
    }
}