import { Deps } from 'meteor/deps';
import { UserStatus } from 'meteor/ostrio:user-status';

Deps.autorun(function(c) {
    try {
        UserStatus.startMonitor({
            threshold: 30000,
            idleOnBlur: true,
        });
        return c.stop();
    } catch (error) {
        c.stop();
    }
    return null;
});
