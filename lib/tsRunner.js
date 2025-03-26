"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTsFile = runTsFile;
// tsNodeRunner.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
function getCompilerOptions() {
    return {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2017,
        allowJs: true,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
    };
}
function compileTypeScript(fileName) {
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
    const req = require;
    if (!req.extensions) {
        throw new Error('This implementation requires CommonJS module system');
    }
    req.extensions['.ts'] = (module, fileName) => {
        const jsCode = compileTypeScript(fileName);
        module._compile(jsCode, fileName);
    };
}
function runTsFile(testFiles) {
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
    }
    catch (error) {
        console.error('Failed to run TypeScript test files:', error.message);
        process.exit(1);
    }
}
;
