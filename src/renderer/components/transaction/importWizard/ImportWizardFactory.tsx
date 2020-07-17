import { Account } from "@/models/Account";
import { Currency } from "@/models/Currency";
import { getAmountTransactionFlag, Transaction } from "@/models/Transaction";
import { adjustAccountBalance } from '@/renderer/store/actions/Account';
import { dismissModal, setPage } from '@/renderer/store/actions/AppState';
import { addManyTransactions } from "@/renderer/store/actions/Transaction";
import { AppPage } from '@/renderer/store/reducers/AppState';
import { CombinedState } from "@/renderer/store/store";
import { getIdentifier } from '@/util/Identifier';
import { Log } from '@/util/Logger';
import * as React from "react";
import { connect } from "react-redux";
import { AccountSelect } from './steps/AccountSelect';
import { AmountFieldSelect } from "./steps/AmountFieldSelect";
import { DateFieldSelect } from './steps/DateFieldSelect';
import { DescriptionFieldSelect } from "./steps/DescriptionFieldSelect";
import { DuplicatesSelect } from './steps/DuplicatesSelect';
import { InvertAmountsSelect } from "./steps/InvertAmountsSelect";
import { ReconcileBalance } from './steps/ReconcileBalance';
import { WizardStepApi, createWizard } from '../../uiElements/WizardFactory';


export interface Row {
    [header: string]: string;
}

export interface ImportWizardState {
    rows: Row[];
    invertTransactions: boolean;
    
    selectedForImport?: number[]; // indexes of the rows that will be imported
    accountId?: string;
    dateColumn?: string;
    amountColumn?: string;
    descriptionColumns?: string[];
    updatedBalance?: string;
}

export type ImportWizardStepProps = ImportWizardState & WizardStepApi<ImportWizardState>;

export const rowToTransaction = (
    row: Row,
    invert: boolean,
    dateColumn: string,
    amountColumn: string,
    descriptionColumns: string[],
    account: Account
): Transaction => {
    const currency = Currency.parse(row[amountColumn]);
    const amount = invert ? currency.getInverse() : currency;
    const flags = getAmountTransactionFlag(account, amount);
    
    const accountId = account._id;
    const date = new Date(row[dateColumn]);
    const description = descriptionColumns
        .map(col => row[col])
        .join(' ');

    return {
        _id: getIdentifier(),
        accountId,
        date,
        amount,
        description,
        importData: row,
        linkedTransactionIds: [],
        flags
    };
};

export const rowsToTransactions = (
    rows: Row[],
    invert: boolean,
    dateColumn: string,
    amountColumn: string,
    descriptionColumns: string[],
    account: Account
): Transaction[] => {
    return rows.map(row => rowToTransaction(row, invert, dateColumn, amountColumn, descriptionColumns, account));
};

export const createImportWizard = (rows: Row[]) => {

    if (rows.length === 0) {
        throw new Error('Rows cannot be empty.');
    }

    // look for some columns we can "suggest"
    const columnNames = Object.keys(rows[0]);
    
    // dateColumn: string,
    const dateColumn = columnNames.find(name => name.toLowerCase().includes('date'));
    // amountColumn: string,
    const amountColumn = columnNames.find(name => name.toLowerCase().includes('amount'));
    // descriptionColumns: string[],
    const descriptionColumns = columnNames.filter(name => name.toLowerCase().includes('description'));

    interface Props {
        // mapped from store
        accounts?: Record<string, Account>;

        // store actions
        addManyTransactions?: (transaction: Transaction[]) => void;
        adjustAccountBalance?: (accountId: string, newBalance: Currency) => void;
        setPage?: (page: AppPage) => void;
        dismissModal?: () => void;
    }

    class Component extends React.Component<Props> {
        InnerComponent: any;
        
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
                    dateColumn,
                    amountColumn,
                    descriptionColumns,
                },
                [
                    AccountSelect,
                    DateFieldSelect,
                    AmountFieldSelect,
                    DescriptionFieldSelect,
                    InvertAmountsSelect,
                    DuplicatesSelect,
                    ReconcileBalance,
                ]
            );
        }

        onFinish(state: ImportWizardState) {
            Log.debug('Import Wizard Finish', state);

            const selectedAccount = this.props.accounts![state.accountId!];

            const rowsToImport = state.selectedForImport
                ? state.selectedForImport.map(i => state.rows[i])
                : state.rows;

            const rowsAsTransactions = rowsToTransactions(
                rowsToImport, 
                state.invertTransactions, 
                state.dateColumn!,
                state.amountColumn!,
                state.descriptionColumns!,
                selectedAccount,
            );

            this.props.addManyTransactions!(rowsAsTransactions);
            
            const newBalance = Currency.parse(state.updatedBalance!);
            if (newBalance.isValid()) {
                this.props.adjustAccountBalance!(state.accountId!, newBalance!);
            }

            // dismiss import modal
            this.props.dismissModal!();
            this.props.setPage!(AppPage.Transactions);
        }

        render() {
            return <this.InnerComponent/>;
        }
    }

    const mapStateToProps = (state: CombinedState, ownProps: Props): Props => {
        return {
            ...ownProps,
            accounts: state.accounts.accounts,
        };
    }

    const storeActions = {
        addManyTransactions,
        adjustAccountBalance,
        setPage,
        dismissModal,
    };
    
    return connect(mapStateToProps, storeActions)(Component);
}