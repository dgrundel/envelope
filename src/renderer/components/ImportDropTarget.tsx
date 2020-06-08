import * as React from "react";
import * as csv from 'neat-csv';
import { DropTarget } from "./DropTarget";

import '@public/components/ImportDropTarget.scss';
import { resolve } from "dns";
import { rejects } from "assert";
import { Log } from "@/util/Logger";
import { Modal, ModalApi } from "./Modal";

export interface ImportProps {
    modalApi: ModalApi
}

export class ImportDropTarget extends React.Component<ImportProps, {}> {

    constructor(props: ImportProps) {
        super(props);

        this.dropHandler = this.dropHandler.bind(this);
    }

    render() {
        return <DropTarget handler={this.dropHandler}>
            <p className="import-drop-target-content">
                <i className="pe-7s-upload import-drop-target-icon"></i>
                Drop CSV files here to import transactions.
            </p>
        </DropTarget>;
    }

    dropHandler(result: Promise<DataTransferItemList>) {
        const modalApi = this.props.modalApi;

        // first filter out non-files
        // resolve with a list of files
        // reject if no files
        result.then(items => new Promise((resolve, reject) => {
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }
            files.length ? resolve(files) : reject('No files were found.');
        }))
        // next, get contents of all files as strings
        .then((files: File[]) => Promise.all(files.map(file => file.text())))
        // pass strings to CSV parser
        .then(fileContents => Promise.all(fileContents.map(text => csv(text))))
        // now each file is an array of CSV rows
        .then(csvFiles => {
            csvFiles.forEach(csvRows => {
                Log.info('csvRows', csvRows);

                const modal = <Modal buttons={{ 'Close': modalApi.dismissModal }} close={modalApi.dismissModal}>
                    {csvRows.map(row => <p>{Object.keys(row).map(key => `${key} = ${row[key]}`).join(', ')}</p>)}
                </Modal>;

                modalApi.queueModal(modal);
            });
        })
        // if we got an error along the way, handle it.
        .catch((reason) => {
            Log.error(reason);
        });
    }
}