import * as React from "react";

import '@public/components/import/ImportRowSelect.scss';
import { Row } from './ImportWizard';
import { RowSelect } from '../RowSelect';

export type ColumnFilter = (key: string, value: string) => boolean;
export type KeyFormatter = (key: string) => string;
export type ValueFormatter = (key: string, value: string) => string;

export interface ImportRowSelectProps {
    rows: Row[];
    name?: string;
    type: 'radio' | 'checkbox'
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    columnFilter?: ColumnFilter;
    keyFormatter?: KeyFormatter;
    valueFormatter?: ValueFormatter;
    value?: any;
    keyHeading?: string;
    valueHeading?: string;
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
        const row = this.props.rows[this.state.index];
        const fields = this.props.columnFilter
            ? Object.keys(row).filter(k => (this.props.columnFilter as ColumnFilter)(k, row[k]))
            : Object.keys(row);
        const value = this.props.value;

        return <RowSelect
            type={this.props.type}
            options={fields.map(key => ({
                value: key,
                label: <div className="import-row-select-row-label">
                    <span>{this.props.keyFormatter ? this.props.keyFormatter(key) : key}</span>
                    <span>{this.props.valueFormatter ? this.props.valueFormatter(key, row[key]) : row[key]}</span>
                </div>
            }))}
            onChange={e => this.props.onChange(e)}
            name={this.props.name}
            value={value}
            className="import-row-select"
        />;
    }

    renderHeading() {
        if (this.props.keyHeading || this.props.valueHeading) {
            return <div className="import-row-select-row import-row-select-heading">
                <span></span>
                <span>{this.props.keyHeading}</span>
                <span>{this.props.valueHeading}</span>
            </div>
        }

        return null;
    }
}