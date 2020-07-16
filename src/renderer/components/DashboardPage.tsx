import { Currency } from '@/models/Currency';
import { filterOnlyBankAccounts, filterOnlyEnvelopeAccounts } from '@/util/Filters';
import { Account } from '@models/Account';
import distinctColors from 'distinct-colors';
import * as React from "react";
import { connect } from 'react-redux';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, TooltipFormatter, TooltipPayload, XAxis, YAxis } from 'recharts';
import { CombinedState } from '../store/store';
import { Card } from './uiElements/Card';
import { Layout } from './uiElements/Layout';
import { Colors } from './uiElements/styleValues';
import * as ReactMarkdown from 'react-markdown';

export interface DashboardPageProps {
    envelopes?: Account[];
    bankAccounts?: Account[];
}

// https://medialab.github.io/iwanthue/
const baseColorSettings = {
    hueMin: 0,
    hueMax: 300,
    chromaMin: 35,
    chromaMax: 100,
    lightMin: 75,
    lightMax: 100,
};

const tooltipFormatter: TooltipFormatter = (_value, _name, entry: TooltipPayload) => entry.payload.tooltip;

const renderEnvelopeBalanceChart = (envelopes: Account[]) => {
    // unallocated account will always be present
    if (envelopes.length <= 1) {
        return null;
    }
    
    const envelopeData = envelopes.map(e => ({
        name: e.name,
        value: e.balance.toPrecisionInt(),
        tooltip: e.balance.toFormattedString(),
    }));

    const envelopeColors = distinctColors({
        ...baseColorSettings,
        count: envelopeData.length,
    }).map(color => color.hex());

    return <Card heading="Envelope Balances">
        <ResponsiveContainer height={350}>
            <PieChart>
                <Pie dataKey="value" data={envelopeData} label={props => props.name}>
                    {envelopeData.map((_entry, index) => <Cell key={index} fill={envelopeColors[index % envelopeColors.length]}/>)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
            </PieChart>
        </ResponsiveContainer>
    </Card>;
};

const renderBankAccountBalanceChart = (bankAccounts: Account[]) => {
    if (bankAccounts.length === 0) {
        return null;
    }

    const bankAccountData = bankAccounts.map(e => ({
        name: e.name,
        value: e.balance.toPrecisionInt(),
        tooltip: e.balance.toFormattedString(),
    }));

    return <Card heading="Account Balances">
        <ResponsiveContainer height={350}>
            <BarChart data={bankAccountData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis tickFormatter={(n: number) => Currency.fromPrecisionInt(n).toFormattedString()} />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                <ReferenceLine y={0} stroke='#000'/>
                <Bar dataKey="value" fill="#82ca9d">
                    {bankAccountData.map((_entry, index) => <Cell key={index} fill={_entry.value < 0 ? Colors.Error : Colors.Success}/>)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </Card>;
};

const Component = (props: DashboardPageProps) => {
    const gettingStartedText = `
Welcome to Envelope! Here are a few steps to get you going:

- Click **Accounts** and add each of your bank and credit card accounts.
- Click **Envelopes** and create a few envelopes for your budget.
- Move some money from your **Available Funds Envelope** into your budget envelopes.
- **Drag and Drop** a CSV file exported from your bank's website to import bank and credit card transactions.
    `;
    
    return <>
        <Layout>
            <Card heading="Getting Started">
                <ReactMarkdown source={gettingStartedText}/>
            </Card>
        </Layout>

        <Layout split={2}>
            {renderEnvelopeBalanceChart(props.envelopes!)}
            {renderBankAccountBalanceChart(props.bankAccounts!)}
        </Layout>
    </>;
}

const mapStateToProps = (state: CombinedState, ownProps: DashboardPageProps): DashboardPageProps => {
    const allAccounts = Object.values(state.accounts.accounts);
    return {
        ...ownProps,
        envelopes: allAccounts.filter(filterOnlyEnvelopeAccounts),
        bankAccounts: allAccounts.filter(filterOnlyBankAccounts),
    };
}

export const DashboardPage = connect(mapStateToProps, {})(Component);