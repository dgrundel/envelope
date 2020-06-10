import * as React from "react";

import '@public/components/RowSelect.scss';

export interface RowSelectOptions {
    label: any;
    value: any;
}

export interface RowSelectProps {
    type: 'radio' | 'checkbox'
    options: RowSelectOptions[];
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: any;
    name?: string;
    className?: string;
}

export class RowSelect extends React.Component<RowSelectProps, {}> {

    render() {
        const name = this.props.name || 'row-select-input';
        const value = this.props.value;

        return <div className={`row-select ${this.props.className || ''}`}>
            {this.props.options.map(option => {
                const checked = Array.isArray(value) 
                    ? value.findIndex(v => v === option.value) !== -1 
                    : option.value === value;

                return <label key={option.value} className={`row-select-row ${checked ? 'row-select-selected-row' : ''}`}>
                    <span className="row-select-row-input"><input 
                        type={this.props.type}
                        name={name}
                        value={option.value}
                        checked={checked}
                        onChange={e => this.props.onChange(e)}/></span>
                    <span className="row-select-row-label">{option.label}</span>
                </label>
            })}
        </div>;
    }
}