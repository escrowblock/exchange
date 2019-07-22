Template.RPpinCode.events({
    'click #sendPinCode': (event, template) => {
        console.log($(template.find('#pinCode')).val());
        return false;
    },
});
