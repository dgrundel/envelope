import { Transaction } from "@/models/Transaction";
import { Separator } from "@fluentui/react";
import * as React from "react";
import { TransactionCard } from "../TransactionCard";

export interface LinkWizardStepFrameProps {
    transaction: Transaction;
    children: any;
}

class Component extends React.Component<LinkWizardStepFrameProps> {
    render() {
        return <>
            <TransactionCard transaction={this.props.transaction}/>
            <Separator/>
            {this.props.children}
        </>;
    }
}

export const LinkWizardStepFrame = Component;