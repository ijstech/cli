export { strict as assert } from 'assert';

type TestFunction = () => void | Promise<void>;
type TestEntry = 
  | { type: 'describe'; name: string; indent: string }
  | { type: 'test'; name: string; fn: TestFunction; indent: string };

class TestContext {
  private tests: TestEntry[] = [];
  private failureCount: number = 0;
  private currentDepth: number = 0;
  private beforeAllHooks: (() => void | Promise<void>)[] = [];
  private afterAllHooks: (() => void | Promise<void>)[] = [];
  private beforeEachHooks: (() => void | Promise<void>)[] = [];
  private afterEachHooks: (() => void | Promise<void>)[] = [];

  describe(name: string, fn: () => void): void {
    const indent = "  ".repeat(this.currentDepth);
    // Add describe entry to tests array
    this.tests.push({ type: 'describe', name, indent });
    this.currentDepth++;
    fn(); // Collect nested tests
    this.currentDepth--;
  }

  beforeAll(fn: () => void): void {
    this.beforeAllHooks.push(fn);
  }

  afterAll(fn: () => void | Promise<void>): void {
    this.afterAllHooks.push(fn);
  }

  beforeEach(fn: () => void | Promise<void>): void {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn: () => void | Promise<void>): void {
    this.afterEachHooks.push(fn);
  }

  it(name: string, fn: TestFunction): void {
    const indent = "  ".repeat(this.currentDepth + 1);
    this.tests.push({ type: 'test', name, fn, indent });
  }

  async runTests(): Promise<void> {    
    const startTime = Date.now();
    const failedTests: { name: string; error: string }[] = [];
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
      } else if (entry.type === 'test') {
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
        } catch (error) {
          this.failureCount++;
          // Capture stack trace for failed test
          const errObj = error as Error;
          failedTests.push({ 
            name: entry.name, 
            error: errObj.message + (errObj.stack ? `\n${errObj.stack}` : '') 
          });
          console.log(`${entry.indent}\x1b[31m✗ ${entry.name}\x1b[0m`);
        } finally {
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

export const describe = (name: string, fn: () => void) => testContext.describe(name, fn);
export const it = (name: string, fn: TestFunction) => testContext.it(name, fn);
export const beforeAll = (fn: () => void | Promise<void>) => testContext.beforeAll(fn);
export const afterAll = (fn: () => void | Promise<void>) => testContext.afterAll(fn);
export const beforeEach = (fn: () => void | Promise<void>) => testContext.beforeEach(fn);
export const afterEach = (fn: () => void | Promise<void>) => testContext.afterEach(fn);

(globalThis as any).describe = describe;
(globalThis as any).it = it;
(globalThis as any).beforeAll = beforeAll;
(globalThis as any).afterAll = afterAll;
(globalThis as any).beforeEach = beforeEach;
(globalThis as any).afterEach = afterEach;

setImmediate(() => {
  if (testContext['tests'].length > 0) {
    testContext.runTests().catch((err) => {
      console.error('Test execution failed:', err);
      process.exitCode = 1;
    });
  }
});