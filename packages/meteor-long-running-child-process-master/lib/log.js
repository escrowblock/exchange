log = loglevel.createPackageLogger(
    '[sanjo:long-running-child-process]',
    process.env.LONG_RUNNING_CHILD_PROCESS_LOG_LEVEL || 'info',
);
