import * as React from "react";

import { Modal, BaseModal } from "./uiElements/Modal";
import { Spinner, SpinnerSize, Text } from '@fluentui/react';

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