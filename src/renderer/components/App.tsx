import * as React from "react";
import { Box } from "./Box";
import { Header } from "./Header";

import '@public/components/app.scss';
import { Import } from "./Import";

export class App extends React.Component<{}, {}> {
    render() {
        return <div id="app">
            <Header/>
            <div id="sidebar"></div>
            <div id="main">
                <Box>
                    <h1>Hello, world!</h1>
                </Box>
                <Import/>
            </div>
        </div>;
    }
}