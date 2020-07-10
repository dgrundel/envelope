import { filterOnlyEnvelopeAccounts, filterOnlyBankAccounts } from '@/util/Filters';
import * as React from "react";
import { connect } from 'react-redux';
import { CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, TooltipFormatter, TooltipPayload, Cell, BarChart, YAxis, Legend, ReferenceLine, Bar } from 'recharts';
import { CombinedState } from '../store/store';
import { Card } from './uiElements/Card';
import { Layout } from './uiElements/Layout';
import { Account } from '@models/Account';
import { Log } from '@/util/Logger';
import { Colors } from './uiElements/styleValues';
import { Currency } from '@/util/Currency';
import distinctColors from 'distinct-colors'

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

const graphColors = '#E2C36E,#C8C16C,#AFBD6E,#98B974,#83B37B,#71AC82,#64A489,#5C9B8E,#5B9191,#5E8790,#647D8C,#6B7285,#70677C,#745D70,#755363,#734B55,#6E4347,#663D3A,#5D382F'.split(',');
const tooltipFormatter: TooltipFormatter = (_value, _name, entry: TooltipPayload) => entry.payload.tooltip;

const Component = (props: DashboardPageProps) => {
    const envelopeData = props.envelopes!.map(e => ({
        name: e.name,
        value: e.balance.toPrecisionInt(),
        tooltip: e.balance.toFormattedString(),
    }));

    const envelopeColors = distinctColors({
        ...baseColorSettings,
        count: envelopeData.length,
    }).map(color => color.hex());

    const bankAccountData = props.bankAccounts!.map(e => ({
        name: e.name,
        value: e.balance.toPrecisionInt(),
        tooltip: e.balance.toFormattedString(),
    }));
    
    return <>
        <Layout>
            <Card heading="Getting Started">
                <p>Welcome to Envelope! Here are a few steps to get you going:</p>

                <ol>
                    <li>Click <strong>Accounts</strong> and add each of your bank and credit card accounts.</li>
                    <li>Click <strong>Envelopes</strong> and create a few envelopes for your budget.</li>
                    <li>Move some money from your <strong>Available Funds Envelope</strong> into your budget envelopes.</li>
                    <li><strong>Drag and Drop</strong> a CSV file exported from your bank's website to import bank and credit card transactions.</li>
                </ol>
            </Card>
        </Layout>

        <Layout split={2}>
            <Card heading="Envelope Balances">
                <ResponsiveContainer height={350}>
                    <PieChart>
                        <Pie dataKey="value" data={envelopeData} label={props => props.name}>
                            {envelopeData.map((_entry, index) => <Cell key={index} fill={envelopeColors[index % envelopeColors.length]}/>)}
                        </Pie>
                        <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            
            <Card heading="Account Balances">
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
            </Card>
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