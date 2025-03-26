"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.it = exports.describe = exports.assert = void 0;
var assert_1 = require("assert");
Object.defineProperty(exports, "assert", { enumerable: true, get: function () { return assert_1.strict; } });
class TestContext {
    tests = [];
    failureCount = 0;
    currentDepth = 0;
    describe(name, fn) {
        const indent = "  ".repeat(this.currentDepth);
        // Add describe entry to tests array
        this.tests.push({ type: 'describe', name, indent });
        this.currentDepth++;
        fn(); // Collect nested tests
        this.currentDepth--;
    }
    it(name, fn) {
        const indent = "  ".repeat(this.currentDepth + 1);
        this.tests.push({ type: 'test', name, fn, indent });
    }
    async runTests() {
        for (const entry of this.tests) {
            if (entry.type === 'describe') {
                console.log(`${entry.indent}📋 ${entry.name}`);
            }
            else if (entry.type === 'test') {
                try {
                    const result = entry.fn();
                    if (result instanceof Promise) {
                        await result; // Wait for async tests
                    }
                    console.log(`${entry.indent}✅ ${entry.name}`);
                }
                catch (error) {
                    console.error(`${entry.indent}❌ ${entry.name}`);
                    console.error(`${entry.indent}  Error: ${error.message}`);
                    this.failureCount++;
                }
            }
        }
        console.log();
        if (this.failureCount === 0) {
            console.log('All tests passed');
        }
        else {
            console.log(`Number of failed test cases: ${this.failureCount}`);
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
setImmediate(() => {
    if (testContext['tests'].length > 0) {
        testContext.runTests().catch((err) => {
            console.error('Test execution failed:', err);
            process.exitCode = 1;
        });
    }
});
