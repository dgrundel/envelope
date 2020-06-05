import * as React from "react";
import { Box } from "./Box";

export class Header extends React.Component<{}, {}> {
    render() {
        return <div id="header">
            <h1>Envelope</h1>
        </div>;
    }
}