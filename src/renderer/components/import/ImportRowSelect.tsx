import * as React from "react";

import '@public/components/import/ImportRowSelect.scss';
import { Row } from './ImportWizard';

export type ColumnFilter = (key: string, value: string) => boolean;
export type ColumnFormatter = (value: string) => string;

export interface ImportRowSelectProps {
    rows: Row[];
    name?: string;
    type: 'radio' | 'checkbox'
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    columnFilter?: ColumnFilter;
    columnFormatter?: ColumnFormatter;
    value?: any;
}

export interface ImportRowSelectState {
    index: number;
}

export class ImportRowSelect extends React.Component<ImportRowSelectProps, ImportRowSelectState> {

    constructor(props: ImportRowSelectProps) {
        super(props);

        this.state = {
            index: 0
        };
    }

    render() {
        const name = this.props.name || 'import-row-select-input';
        const row = this.props.rows[this.state.index];
        const fields = this.props.columnFilter
            ? Object.keys(row).filter(k => (this.props.columnFilter as ColumnFilter)(k, row[k]))
            : Object.keys(row);
        // const value = typeof this.props.value !== 'undefined' ? this.props.value : fields[0];
        const value = this.props.value;

        return <div className="import-row-select">
            <div className={`import-row-select-rows ${this.props.columnFormatter ? 'import-row-select-rows-with-formatter' : ''}`}>
                {fields.map(key => {
                    return <label key={key} className={key === value ? 'import-row-select-selected-row' : ''}>
                        <span><input 
                            type={this.props.type}
                            name={name}
                            value={key}
                            checked={key === value}
                            onChange={e => this.props.onChange(e)}/></span>
                        <span>{key}</span>
                        <span>{row[key]}</span>
                        {this.props.columnFormatter ? <span>{this.props.columnFormatter(row[key])}</span> : null}
                    </label>
                })}
            </div>
        </div>;
    }
}