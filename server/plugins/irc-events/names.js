import _ from 'lodash';
import User from '../../models/User';

export default function(irc, network) {
    const client = this;
    irc.on('names', function(data) {
        const chan = _.findWhere(network.channels, {name: data.channel});
        if (typeof chan === 'undefined') {
            return;
        }
        chan.users = [];
        _.each(data.names, function(u) {
            chan.users.push(new User(u));
        });
        chan.sortUsers();
        client.emit('users', {
            chan: chan.id,
            users: chan.users
        });
    });
}