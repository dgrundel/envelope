import * as React from "react";
import * as csv from 'neat-csv';
import { Box } from "./Box";
import { DropTarget } from "./DropTarget";

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
        return <Box heading="Import">
            <DropTarget handler={this.dtHandler}/>

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

    dtHandler(dt: DataTransfer) {
        const setState = this.setState.bind(this);

        console.log(dt);

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