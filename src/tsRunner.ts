// tsNodeRunner.ts
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface CompilerOptions extends ts.CompilerOptions {}

function getCompilerOptions(): CompilerOptions {
  return {
    module: ts.ModuleKind.CommonJS, 
    target: ts.ScriptTarget.ES2017,
    allowJs: true,
    esModuleInterop: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  };
}

function compileTypeScript(fileName: string): string {
  const source = fs.readFileSync(fileName, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: getCompilerOptions(),
    fileName,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    result.diagnostics.forEach((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const lineInfo = diagnostic.file ? ` (${diagnostic.file.fileName}:${diagnostic.start})` : '';
      console.error(`Error${lineInfo}: ${message}`);
    });
    throw new Error('TypeScript compilation failed');
  }

  return result.outputText;
}

function registerTsHandler() {
  const req: NodeRequire = require;
  if (!req.extensions) {
    throw new Error('This implementation requires CommonJS module system');
  }

  req.extensions['.ts'] = (module: any, fileName: string) => {
    const jsCode = compileTypeScript(fileName);
    module._compile(jsCode, fileName);
  };
}

export function runTsFile(testFiles: string[]): void {
  try {
    registerTsHandler();
    let totalFilesRun = 0;
    let anyFailures = false;

    if (testFiles.length === 0) {
      console.error(`No test files`);
      return;
    }
    for (const file of testFiles) {
      let fullPath = file;            
      if (!file.startsWith('/')) 
          fullPath = path.resolve(file);
      const isFile = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
      if (isFile && file.endsWith('.ts')) {
        require(fullPath);
        totalFilesRun++;
        if (process.exitCode === 1) {
          anyFailures = true;
        }
      }      
    }

    if (totalFilesRun === 0) {
      console.error('No test files were run');
      process.exit(1);
    }

    if (anyFailures) {
      process.exitCode = 1; // Ensure exit code reflects any failures
    }
  } catch (error) {
    console.error('Failed to run TypeScript test files:', (error as Error).message);
    process.exit(1);
  }
};