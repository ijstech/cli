#!/usr/bin/env node
const Fs = require('fs');
const Path = require('path');
const RootDir = process.cwd();
let SiteTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover">
  {{meta}}
  <script 
    src="{{rootDir}}libs/@ijstech/components/index.js"
    integrity="{{sri}}"
    crossorigin="anonymous"></script>
</head>
<body>
  <script>
    async function init() {
      let module = await application.init('{{rootDir}}scconfig.json');
      document.body.append(module);
    };
    init();
  </script>
</body>
</html>`;

// Function to read package.json and get sorted dependency names from specific organizations
function getSortedDependencies(packageJsonPath = './package.json', allowedOrgs = ['@ijstech', '@scom']) {
    let packageJson;

    // Read and parse root package.json
    try {
        const fileContent = Fs.readFileSync(packageJsonPath, 'utf8');
        packageJson = JSON.parse(fileContent);
    } catch (error) {
        throw new Error(`Failed to read or parse package.json: ${error.message}`);
    }

    // Graph to store dependencies (package names only)
    const graph = new Map();
    // Set of processed package names to avoid duplicates
    const processed = new Set();

    // Helper to check if a package belongs to an allowed organization
    function isFromAllowedOrg(pkgName) {
        return allowedOrgs.some(org => pkgName.startsWith(`${org}/`));
    }

    // Iterative dependency resolution using a queue
    function resolveDependenciesIterative(rootDeps) {
        // Queue for processing: [pkgName, parentStack]
        const queue = Object.keys(rootDeps)
            .filter(dep => isFromAllowedOrg(dep))
            .map(dep => [dep, new Set()]);

        while (queue.length > 0) {
            const [pkgName, parentStack] = queue.shift();

            // Skip if already processed
            if (processed.has(pkgName)) continue;

            let pkgDeps = {};

            // Read package.json from node_modules
            const pkgJsonPath = Path.join(RootDir, 'node_modules', pkgName, 'package.json');
            try {
                const pkgJsonContent = Fs.readFileSync(pkgJsonPath, 'utf8');
                const pkgJson = JSON.parse(pkgJsonContent);
                pkgDeps = { ...(pkgJson.dependencies || {}) };
            } catch (error) {
                console.warn(`Failed to read ${pkgJsonPath}: ${error.message}`);
                continue; // Skip if package.json is missing
            }

            // Mark as processed
            processed.add(pkgName);

            // Only process if from allowed org
            if (!isFromAllowedOrg(pkgName)) continue;

            // Initialize graph node
            const dependencies = [];

            // Process dependencies (only those from allowed orgs)
            for (const [depName] of Object.entries(pkgDeps)) {
                if (!isFromAllowedOrg(depName)) continue; // Skip non-allowed org dependencies

                // Check for cycles
                if (parentStack.has(depName)) {
                    console.warn(`Circular dependency detected: ${pkgName} -> ${depName}`);
                    continue;
                }

                // Add to graph
                dependencies.push(depName);

                // Add to queue for processing
                if (!processed.has(depName)) {
                    queue.push([depName, new Set([...parentStack, pkgName])]);
                }
            }

            // Add to graph
            graph.set(pkgName, dependencies);
        }
    }

    // Helper for topological sort
    function topologicalSort() {
        const sorted = [];
        const visited = new Set();
        const temp = new Set(); // Temporary stack for cycle detection

        function visit(node) {
            if (visited.has(node)) return;
            if (temp.has(node)) {
                console.warn(`Cycle detected at ${node}`);
                return;
            }

            temp.add(node);
            const neighbors = graph.get(node) || [];
            for (const neighbor of neighbors) {
                visit(neighbor);
            }
            temp.delete(node);
            visited.add(node);
            sorted.push(node);
        }

        // Visit all nodes in graph
        for (const node of graph.keys()) {
            visit(node);
        }

        return sorted;
    }

    // Start with root package dependencies (only allowed orgs)
    const allDeps = { ...packageJson.dependencies };
    resolveDependenciesIterative(allDeps);

    // Add package if from allowed org
    if (isFromAllowedOrg(packageJson.name)) {
        const rootDeps = Object.keys(allDeps).filter(dep => isFromAllowedOrg(dep));
        if (!packageJsonPath.startsWith('./')){ //skip root package
            graph.set(packageJson.name, rootDeps);
            resolveDependenciesIterative({ [packageJson.name]: '' });
        }
    }

    // Perform topological sort
    const sortedDeps = topologicalSort();
    return sortedDeps;
};
// Function to copy main entry point directories of sorted packages to dist
function copyPackages(sortedPackages, distPath = './dist/libs') {
    // Ensure dist directory exists
    if (!Fs.existsSync(distPath)) {
        Fs.mkdirSync(distPath, { recursive: true });
    }

    for (const pkgName of sortedPackages) {
        // Read package.json from node_modules
        const pkgJsonPath = Path.join(RootDir, 'node_modules', pkgName, 'package.json');
        let pkgJson;
        try {
            const pkgJsonContent = Fs.readFileSync(pkgJsonPath, 'utf8');
            pkgJson = JSON.parse(pkgJsonContent);
        } catch (error) {
            console.warn(`Failed to read ${pkgJsonPath}: ${error.message}`);
            continue;
        }

        // Get main entry point
        const main = pkgJson.plugin || pkgJson.main || 'index.js'; // Default to index.js if main is missing
        const mainPath = Path.join(RootDir, 'node_modules', pkgName, main);        
        let mainDir = Path.dirname(mainPath); // Directory containing main file
        if (!mainPath.endsWith('.js'))
            mainDir = mainPath;
        // Verify main directory exists
        if (!Fs.existsSync(mainDir)) {
            console.warn(`Main entry point directory ${mainDir} does not exist for ${pkgName}`);
            continue;
        }

        // Extract org and package name (e.g., @ijstech/core -> org: ijstech, name: core)
        const match = pkgName.match(/^@([^\/]+)\/(.+)$/);
        if (!match) {
            console.warn(`Invalid package name format for ${pkgName}`);
            continue;
        }
        const [, org, pkgPart] = match;

        // Destination path: dist/<package-name>/
        const destDir = Path.join(distPath, `@${org}`, pkgPart);

        // Copy main directory to dist
        try {
            // Remove existing destination directory if it exists
            if (Fs.existsSync(destDir)) {
                Fs.rmSync(destDir, { recursive: true, force: true });
            }
            // Create parent directories if needed
            Fs.mkdirSync(Path.dirname(destDir), { recursive: true });
            // Copy directory
            Fs.cpSync(mainDir, destDir, { recursive: true });
        } catch (error) {
            console.warn(`Failed to copy ${mainDir} to ${destDir} for ${pkgName}: ${error.message}`);
        }
    }
};

async function copyDir(source, target, ignoreFiles) {    
    let files = Fs.readdirSync(source);
    files.forEach(async function (file) {
        if (ignoreFiles && ignoreFiles.includes(file))
            return;
        if (Fs.lstatSync(Path.join(source, file)).isDirectory())
            Fs.cpSync(Path.join(source, file), Path.join(target, file), {recursive: true})
        else
            Fs.copyFileSync(Path.join(source, file), Path.join(target, file))
    });
};
async function getLocalPackagePath(name) {
    if (name[0] != '/')
        name = Path.dirname(require.resolve(name));
    let path = Path.dirname(name);
    if (path && path != '/') {
        try {
            let stat = Fs.statSync(Path.join(name, 'package.json'));
            if (stat.isFile())
                return name;
            else
                return getLocalPackagePath(path);
        }
        catch (err) {
            return getLocalPackagePath(path);
        }
        ;
    }
    else
        return '';
};
function addGitIgnore(targetPath = '') {
    let gitignorePath = targetPath ? Path.join(targetPath, '.gitignore') : Path.join(RootDir, '.gitignore');
    if (!Fs.existsSync(gitignorePath)) {
        Fs.writeFileSync(gitignorePath, '/node_modules/\n/package-lock.json');
    }
};
function addNpmIgnore() {
    let npmignorePath = Path.join(RootDir, '.npmignore');
    if (!Fs.existsSync(npmignorePath)) {
        Fs.writeFileSync(npmignorePath, '/src\n/test');
    }
};
function resolveFilePaths(filenames) {
    return filenames.map(filename => 
        Path.resolve(RootDir, filename)
    );
};
async function main(){
    let args = process.argv.slice(2);
    if (args[0] == 'test'){
        args = process.argv.slice(3);
        if (args.length === 0) {
            console.error('Please provide a TypeScript file or pattern (e.g., "*.test.ts") to run');
            process.exit(1);
        };
        args = resolveFilePaths(args);
        const {runTsFile} = require('./tsRunner');
        runTsFile(args);
    }
    else if (args[0] == 'bundle'){
        if (args[1] == 'site' || args[1] == 'docs') {
            try {
                const sortedDeps = getSortedDependencies('./package.json');
                let scconfig = JSON.parse(Fs.readFileSync('./scconfig.json'));
                let versionDir = '';
                if (scconfig.version && scconfig.bundle)
                    versionDir = scconfig.version;
                let entrypoint = scconfig.entrypoint || 'data';                
                if (versionDir){
                    scconfig.entrypoint = versionDir + '/' + entrypoint;
                    copyPackages(sortedDeps, `./dist/${versionDir}/libs`);
                    Fs.cpSync(`./${entrypoint}`, `./dist/${versionDir}/${entrypoint}`, { recursive: true });
                }
                else{
                    scconfig.entrypoint = entrypoint;
                    copyPackages(sortedDeps, './dist/libs');
                    Fs.cpSync(`./${entrypoint}`, `./dist/${entrypoint}`, { recursive: true });
                }
                let meta = '';
                if (scconfig.meta){
                    for (let n in scconfig.meta){
                        if (n == 'favicon'){
                            let value = scconfig.meta[n];
                            value = `${versionDir}/${value}`;
                            meta += `  <link rel="icon" href="${value}">\n`
                        }
                        else if (n == 'title')
                            meta += `  <title>${scconfig.meta[n]}</title>\n`
                        else if (n == 'charset')
                            meta += `  <meta charset="${scconfig.meta[n]}">\n`
                        else if (n.indexOf(':') < 0)
                            meta += `  <meta name="${n}" content="${scconfig.meta[n]}">\n`
                        else
                            meta += `  <meta property="${n}" content="${scconfig.meta[n]}">\n`
                    };
                };     
                const pkgJsonPath = Path.join(RootDir, 'node_modules', '@ijstech/components/dist', 'scconfig.json');
                try {
                    const pkgJsonContent = Fs.readFileSync(pkgJsonPath, 'utf8');
                    const pkgJson = JSON.parse(pkgJsonContent);
                    SiteTemplate = SiteTemplate.replace('{{sri}}', pkgJson.hash);

                } catch (error) {
                    console.warn(`Failed to read ${pkgJsonPath}: ${error.message}`);
                }                    
                SiteTemplate = SiteTemplate.replace('{{meta}}', meta);
                SiteTemplate = SiteTemplate.replaceAll('{{rootDir}}', versionDir?versionDir+'/':'');
                Fs.writeFileSync('./dist/index.html', SiteTemplate);
                Fs.writeFileSync(`./dist/${versionDir?versionDir+'/':''}scconfig.json`, JSON.stringify(scconfig, null, 4));
            } catch (error) {
                console.error(error.message);
            }
        }
        else if (args[1] == 'deployer'){
            let packageJson = JSON.parse(Fs.readFileSync(Path.join(RootDir, 'package.json')));
            let packagePath = Path.dirname(require.resolve('@scom/contract-deployer'));
            let deployerPath = Path.join(RootDir, 'deployer');
            Fs.mkdirSync(deployerPath, {recursive: true});            
            await copyDir(packagePath, deployerPath);
            Fs.mkdirSync(Path.join(deployerPath, 'libs', packageJson.name), {recursive: true});
            let scconfig = JSON.parse(Fs.readFileSync(Path.join(packagePath, 'scconfig.json')));
            scconfig.contract = packageJson.name;
            scconfig.dependencies[packageJson.name] = '*';
            Fs.writeFileSync(Path.join(deployerPath, 'scconfig.json'), JSON.stringify(scconfig, null, 4));
            Fs.copyFileSync(Path.join(RootDir, 'dist/index.js'), Path.join(deployerPath, 'libs', packageJson.name + '/index.js'))
        } else if (args[1] == 'worker'){
            let scconfig = JSON.parse(Fs.readFileSync(Path.join(RootDir, 'scconfig.json')));
            let distDir = Path.join(RootDir, scconfig.distDir || 'dist');
            let srcDir = scconfig.src || 'src';
            if (scconfig.configurator) {
                let path = await getLocalPackagePath(scconfig.configurator);
                if (path) {
                    let pack = JSON.parse(Fs.readFileSync(Path.join(path, 'package.json'), 'utf8'));
                    let distFile = pack.plugin || pack.browser;
                    if (distFile && distFile.endsWith('.js')){
                        Fs.mkdir(Path.join(distDir, scconfig.configurator), {recursive: true});
                        Fs.copyFileSync(Path.join(path, distFile), Path.join(distDir, scconfig.configurator, 'index.js'))
                    }
                    else
                        Fs.cpSync(Path.join(path, 'dist'), Path.join(distDir, scconfig.configurator), {recursive: true});
                }
            }
            copyDir(Path.join(RootDir, srcDir), Path.join(distDir, srcDir));
            Fs.copyFileSync(Path.join(RootDir, 'scconfig.json'), Path.join(distDir, 'scconfig.json'));
            if (Fs.existsSync(Path.join(RootDir, 'scconfig.schema.json'))) {
                Fs.copyFileSync(Path.join(RootDir, 'scconfig.schema.json'), Path.join(distDir, 'scconfig.schema.json'));
            }
        }
    }
    else if (args[0] == 'init'){
        if (args[1] == 'site'){
            copyDir(Path.join(__dirname, 'templates/site'), RootDir);
            addGitIgnore();
        }
        else if (args[1] == 'lib'){
            copyDir(Path.join(__dirname, 'templates/lib'), RootDir);
            addGitIgnore();
            addNpmIgnore();
        }
        else if (args[1] == 'worker'){
            copyDir(Path.join(__dirname, 'templates/worker'), RootDir);
            addGitIgnore();
            addNpmIgnore();
        }
        else if (args[1] == 'router'){
            copyDir(Path.join(__dirname, 'templates/router'), RootDir);
            addGitIgnore();
            addNpmIgnore();
        }
        else if (args[1] == 'contract'){
            copyDir(Path.join(__dirname, 'templates/contract'), RootDir);
            addGitIgnore();
            addNpmIgnore();
        }
        else if (args[1] == 'dapp'){
            copyDir(Path.join(__dirname, 'templates/dapp'), RootDir);
        }
        else if (args[1] == 'docs') {
            const targetPath = Path.join(RootDir, 'docs');
            const sourcePath = Path.join(__dirname, 'templates/docs');
            if (!Fs.existsSync(targetPath)) {
                Fs.mkdirSync(targetPath);
                copyDir(sourcePath, targetPath)
            } else {
                const ignoreFiles = ['scconfig.json', 'data'];
                copyDir(sourcePath, targetPath, ignoreFiles)
            }
            addGitIgnore(targetPath);
        }
        let packPath = Path.join(RootDir, 'package.json');
        if (args[2] && Fs.existsSync(packPath)){
            let pack = JSON.parse(Fs.readFileSync(packPath));
            pack.name = args[2];
            Fs.writeFileSync(packPath, JSON.stringify(pack, null, 4));
        };
    }    
    else if (args[0] == 'serve'){
        let serve = require('./serve');
        let scconfig = JSON.parse(Fs.readFileSync('./scconfig.json'));
        serve(args[1] || 8080, args[2] || 'dist', args[3], scconfig);
    };
};
main();