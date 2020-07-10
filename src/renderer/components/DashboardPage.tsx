import { filterOnlyEnvelopeAccounts } from '@/util/Filters';
import * as React from "react";
import { connect } from 'react-redux';
import { CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, TooltipFormatter, TooltipPayload, Cell } from 'recharts';
import { CombinedState } from '../store/store';
import { Card } from './uiElements/Card';
import { Layout } from './uiElements/Layout';
import { Account } from '@models/Account';
import { Log } from '@/util/Logger';
import { Colors } from './uiElements/styleConstants';

export interface DashboardPageProps {
    envelopes?: Account[];
}

const tooltipFormatter: TooltipFormatter = (_value, _name, entry: TooltipPayload) => entry.payload.tooltip;

const Component = (props: DashboardPageProps) => {
    const data = [
        {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
        {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
        {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
        {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
        {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
        {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
        {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
    ];

    const envelopeData = props.envelopes!.map(e => ({
        name: e.name,
        value: e.balance.toPrecisionInt(),
        tooltip: e.balance.toFormattedString(),
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
                            {envelopeData.map((_entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]}/>)}
                        </Pie>
                        <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            
            <Card heading="Sample Chart">
                <ResponsiveContainer height={350}>
                    <LineChart data={data}>
                        <XAxis dataKey="name" />
                        <Tooltip />
                        <CartesianGrid stroke="#f5f5f5" />
                        <Line type="monotone" dataKey="uv" yAxisId={0} />
                        <Line type="monotone" dataKey="pv" yAxisId={1} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Layout>
    </>;
}

const mapStateToProps = (state: CombinedState, ownProps: DashboardPageProps): DashboardPageProps => {
    return {
        ...ownProps,
        envelopes: Object.values(state.accounts.accounts).filter(filterOnlyEnvelopeAccounts),
    };
}

export const DashboardPage = connect(mapStateToProps, {})(Component);