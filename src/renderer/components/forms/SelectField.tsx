import * as React from "react";
import { FormFieldContainer, FormFieldContainerProps } from "./FormFieldContainer";


export interface SelectFieldOption {
    value: string;
    label?: string;
}

export interface SelectFieldProps extends FormFieldContainerProps {
    name: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    value?: string;
    options: SelectFieldOption[];
}

export class SelectField extends React.Component<SelectFieldProps, {}> {
    render() {
        return <FormFieldContainer
            {...this.props}
        >
            <select 
                name={this.props.name}
                value={this.props.value}
                onChange={(e) => this.props.onChange(e)}
            >
                <option key="">{/* Default, empty option */}</option>

                {this.props.options.map(option => <option
                    key={option.value}
                    value={option.value}
                >
                    {option.label || option.value}
                </option>)}
            </select>
        </FormFieldContainer>;
    }
}