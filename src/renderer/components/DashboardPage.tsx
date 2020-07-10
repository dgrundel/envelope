import * as React from "react";
import { CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card } from './uiElements/Card';
import { Layout } from './uiElements/Layout';

export interface DashboardPageProps {
}

export class DashboardPage extends React.Component<DashboardPageProps, {}> {
    render() {
        const data = [
            {name: 'Page A', uv: 4000, pv: 2400, amt: 2400},
            {name: 'Page B', uv: 3000, pv: 1398, amt: 2210},
            {name: 'Page C', uv: 2000, pv: 9800, amt: 2290},
            {name: 'Page D', uv: 2780, pv: 3908, amt: 2000},
            {name: 'Page E', uv: 1890, pv: 4800, amt: 2181},
            {name: 'Page F', uv: 2390, pv: 3800, amt: 2500},
            {name: 'Page G', uv: 3490, pv: 4300, amt: 2100},
        ];

        const envelopeData = [
            {name: 'Bills', amount: 100000, label: '$100'},
            {name: 'Food', amount: 50000, label: '$50'},
            {name: 'Fun', amount: 75000, label: '$75'},
        ];

        return <Layout>
            <Card heading="Getting Started">
                <p>Welcome to Envelope! Here are a few steps to get you going:</p>

                <ol>
                    <li>Click <strong>Accounts</strong> and add each of your bank and credit card accounts.</li>
                    <li>Click <strong>Envelopes</strong> and create a few envelopes for your budget.</li>
                    <li>Move some money from your <strong>Available Funds Envelope</strong> into your budget envelopes.</li>
                    <li><strong>Drag and Drop</strong> a CSV file exported from your bank's website to import bank and credit card transactions.</li>
                </ol>
            </Card>

            <Card heading="Sample Chart">
                <ResponsiveContainer height={500}>
                    <PieChart>
                        <Pie dataKey="amount" data={envelopeData} label={props => props.name} />
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Card>
            
            <Card heading="Sample Chart">
                <ResponsiveContainer height={500}>
                    <LineChart data={data}>
                        <XAxis dataKey="name" />
                        <Tooltip />
                        <CartesianGrid stroke="#f5f5f5" />
                        <Line type="monotone" dataKey="uv" yAxisId={0} />
                        <Line type="monotone" dataKey="pv" yAxisId={1} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </Layout>;
    }
}