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
        if (this.state.rows && this.state.rows.length > 0) {
            const first = this.state.rows[0];
            return <table>
                <thead>
                    <tr>
                        {Object.keys(first).map(key => <td key={key}>{key}</td>)}
                    </tr>
                </thead>
                <tbody>
                    {this.state.rows.map(row => <tr>
                        {Object.keys(row).map(key => <td title={key} key={key}>{row[key]}</td>)}
                    </tr>)}
                </tbody>
            </table>;
        }
    }

    dtHandler(items: DataTransferItemList) {
        const setState = this.setState.bind(this);

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                file && file.text().then((result: string) => {
                    csv(result).then(rows => {
                        console.log(rows);
                        setState({
                            rows
                        });
                    });
                });
            }
        }
    }
}