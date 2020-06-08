import * as React from "react";
import * as csv from 'neat-csv';
import { DropTarget } from "./DropTarget";

import '@public/components/Import.scss';
import { resolve } from "dns";
import { rejects } from "assert";
import { Log } from "@/util/Logger";

export interface ImportProps {
}

export interface ImportState {
    rows?: any[]
}

export class Import extends React.Component<ImportProps, ImportState> {

    constructor(props: ImportProps) {
        super(props);

        this.state = {};

        this.dtHandler = this.dtHandler.bind(this);
    }

    render() {
        return <DropTarget handler={this.dtHandler}>
            <p className="import-drop-target-content">
                <i className="pe-7s-upload import-drop-target-icon"></i>
                Drop CSV files here to import transactions.
            </p>
        </DropTarget>;
    }

    dtHandler(result: Promise<DataTransferItemList>) {
        const setState = this.setState.bind(this);

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
            });
        })
        // if we got an error along the way, handle it.
        .catch((reason) => {
            Log.error(reason);
            // failed.
        });
    }
}