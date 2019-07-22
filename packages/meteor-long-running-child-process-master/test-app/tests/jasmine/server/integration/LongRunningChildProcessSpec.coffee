Jasmine.onTest ->

  describe 'LongRunningChildProcess', ->
    beforeEach ->
      @taskName = 'test'
      @child = new LongRunningChildProcess(this.taskName)


    describe 'imports', ->
      # Make sure that the imports are exposed for testing
      describe 'LongRunningChildProcess.fs', ->
        it 'is defined', ->
          expect(LongRunningChildProcess.fs).toBeDefined()

      describe 'LongRunningChildProcess.child_process', ->
        it 'is defined', ->
          expect(LongRunningChildProcess.child_process).toBeDefined()


    describe 'constructor', ->
      it 'stores the taskName', ->
        expect(@child.getTaskName()).toBe(@taskName)

      it 'reads the pid initially from the file', ->
        pid = 123
        spyOn(LongRunningChildProcess.prototype, 'readPid').and.returnValue(pid)

        @child = new LongRunningChildProcess(this.taskName)

        expect(@child.readPid).toHaveBeenCalled()
        expect(@child.getPid()).toBe(pid)


    describe 'isRunning', ->
      it 'returns false when no pid is available', ->
        spyOn(@child, 'getPid').and.returnValue(null)

        expect(@child.isRunning()).toBe(false)

      describe 'when pid is available', ->
        beforeEach ->
          @pid = 123
          spyOn(@child, 'getPid').and.returnValue(@pid)

        describe 'when process.kill does not throw', ->
          beforeEach ->
            spyOn(process, 'kill')

          it 'returns true', ->
            expect(@child.isRunning()).toBe(true)

        describe 'when process.kill throws', ->
          beforeEach ->
            fakeKill = -> throw new Error()
            spyOn(process, 'kill').and.callFake(fakeKill)

          it 'returns false ', ->
            expect(@child.isRunning()).toBe(false)


    describe 'readPid', ->
      it 'reads and returns pid from file', ->
        spyOn(LongRunningChildProcess.fs, 'readFileSync').and.returnValue('123')

        pid = @child.readPid()

        expect(LongRunningChildProcess.fs.readFileSync).toHaveBeenCalled()
        expect(pid).toBe(123)

      describe 'when exception occurs while reading file', ->
        beforeEach ->
          fakeReadFileSync = -> throw new Error()
          spyOn(LongRunningChildProcess.fs, 'readFileSync').and.callFake(fakeReadFileSync)

        it 'returns null', ->
          expect(@child.readPid()).toBeNull()


    describe 'spawn', ->
      # Mocking
      beforeEach ->
        @childProcess =
          pid: 1234
          on: jasmine.createSpy('@childProcess.on')
        @spawnSpy = spyOn(LongRunningChildProcess.child_process, 'spawn')
          .and.returnValue(@childProcess)
        @ensureDirSyncSpy = spyOn(LongRunningChildProcess.fs, 'ensureDirSync')
        @openSyncSpy = spyOn(LongRunningChildProcess.fs, 'openSync')
        @chmodSyncSpy = spyOn(LongRunningChildProcess.fs, 'chmodSync')
        @outputFileSpy = spyOn(LongRunningChildProcess.fs, 'outputFile')

      # Helper to keep it DRY
      beforeEach ->
        @spawnOptions =
          command: 'node'
          args: ['foo-arg']

        @spawn = -> @child.spawn(@spawnOptions)

      describe 'when child process is already running', ->
        beforeEach ->
          spyOn(@child, 'isRunning').and.returnValue(true)

        it 'returns false', ->
          expect(@spawn()).toBe(false)

        it 'does not spawn a new child process', ->
          @spawn()
          expect(LongRunningChildProcess.child_process.spawn).not.toHaveBeenCalled()

      describe 'when child process is not running', ->
        it 'streams stdout and stderr to a log file', ->
          fileStream = {}
          @openSyncSpy.and.returnValue(fileStream)

          @spawn()

          expect(LongRunningChildProcess.child_process.spawn).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.any(Array),
            jasmine.objectContaining(
              stdio: ['ignore', fileStream, fileStream]
            )
          )

        it 'spawns child process in detached mode', ->
          @spawn()

          expect(LongRunningChildProcess.child_process.spawn).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.any(Array),
            jasmine.objectContaining(
              detached: true
            )
          )

        it 'passes the environment variables to the child process', ->
          @spawn()

          options = LongRunningChildProcess.child_process.spawn
            .calls.mostRecent().args[2]
          expect(options.env).toEqual(
            jasmine.objectContaining(_.omit(process.env, 'PATH'))
          )

        it 'sets the cwd of the child process to the meteor app path', ->
          # We expect here that @_getMeteorAppPath works
          meteorAppPath = '/app'
          spyOn(@child, '_getMeteorAppPath').and.returnValue(meteorAppPath)

          @spawn()

          expect(LongRunningChildProcess.child_process.spawn).toHaveBeenCalledWith(
            jasmine.any(String),
            jasmine.any(Array),
            jasmine.objectContaining(
              cwd: meteorAppPath
            )
          )

        it 'spawns the child process with the spawn script', ->
          # We expect here that @_getSpawnScriptPath works
          spawnScriptPath = '/spawnScript.js'
          spyOn(@child, '_getSpawnScriptPath').and.returnValue(spawnScriptPath)

          # We expect here that @_getMeteorPid works
          meteorPid = 12345
          spyOn(@child, '_getMeteorPid').and.returnValue(meteorPid)

          @spawn()

          expect(LongRunningChildProcess.child_process.spawn).toHaveBeenCalledWith(
            process.execPath,
            [
              spawnScriptPath,
              meteorPid,
              @taskName,
              @spawnOptions.command,
              'foo-arg'
            ],
            jasmine.any(Object)
          )

        it 'sets the child to the new spawned child process', ->
          @spawn()

          expect(@child.getChild()).toBe(@childProcess)

        it 'sets dead status to false', ->
          @child.dead = true

          @spawn()

          expect(@child.isDead()).toBe(false)

        it 'updated pid to the pid of the child process', ->
          @spawn()

          expect(@child.getPid()).toBe(@childProcess.pid)

        it 'returns true', ->
          expect(@spawn()).toBe(true)


    describe 'kill', ->
      # TODO: Some things are not covered by tests

      beforeEach ->
        @removeSyncSpy = spyOn(LongRunningChildProcess.fs, 'removeSync')
        @killSpy = spyOn(process, 'kill')

        @child.child =
          pid: 1234
          kill: jasmine.createSpy()

      describe 'when child process is alive', ->
        beforeEach ->
          @child.dead = false

        it 'kills the child process', ->
          @child.kill()

          expect(@child.child.kill).toHaveBeenCalledWith('SIGINT')

        it 'sets the child process to dead', ->
          @child.kill()

          expect(@child.isDead()).toBe(true)

        it 'sets the pid to null', ->
          @child.pid = 1234

          @child.kill()

          expect(@child.getPid()).toBe(null)

        it 'removes the pid file', ->
          @child.kill()

          expect(LongRunningChildProcess.fs.removeSync)
            .toHaveBeenCalledWith(@child._getPidFilePath())

      describe 'when child process is dead', ->
        beforeEach ->
          @child.dead = true

        it 'does not kill anything', ->
          @child.kill()

          expect(@child.child.kill).not.toHaveBeenCalled()
          expect(process.kill).not.toHaveBeenCalled()
