"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.afterEach = exports.beforeEach = exports.afterAll = exports.beforeAll = exports.it = exports.describe = exports.assert = void 0;
var assert_1 = require("assert");
Object.defineProperty(exports, "assert", { enumerable: true, get: function () { return assert_1.strict; } });
class TestContext {
    tests = [];
    failureCount = 0;
    currentDepth = 0;
    beforeAllHooks = [];
    afterAllHooks = [];
    beforeEachHooks = [];
    afterEachHooks = [];
    describe(name, fn) {
        const indent = "  ".repeat(this.currentDepth);
        // Add describe entry to tests array
        this.tests.push({ type: 'describe', name, indent });
        this.currentDepth++;
        fn(); // Collect nested tests
        this.currentDepth--;
    }
    beforeAll(fn) {
        this.beforeAllHooks.push(fn);
    }
    afterAll(fn) {
        this.afterAllHooks.push(fn);
    }
    beforeEach(fn) {
        this.beforeEachHooks.push(fn);
    }
    afterEach(fn) {
        this.afterEachHooks.push(fn);
    }
    it(name, fn) {
        const indent = "  ".repeat(this.currentDepth + 1);
        this.tests.push({ type: 'test', name, fn, indent });
    }
    async runTests() {
        const startTime = Date.now();
        const failedTests = [];
        let passedCount = 0;
        let totalCount = 0;
        for (const hook of this.beforeAllHooks) {
            const result = hook();
            if (result instanceof Promise) {
                await result;
            }
        }
        for (const entry of this.tests) {
            if (entry.type === 'describe') {
                console.log(`${entry.indent}\x1b[36m📋 ${entry.name}\x1b[0m`);
            }
            else if (entry.type === 'test') {
                totalCount++;
                try {
                    for (const hook of this.beforeEachHooks) {
                        const result = hook();
                        if (result instanceof Promise) {
                            await result;
                        }
                    }
                    const result = entry.fn();
                    if (result instanceof Promise) {
                        await result; // Wait for async tests
                    }
                    passedCount++;
                    console.log(`${entry.indent}\x1b[32m✓ ${entry.name}\x1b[0m`);
                }
                catch (error) {
                    this.failureCount++;
                    // Capture stack trace for failed test
                    const errObj = error;
                    failedTests.push({
                        name: entry.name,
                        error: errObj.message + (errObj.stack ? `\n${errObj.stack}` : '')
                    });
                    console.log(`${entry.indent}\x1b[31m✗ ${entry.name}\x1b[0m`);
                }
                finally {
                    for (const hook of this.afterEachHooks) {
                        const result = hook();
                        if (result instanceof Promise) {
                            await result;
                        }
                    }
                }
            }
        }
        for (const hook of this.afterAllHooks) {
            const result = hook();
            if (result instanceof Promise) {
                await result;
            }
        }
        const duration = Date.now() - startTime;
        console.log();
        if (failedTests.length > 0) {
            console.log('\x1b[31mFailed Tests:\x1b[0m');
            failedTests.forEach((fail, idx) => {
                console.log(`  ${idx + 1}) ${fail.name}`);
                // Print error message and stack trace (if present)
                console.log(`     \x1b[31m${fail.error}\x1b[0m`);
            });
            console.log();
        }
        console.log(`\x1b[32mPassed:\x1b[0m ${passedCount}  \x1b[31mFailed:\x1b[0m ${failedTests.length}  Total: ${totalCount}  (${duration} ms)`);
        if (failedTests.length > 0) {
            process.exitCode = 1;
        }
    }
}
// Global singleton instance
const testContext = new TestContext();
const describe = (name, fn) => testContext.describe(name, fn);
exports.describe = describe;
const it = (name, fn) => testContext.it(name, fn);
exports.it = it;
const beforeAll = (fn) => testContext.beforeAll(fn);
exports.beforeAll = beforeAll;
const afterAll = (fn) => testContext.afterAll(fn);
exports.afterAll = afterAll;
const beforeEach = (fn) => testContext.beforeEach(fn);
exports.beforeEach = beforeEach;
const afterEach = (fn) => testContext.afterEach(fn);
exports.afterEach = afterEach;
globalThis.describe = exports.describe;
globalThis.it = exports.it;
globalThis.beforeAll = exports.beforeAll;
globalThis.afterAll = exports.afterAll;
globalThis.beforeEach = exports.beforeEach;
globalThis.afterEach = exports.afterEach;
setImmediate(() => {
    if (testContext['tests'].length > 0) {
        testContext.runTests().catch((err) => {
            console.error('Test execution failed:', err);
            process.exitCode = 1;
        });
    }
});
