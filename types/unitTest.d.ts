export { strict as assert } from 'assert';
type TestFunction = () => void | Promise<void>;
export declare const describe: (name: string, fn: () => void) => void;
export declare const it: (name: string, fn: TestFunction) => void;
export declare const beforeAll: (fn: () => void | Promise<void>) => void;
export declare const afterAll: (fn: () => void | Promise<void>) => void;
export declare const beforeEach: (fn: () => void | Promise<void>) => void;
export declare const afterEach: (fn: () => void | Promise<void>) => void;
