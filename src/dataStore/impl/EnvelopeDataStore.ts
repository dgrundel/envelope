import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";

const name = 'envelopes';

export interface Envelope extends BaseDataStoreRecord {
    name: string;
}

export class EnvelopeDataStore extends DataStore<Envelope> {
    constructor() {
        super(name);

        this.index({ fieldName: 'name', unique: true });
    }
}

export class EnvelopeDataStoreClient extends DataStoreClient<Envelope> {
    constructor() {
        super(name);
    }

    addEnvelope(envelope: Envelope) {
        return this.insert(envelope);
    }

    getEnvelopes(query: any = {}) {
        return this.find(query);
    }
}
