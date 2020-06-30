import * as React from "react";

import { Modal, BaseModal } from "./uiElements/Modal";

export interface SpinnerModalProps {
    text?: string;
}

export class SpinnerModal extends React.Component<SpinnerModalProps, {}> implements Modal {
    render() {
        return <BaseModal>
            <p>{this.props.text || 'Just a moment...'}</p>
        </BaseModal>;
    }
}