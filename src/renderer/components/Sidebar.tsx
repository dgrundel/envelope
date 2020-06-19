import '@public/components/Sidebar.scss';
import * as React from "react";
import { getAppContext } from '../AppContext';
import { AppPage } from './App';
import { ImportDropTarget } from './import/ImportDropTarget';


export interface SidebarProps {
}

export class Sidebar extends React.Component<SidebarProps, {}> {
    render() {
        return <div id="sidebar">
            <h4 className="sidebar-nav-header">Navigation Header</h4>
            <ul className="sidebar-nav">
                {this.renderNavLink(AppPage.Dashboard, 'Dashboard')}
                {this.renderNavLink(AppPage.Accounts, 'Accounts')}
                {this.renderNavLink(AppPage.Envelopes, 'Envelopes')}
                {this.renderNavLink(AppPage.Transactions, <>
                    Transactions
                    <i className="material-icons">notification_important</i>
                </>)}
            </ul>
            <ImportDropTarget/>
        </div>;
    }


    renderNavLink(page: AppPage, label: any) {
        const pageApi = getAppContext().pageApi;

        return <li className={pageApi.getActivePage() === page ? 'sidebar-nav-link-active' : ''} onClick={() => pageApi.setPage(page)}>{label}</li>;
    }
}