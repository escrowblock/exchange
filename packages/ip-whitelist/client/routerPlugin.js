Iron.Router.plugins.userIPWhitelist = function (ro, options) {
    let template = 'RPpinCode';
    let opts = {
        title: 'Pin code',
        name: 'PinCode',
    };

    if (options.template) {
        template = options.template;
        opts = options.opts;
    }

    Router.route('/pincode', function() {
        this.render(template);
    }, opts);

    Router.onBeforeAction(function () {
        if (Meteor.userId() && Meteor.users.findOne(Meteor.userId())
      && Meteor.users.findOne(Meteor.userId()).profile.pinCodeActivate
      && Router.current().route.path() != '/pincode'
        ) {
            Router.go('/pincode');
            return;
        }
        this.next();
    });
};
