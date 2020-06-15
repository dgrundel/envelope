import * as React from "react";
import { FormFieldContainer, FormFieldContainerProps } from "./FormFieldContainer";


export interface TextFieldProps extends FormFieldContainerProps {
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    value?: string;
}

export class TextField extends React.Component<TextFieldProps, {}> {
    render() {
        return <FormFieldContainer
            {...this.props}
        >
            <input 
                name={this.props.name}
                type={this.props.type || 'text'}
                value={this.props.value}
                onChange={(e) => this.props.onChange(e)}
            />
        </FormFieldContainer>;
    }
}