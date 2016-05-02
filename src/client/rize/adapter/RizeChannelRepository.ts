import {Option, Some, None} from 'option-t';

import {
    ChannelId,
    RizeChannelValue as Channel,
} from '../domain/ChannelDomain';

export class RizeChannelRepository {

    private _map: Map<ChannelId, Channel>;

    constructor() {
        this._map = new Map();
    }

    save(item: Channel): void {
        this._map.set(item.id(), item);
    }

    getById(id: ChannelId): Option<Channel> {
        const item = this._map.get(id);
        if (item === undefined) {
            return new None<Channel>();
        }

        return new Some(item);
    }
}