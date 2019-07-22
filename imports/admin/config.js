const AdminConfig = {
    name: 'Admin',
    homeUrl: '/admin',
    adminEmails: '',
    nonAdminRedirectRoute: '/',
    logoutRedirect: '/',
    skin: 'black-light',
    collections: {
        profile: {
            label: 'Profile',
            icon: 'user',
            tableColumns: [
                { label: 'User name', name: 'UserName' },
                { label: 'Email', name: 'Email' },
                { label: 'Telegram', name: 'Telegram' },
            ],
            showEditColumn: true, // Set to false to hide the edit button. True by default.
            showWidget: true,
            color: 'aqua',
        },
        product: {
            label: 'Product',
            icon: 'cog',
            tableColumns: [
                { label: 'Product Symbol', name: 'ProductSymbol' },
                { label: 'Product FullName', name: 'ProductFullName' },
                { label: 'Product Type', name: 'ProductType' },
                { label: 'Deposit Status', name: 'DepositStatus' },
                { label: 'Withdraw Status', name: 'WithdrawStatus' },
            ],
            showEditColumn: true, // Set to false to hide the edit button. True by default.
        },
        instrument: {
            label: 'Instrument',
            icon: 'cogs',
            tableColumns: [
                { label: 'Instrument Symbol', name: 'InstrumentSymbol' },
                { label: 'Session Status', name: 'SessionStatus' },
            ],
            showEditColumn: true, // Set to false to hide the edit button. True by default.
        },
        node: {
            label: 'Nodes',
            icon: 'book',
            tableColumns: [
                { label: 'Title', name: 'Title' },
                { label: 'Type', name: 'Type' },
            ],
            showEditColumn: true, // Set to false to hide the edit button. True by default.
            showDelColumn: true, // Set to false to hide the edit button. True by default.
            showWidget: true,
            color: 'red',
        },
        variable: {
            label: 'Variables',
            icon: 'tasks',
            tableColumns: [
                { label: 'Name', name: 'Name' },
                { label: 'Instance', name: 'Instance' },
            ],
            showEditColumn: true, // Set to false to hide the edit button. True by default.
            showDelColumn: true, // Set to false to hide the edit button. True by default.
            showWidget: false,
        },
        'SyncedCron._collection': {
            label: 'Cron history',
            icon: 'clock',
            tableColumns: [
                { label: 'Started at', name: 'startedAt' },
                { label: 'Name', name: 'name' },
            ],
            showEditColumn: true, // Set to false to hide the edit button. True by default.
            showDelColumn: true, // Set to false to hide the edit button. True by default.
            showWidget: false,
            showNewInSideBar: false,
            collectionObject: global.SyncedCron._collection,
        },
    },
    callbacks: {

    },
};

export { AdminConfig as default };
