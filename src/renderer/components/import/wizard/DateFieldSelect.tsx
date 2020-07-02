import { DetailsList, DetailsListLayoutMode, IColumn, IObjectWithKey, mergeStyles, Selection, SelectionMode } from '@fluentui/react';
import * as React from "react";
import { ImportWizardStepProps } from "./ImportWizard2";
import { isBlank } from '@/util/Filters';

const iconStyle = mergeStyles({
    verticalAlign: 'middle',
    fontSize: '1.4em',
});

const columns: IColumn[] = [
    { key: 'column1', name: 'Field Name', fieldName: 'name', minWidth: 100, },
    { key: 'column2', name: 'Sample Value', fieldName: 'sample', minWidth: 100, },
];

class Component extends React.Component<ImportWizardStepProps> {
    items: IObjectWithKey[];
    selection: Selection<IObjectWithKey>;
    
    constructor(props: ImportWizardStepProps) {
        super(props);

        props.setStepValidator(this.validateState);

        const rows = this.props.rows;
        const first = rows[0];
        const fieldNames = Object.keys(first);

        this.items = fieldNames.map(fieldName => ({
            key: fieldName,
            name: fieldName,
            sample: first[fieldName],
        }));

        this.selection = new Selection({
            items: this.items,
            onSelectionChanged: () => {
                const items = this.selection.getSelection();
                const key = items[0]?.key?.toString();
                this.props.setState({
                    dateColumn: key
                });
            },
        });

        if (this.props.dateColumn) {
            this.selection.setKeySelected(this.props.dateColumn, true, false);
        }
    }

    validateState(state: ImportWizardStepProps) {
        if (isBlank(state.dateColumn)) {
            return 'Please select a field.';
        }
    }
    
    render() {
        return <div>
            <h3>Which one of these contains the <strong>date</strong> of the transaction?</h3>

            <DetailsList
                items={this.items}
                columns={columns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.single}
                selection={this.selection}
            />
        </div>;
    }
}

export const DateFieldSelect = Component;