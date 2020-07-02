import { DetailsList, DetailsListLayoutMode, IColumn, IObjectWithKey, mergeStyles, Selection, SelectionMode } from '@fluentui/react';
import * as React from "react";
import { ImportWizardStepProps } from "../ImportWizardFactory";
import { isBlank } from '@/util/Filters';
import { Log } from '@/util/Logger';

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
        
        this.items = Object.keys(first)
            .filter(fieldName => {
                const value = first[fieldName];
                return !isNaN(Date.parse(value));
            })
            .map(fieldName => ({
                key: fieldName,
                name: fieldName,
                sample: first[fieldName],
            }));

        if (this.items.length === 0) {
            Log.error('No columns with usable date values.');
        // } else if (this.items.length === 1) {
            // Log.debug('Only one column with a usable date value. Skipping step.');
            // props.setState({
                // dateColumn: this.items[0].key as string
            // });
            // props.nextStep();
        }

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
            return 'Please select the field that contains the transaction date.';
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