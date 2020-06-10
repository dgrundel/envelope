import { BaseDataStoreRecord, DataStore, DataStoreClient } from "../BaseDataStore";
import { Log } from '@/util/Logger';

const name = 'envelope';

export interface Envelope extends BaseDataStoreRecord {
    name: string;
}

export class EnvelopeDataStore extends DataStore<Envelope> {
    constructor() {
        super(name);

        this.db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {
            Log.error('Error while indexing', err);
        });
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
