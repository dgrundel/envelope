import * as React from "react";
import '@public/components/DataTable.scss';

export type ValueFormatter<T> = (value: any, row: T) => string;

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
    selectedRows: T[];
}

export class DataTable<T> extends React.Component<DataTableProps<T>, DataTableState<T>> {

    constructor(props: DataTableProps<T>) {
        super(props);

        this.state = {
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
                        {field.label || field.name}
                    </th>)}
                </tr>
            </thead>
            <tbody>
                {this.props.rows.map(row => {
                    const rowMap = (row as any);
                    const key = rowMap[keyField];
                    const isSelected = enableSelect && this.state.selectedRows.findIndex((r: any) => r[keyField] === key) !== -1;

                    return <tr key={key} className={`data-table-row ${isSelected ? 'data-table-row-selected' : ''}`}>
                        {enableSelect ? <td><input 
                            type="checkbox" 
                            checked={isSelected} 
                            onClick={(e) => enableSelect && this.toggleSelect(e, row)}
                        /></td> : null}
                        {this.props.fields.map(field => <td key={field.name} onClick={(e) => enableSelect && this.toggleSelect(e, row)}>
                            {field.formatter ? field.formatter(rowMap[field.name], row) : rowMap[field.name]}
                        </td>)}
                    </tr>
                })}
            </tbody>
        </table>;
    }

    toggleSelect(e: React.MouseEvent, row: T) {
        const rowMap = (row as any);
        const keyField = this.props.keyField;
        const index = this.state.selectedRows.findIndex((r: any) => r[keyField] === rowMap[keyField]);
        
        let newSelection: T[];
        if (index === -1) {
            newSelection = this.state.selectedRows.concat(row);
        } else {
            newSelection = this.state.selectedRows.slice();
            newSelection.splice(index, 1);
        }

        if (this.props.onSelect) {
            this.props.onSelect(newSelection);
        }

        this.setState({
            selectedRows: newSelection
        });
    }
}