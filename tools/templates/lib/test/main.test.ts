import { describe, it, assert } from '@ijstech/cli';
import {demoFunction} from '../src/index';

describe("Main Tests", async () => {
    it("should return string", async () => {   
        let result = demoFunction(); 
        assert.strictEqual(result, 'Hello');
    });
});