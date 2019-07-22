# sanjo:long-running-child-process

Spawn child processes that survive restarts and exit when the app exits.

## API

```javascript
var childProcess = new sanjo.LongRunningChildProcess('myChild');
var spawnOptions = {
  command: <COMMAND>,
  args: []
};
childProcess.spawn(spawnOptions);
```

Also see [spec](https://github.com/Sanjo/meteor-long-running-child-process/blob/master/test-app/tests/jasmine/server/integration/LongRunningChildProcessSpec.coffee) and implementation for details.

## Example

* https://github.com/Sanjo/meteor-karma/blob/master/main.js

## License

MIT

The `lib/LongRunningChildProcess.coffee` file has been originally written
by [Ronen Babayoff](https://github.com/rbabayoff) and is also under MIT license.
