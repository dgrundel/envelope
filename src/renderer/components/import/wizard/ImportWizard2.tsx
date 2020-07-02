import { WizardStepApi, createWizard } from "../../uiElements/Wiz";
import { AccountSelect } from './AccountSelect';
import { DateFieldSelect } from './DateFieldSelect';
import { Log } from '@/util/Logger';
import { AmountFieldSelect } from "./AmountFieldSelect";
import { DescriptionFieldSelect } from "./DescriptionFieldSelect";
import { InvertAmountsSelect } from "./InvertAmountsSelect";
import { ImportSummary } from "./ImportSummary";
import { Currency } from "@/util/Currency";
import { TransactionType } from "@/models/Transaction";

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

export const rowsToTransactions = (rows: Row[], invert: boolean, dateColumn: string, amountColumn: string, descriptionColumns: string[], accountId: string): TransactionData[] => {
    return rows.map(row => {
        const date = new Date(row[dateColumn];
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

    return createWizard(
        {
            title: `Importing ${rows.length} Transactions`,
            onFinish: (state: ImportWizardState) => {
                Log.debug('finish', state);
            },
            onCancel: (state: ImportWizardState) => {
                Log.debug('cancel', state);
            },
        },
        {
            rows,
            invertTransactions: false
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