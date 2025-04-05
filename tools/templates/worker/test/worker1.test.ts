import { describe, it, assert } from '@ijstech/cli';
import {Worker, IRequiredPlugins} from '@ijstech/node';
import Path from 'path';
const pluginOptions: IRequiredPlugins = {
    fetch: { methods: [ 'GET', 'POST' ] }
};

describe('Workers', function() {    
    it('Worker 1', async function(){    
        let worker = new Worker({
            plugins: pluginOptions,
            scriptPath: Path.resolve(__dirname, '../src/worker1.ts')
        });
        let result = await worker.process();
        assert.strictEqual(result.step1, true);
        assert.strictEqual(result.step2, 2);
    })
})
