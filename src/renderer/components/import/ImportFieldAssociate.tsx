import * as React from "react";
import { Modal, BaseModal, ModalApi, ButtonSets } from "../Modal";

export interface Row {
    [header: string]: string;
}

export interface ImportFieldAssociateProps {
    modalApi: ModalApi
    rows: Row[]
}

export interface ImportFieldAssociateState {

}

export class ImportFieldAssociate extends React.Component<ImportFieldAssociateProps, ImportFieldAssociateState> implements Modal {
    render() {
        return <BaseModal buttons={ButtonSets.close(this.props.modalApi)}>
            Rows: {this.props.rows.length}
        </BaseModal>;
    }
}