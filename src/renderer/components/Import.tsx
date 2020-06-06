import * as React from "react";
import * as stream from 'stream';
import * as csv from 'neat-csv';
import { Box } from "./Box";

export interface ImportProps {
}

export interface ImportState {
    rows?: any[]
}

export class Import extends React.Component<ImportProps, ImportState> {

    constructor(props: ImportProps) {
        super(props);

        this.state = {};

        this.drop = this.drop.bind(this);
    }

    render() {
        return <Box heading="Import">
            <div className="drop-target" 
                onDragEnter={e => this.dragEnter(e)}
                onDragOver={e => this.dragOver(e)}
                onDrop={e => this.drop(e)}>
                Let's do this!
            </div>

            {this.renderRows()}
        </Box>
    }

    renderRows() {
        console.log('render rows', this.state);
        if (this.state.rows && this.state.rows.length > 0) {
            const first = this.state.rows[0];
            return <table>
                <thead>
                    <tr>
                        {Object.keys(first).map(key => <td>{key}</td>)}
                    </tr>
                </thead>
                <tbody>
                    {this.state.rows.map(row => <tr>
                        {Object.keys(row).map(key => <td title={key}>{row[key]}</td>)}
                    </tr>)}
                </tbody>
            </table>;
        }
    }

    dragOver(e: React.DragEvent) {
        e.stopPropagation();
        e.preventDefault();
        console.log('drag over');
    }

    dragEnter(e: React.DragEvent) {
        e.stopPropagation();
        e.preventDefault();
        console.log('drag enter');
    }

    drop(e: React.DragEvent) {
        e.stopPropagation();
        e.preventDefault();
        console.log('dropped', e);

        const setState = this.setState.bind(this);

        var dt = e.dataTransfer;
        var files = dt && dt.files || [];
        var length = files.length;
        for (var i = 0; i < length; i++) {
            const reader = new FileReader();
            const file = files[i];
            reader.onload = () => {
                const result = reader.result as string;
                if (result) {
                    csv(result).then(rows => {
                        console.log(rows);
                        setState({
                            rows
                        });
                    });
                }
            };
            reader.readAsText(file);
        }
    }
}