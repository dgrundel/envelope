import { Spinner, SpinnerSize, Text } from '@fluentui/react';
import * as React from "react";
import { Modal } from '../store/reducers/AppState';
import { BaseModal } from "./uiElements/Modal";

export interface SpinnerModalProps {
    text?: string;
}

export class SpinnerModal extends React.Component<SpinnerModalProps, {}> implements Modal {
    render() {
        return <BaseModal>
            <Spinner size={SpinnerSize.large} />
            <Text variant={'mediumPlus'} block>
                {this.props.text || 'Just a moment...'}
            </Text>
        </BaseModal>;
    }
}