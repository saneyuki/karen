import {Option, Some, None} from 'option-t';

import {User} from '../domain/User';
import {ChannelId} from '../domain/ChannelDomain';

export class RizeUserListRepository {

    private _map: Map<ChannelId, Set<User>>;

    constructor() {
        this._map = new Map();
    }

    getUserListByChannelId(id: ChannelId): Option<Set<User>> {
        const set = this._map.get(id);
        if (set === undefined) {
            return new None<Set<User>>();
        }

        return new Some(set);
    }

    save(ownerId: ChannelId, set: Set<User>): void {
        this._map.set(ownerId, set);
    }
}