export { strict as assert } from 'assert';
type TestFunction = () => void | Promise<void>;
export declare const describe: (name: string, fn: () => void) => void;
export declare const it: (name: string, fn: TestFunction) => void;
