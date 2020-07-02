import { DetailsList, DetailsListLayoutMode, IColumn, IObjectWithKey, mergeStyles, Selection, SelectionMode } from '@fluentui/react';
import * as React from "react";
import { ImportWizardStepProps } from "./ImportWizard2";
import { isNotBlank } from '@/util/Filters';

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

        this.props.setStepValidator(this.validateState);

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
                const descriptionColumns = items.map(item => item.key)
                    .filter(isNotBlank);
                
                this.props.setState({
                    descriptionColumns
                });
            },
        });

        if (this.props.descriptionColumns) {
            this.props.descriptionColumns.forEach(key => {
                this.selection.setKeySelected(key, true, false);
            });
        }
    }

    validateState(state: ImportWizardStepProps) {
        const selected = state.descriptionColumns || [];
        if (selected.length === 0) {
            return 'Please select at least one field.';
        }
    }
    
    render() {
        return <div>
            <h3>Select any items that should be included in the <strong>description</strong> of the transaction.</h3>

            <DetailsList
                items={this.items}
                columns={columns}
                layoutMode={DetailsListLayoutMode.justified}
                selectionMode={SelectionMode.multiple}
                selection={this.selection}
            />
        </div>;
    }
}

export const DescriptionFieldSelect = Component;