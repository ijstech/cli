export { strict as assert } from 'assert';

type TestFunction = () => void | Promise<void>;
type TestEntry = 
  | { type: 'describe'; name: string; indent: string }
  | { type: 'test'; name: string; fn: TestFunction; indent: string };

class TestContext {
  private tests: TestEntry[] = [];
  private failureCount: number = 0;
  private currentDepth: number = 0;



  describe(name: string, fn: () => void): void {
    const indent = "  ".repeat(this.currentDepth);
    // Add describe entry to tests array
    this.tests.push({ type: 'describe', name, indent });
    this.currentDepth++;
    fn(); // Collect nested tests
    this.currentDepth--;
  }

  it(name: string, fn: TestFunction): void {
    const indent = "  ".repeat(this.currentDepth + 1);
    this.tests.push({ type: 'test', name, fn, indent });
  }

  async runTests(): Promise<void> {    
    for (const entry of this.tests) {
      if (entry.type === 'describe') {
        console.log(`${entry.indent}📋 ${entry.name}`);
      } else if (entry.type === 'test') {
        try {
          const result = entry.fn();
          if (result instanceof Promise) {
            await result; // Wait for async tests
          }
          console.log(`${entry.indent}✅ ${entry.name}`);
        } catch (error) {
          console.error(`${entry.indent}❌ ${entry.name}`);
          console.error(`${entry.indent}  Error: ${(error as Error).message}`);
          this.failureCount++;
        }
      }
    }

    console.log();
    if (this.failureCount === 0) {
      console.log('All tests passed');
    } else {
      console.log(`Number of failed test cases: ${this.failureCount}`);
      process.exitCode = 1;
    }
  }
}

// Global singleton instance
const testContext = new TestContext();

export const describe = (name: string, fn: () => void) => testContext .describe(name, fn);
export const it = (name: string, fn: TestFunction) => testContext .it(name, fn);

setImmediate(() => {
  if (testContext['tests'].length > 0) {
    testContext.runTests().catch((err) => {
      console.error('Test execution failed:', err);
      process.exitCode = 1;
    });
  }
});