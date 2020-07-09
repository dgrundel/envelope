import { DefaultButton, FontIcon } from '@fluentui/react';
import '@public/components/Modal.scss';
import * as React from "react";
import { Modal } from '@/renderer/store/reducers/AppState';

export interface ModalButton {
    buttonText: any;
    onClick: () => void;
    className?: string;
}

export interface ModalProps {
    heading?: string;
    children: any;
    closeButtonHandler?: () => void;
    buttons?: ModalButton[];
    // CSS class name for the modal
    className?: string;
    // CSS rules for the modal
    style?: React.CSSProperties;
}

export class BaseModal extends React.Component<ModalProps, {}> implements Modal {
    render() {
        return <div className="modal-overlay">
            <div className={`modal-content ${this.props.className || ''}`} style={this.props.style}>
                {this.renderHeading()}
                <div className="modal-body">
                    {this.props.children}
                </div>
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
                {closeButtonHandler ? <FontIcon iconName="Cancel" className="modal-close-icon" onClick={() => closeButtonHandler()} /> : ''}
            </h2>;
        }
    }

    renderFooter() {
        const buttons = this.props.buttons;
        if (buttons) {
            return <div className="modal-footer">
                {buttons.map(button => <DefaultButton key={button.buttonText} text={button.buttonText} onClick={() => button.onClick()} className={button.className} />)}
            </div>
        }
    }
}