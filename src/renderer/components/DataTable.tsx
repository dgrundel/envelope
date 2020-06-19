import * as React from "react";
import '@public/components/DataTable.scss';

export type ValueFormatter<T> = (value: any, row: T) => any;

export interface DataTableField<T> {
    name: string;
    label?: any;
    formatter?: ValueFormatter<T>;
}

export interface DataTableProps<T> {
    rows: T[];
    fields: DataTableField<T>[];
    keyField: string;
    onSelect?: (selectedRows: any[]) => void;
}

export interface DataTableState<T> {
    id: string;
    selectedRows: T[];
}

export class DataTable<T> extends React.Component<DataTableProps<T>, DataTableState<T>> {
    
    constructor(props: DataTableProps<T>) {
        super(props);

        this.state = {
            id: DataTable.generateId(),
            selectedRows: []
        };
    }

    render() {
        const keyField = this.props.keyField;
        const enableSelect = !!this.props.onSelect;

        return <table className={`data-table ${enableSelect ? 'data-table-select-enabled' : ''}`}>
            <thead>
                <tr>
                    {enableSelect ? <td></td> : null}
                    {this.props.fields.map(field => <th key={field.name}>
                        {typeof field.label === 'undefined' ? field.name : field.label}
                    </th>)}
                </tr>
            </thead>
            <tbody>
                {this.props.rows.map(row => {
                    const rowMap = (row as any);
                    const key = rowMap[keyField];
                    const inputId = `${this.state.id}-${key}`;
                    const isSelected = enableSelect && this.state.selectedRows.findIndex((r: any) => r[keyField] === key) !== -1;

                    return <tr key={key} className={`data-table-row ${isSelected ? 'data-table-row-selected' : ''}`}>
                        {enableSelect ? <td><label><input 
                            id={inputId}
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={(e) => enableSelect && this.toggleSelect(e, row)}
                        /></label></td> : null}
                        {this.props.fields.map(field => {
                            return <td key={field.name}><label htmlFor={inputId}>
                                {field.formatter 
                                    ? field.formatter(rowMap[field.name], row) 
                                    : rowMap[field.name]}
                            </label></td>
                        })}
                    </tr>
                })}
            </tbody>
        </table>;
    }

    toggleSelect(e: React.ChangeEvent<HTMLInputElement>, row: T) {
        const rowMap = (row as any);
        const keyField = this.props.keyField;
        const filteredSelection = this.state.selectedRows.filter((r: any) => r[keyField] !== rowMap[keyField]);
        
        const newSelection = e.target.checked
            ? filteredSelection.concat(row)
            : filteredSelection;

        if (this.props.onSelect) {
            this.props.onSelect(newSelection);
        }

        this.setState({
            selectedRows: newSelection
        });
    }

    static generateId(): string {
        let id;
        let i = 0;
        do {
            const rand = Math.random().toString(36).replace(/\./g, '');
            id = `data-table-${i}-${rand}`;
            i++;
        } while (document.getElementById(id));
        
        return id;
    }
}