import { Log } from '@/util/Logger';
import * as React from "react";

export type ListenerAdder =  () => ListenerRemover;
export type ListenerRemover = () => void;

export abstract class EventListener<P, S> extends React.Component<P, S> {
    private mounted: boolean;
    private adders: ListenerAdder[];
    private removers: ListenerRemover[];
    
    componentDidMount() {
        this.mounted = true;
        while (this.adders && this.adders.length > 0) {
            const adder = this.adders.shift();
            this.execAdder(adder);
        }
    }

    componentWillUnmount() {
        while (this.removers && this.removers.length > 0) {
            const remover = this.removers.shift();
            try {
                remover && remover();
            } catch (e) {
                Log.error('Error running event remover', e);
            }
        }
    }

    addListener(callback: ListenerAdder) {
        if (this.mounted) {
            this.execAdder(callback);
        } else {
            this.adders = (this.adders || []).concat(callback);
        }
    }

    private execAdder(adder: ListenerAdder | undefined) {
        try {
            const remover = adder && adder();
            if (remover) {
                this.removers = (this.removers || []).concat(remover);
            }
        }
        catch (e) {
            Log.error('Error running event adder', e);
        }
    }
}