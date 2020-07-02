import { WizardStepApi, createWizard } from "../../uiElements/WizardFactory";
import { AccountSelect } from './AccountSelect';
import { DateFieldSelect } from './DateFieldSelect';
import { Log } from '@/util/Logger';
import { AmountFieldSelect } from "./AmountFieldSelect";
import { DescriptionFieldSelect } from "./DescriptionFieldSelect";
import { InvertAmountsSelect } from "./InvertAmountsSelect";
import { ImportSummary } from "./ImportSummary";
import { Currency } from "@/util/Currency";
import { TransactionType, TransactionData } from "@/models/Transaction";
import * as React from "react";
import { CombinedState } from "@/renderer/store/store";
import { connect } from "react-redux";
import { insertTransactions } from "@/renderer/store/actions/Transaction";
import { getAppContext } from "@/renderer/AppContext";
import { AppPage } from "../../App";


export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];

    accountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];
    invertTransactions: boolean;
}

export type ImportWizardStepProps = ImportWizardState & WizardStepApi<ImportWizardState>;

export const rowsToTransactions = (
    rows: Row[],
    invert: boolean,
    dateColumn: string,
    amountColumn: string,
    descriptionColumns: string[],
    accountId: string
): TransactionData[] => {

    return rows.map(row => {
        const date = new Date(row[dateColumn]);
        const currency = Currency.parse(row[amountColumn]);
        const amount = invert ? currency.getInverse() : currency;
        const description = descriptionColumns
            .map(col => row[col])
            .join(' ');

        return {
            type: TransactionType.Imported,
            accountId,
            date,
            amount,
            description,
            originalRecord: row,
            linkedTransactionIds: []
        };
    });
};

export const createImportWizard = (rows: Row[]) => {

    if (rows.length === 0) {
        throw new Error('Rows cannot be empty.');
    }

    interface Props {
        insertTransactions?: (transactionData: TransactionData[]) => Promise<void>;
    }

    class Component extends React.Component<Props> {
        InnerComponent: () => JSX.Element;
        
        constructor(props: Props) {
            super(props);

            this.InnerComponent = createWizard(
                {
                    title: `Importing ${rows.length} Transactions`,
                    onFinish: this.onFinish.bind(this),
                },
                {
                    rows,
                    invertTransactions: false,
                },
                [
                    AccountSelect,
                    DateFieldSelect,
                    AmountFieldSelect,
                    DescriptionFieldSelect,
                    InvertAmountsSelect,
                    ImportSummary,
                ]
            );
        }

        onFinish(state: ImportWizardState) {
            Log.debug('Import Wizard Finish', state);

            const rowsAsTransactions = rowsToTransactions(
                state.rows, 
                state.invertTransactions, 
                state.dateColumn!,
                state.amountColumn!,
                state.descriptionColumns!,
                state.accountId!,
            );

            this.props.insertTransactions!(rowsAsTransactions).then(() => {
                const appContext = getAppContext();
                // dismiss import modal
                appContext.modalApi.dismissModal();
                appContext.pageApi.setPage(AppPage.Transactions);
            });
        }

        render() {
            return <this.InnerComponent/>;
        }
    }

    return connect(null, { insertTransactions })(Component);
}