import * as React from "react";

import '@public/components/Modal.scss';

export interface Modal {
    // marker interface
}

export interface ModalProps {
    heading?: string;
    children: any;
    close?: () => void;
    buttons?: Record<string, () => void>;
}

export interface ModalApi {
    queueModal: (modal: Modal) => void;
    dismissModal: () => void;
}

export class BaseModal extends React.Component<ModalProps, {}> implements Modal {
    render() {
        return <div className="modal-overlay">
            <div className="modal-content">
                {this.renderHeading()}
                {this.props.children}
                {this.renderFooter()}
            </div>
        </div>;
    }

    renderHeading() {
        const heading = this.props.heading;
        const close = this.props.close;

        if (heading || close) {
            return <h2 className="modal-heading">
                {heading || ''}
                {close ? <i className="pe-7s-close modal-close-icon" onClick={() => close()}></i> : ''}
            </h2>;
        }
    }

    renderFooter() {
        const buttons = this.props.buttons;

        if (buttons) {
            return <div className="modal-footer">
                {Object.keys(buttons).map(text => <div key={text} className="btn" onClick={() => buttons[text]()}>
                    {text}
                </div>)}
            </div>
        }
    }
}