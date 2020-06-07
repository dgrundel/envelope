import * as React from "react";
import { Box } from "./Box";
import { Header } from "./Header";

import '@public/components/App.scss';
import { Import } from "./Import";
import { Modal, ModalProps } from "./Modal";
import { AccountList } from "./AccountList";

export interface AppProps {
}

export interface AppState {
    modal?: any;
}

export class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);

        this.dismissModal = this.dismissModal.bind(this);

        this.state = {
            modal: <Modal heading="Test modal" 
                buttons={{ 'Close': this.dismissModal }}
                close={this.dismissModal}>Hello, modal.</Modal>
        };
    }

    render() {
        return <div id="app">
            <Header/>
            <div id="sidebar"></div>
            <div id="main">
                <Box>
                    <h1>Hello, world!</h1>
                </Box>
                <Import/>
                <AccountList/>
                {this.state.modal || ''}
            </div>
        </div>;
    }

    dismissModal() {
        this.setState({ modal: undefined });
    }
}