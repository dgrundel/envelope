import * as React from "react";

import '@public/components/Modal.scss';

export interface Modal {
    // marker interface
}

export interface ModalProps {
    heading?: string;
    children: any;
    closeButtonHandler?: () => void;
    buttons?: Record<string, () => void>;
}

export interface ModalApi {
    queueModal: (modal: Modal) => void;
    dismissModal: () => void;
}

export const ButtonSets = {
    ok: (api: ModalApi, callback?: () => void) => ({
        'OK': () => {
            callback && callback();
            api.dismissModal();
        }
    }),
    close: (api: ModalApi, callback?: () => void) => ({
        'Close': () => {
            callback && callback();
            api.dismissModal();
        }
    }),
    okCancel: (api: ModalApi, okCallback?: () => void, cancelCallback?: () => void) => ({
        'OK': () => {
            okCallback && okCallback();
            api.dismissModal();
        },
        'Cancel': () => {
            cancelCallback && cancelCallback();
            api.dismissModal();
        }
    })
};

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
        const closeButtonHandler = this.props.closeButtonHandler;

        if (heading || closeButtonHandler) {
            return <h2 className="modal-heading">
                {heading || ''}
                {closeButtonHandler ? <i className="pe-7s-close modal-close-icon" onClick={() => closeButtonHandler()}></i> : ''}
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