import { Log } from "@/util/Logger";
import { FontIcon } from '@fluentui/react';
import '@public/components/import/ImportDropTarget.scss';
import * as csv from 'neat-csv';
import * as React from "react";
import { FileDropTarget } from "../../uiElements/FileDropTarget";
import { connect } from 'react-redux';
import { setModal } from '@/renderer/store/actions/AppState';
import { Modal } from '@/renderer/store/reducers/AppState';
import { createImportWizard } from './ImportWizardFactory';

export interface ImportProps {
    // store actions
    setModal?: (modal: Modal) => void;
}

class Component extends React.Component<ImportProps, {}> {

    constructor(props: ImportProps) {
        super(props);

        this.dropHandler = this.dropHandler.bind(this);
    }

    render() {
        return <FileDropTarget handler={this.dropHandler}>
            <p className="import-drop-target-content">
                <FontIcon iconName="BulkUpload" className="import-drop-target-icon" />
                Drop CSV files here to import transactions.
            </p>
        </FileDropTarget>;
    }

    dropHandler(result: Promise<DataTransferItemList>) {
        const setModal = this.props.setModal!;

        // first filter out non-files
        // resolve with a list of files
        // reject if no files
        result.then(items => new Promise((resolve, reject) => {
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    if (file) {
                        resolve(file);
                        return;
                    }
                }
            }

            reject('No files were found.');
        }))
        // next, get contents of file as string
        .then((file: File) => file.text())
        // pass string to CSV parser
        .then(text => csv(text))
        // now each file is an array of CSV rows
        .then((csvRows: csv.Row[]) => {
            Log.debug('csvRows', csvRows);
            const Component = createImportWizard(csvRows);
            setModal(<Component/>);
        })
        // if we got an error along the way, handle it.
        .catch((reason) => {
            Log.error(reason);
        });
    }
}

export const ImportDropTarget = connect(null, { setModal, })(Component);