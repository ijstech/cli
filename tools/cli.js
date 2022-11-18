#!/usr/bin/env node
const Fs = require('fs');
const Path = require('path');
const RootDir = process.cwd();

async function copyDir(source, target ) {    
    let files = Fs.readdirSync(source);
    files.forEach(async function (file) {
        if (Fs.lstatSync(Path.join(source, file)).isDirectory())
            Fs.cpSync(Path.join(source, file), Path.join(target, file), {recursive: true})
        else
            Fs.copyFileSync(Path.join(source, file), Path.join(target, file))
    });
};
async function main(){
    let args = process.argv.slice(2);
    if (args[0] == 'bundle'){
        if (args[1] == 'deployer'){
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
        }
    }
    else if (args[0] == 'init'){
        if (args[1] == 'worker'){
            copyDir(Path.join(__dirname, 'templates/worker'), RootDir)
        }
        else if (args[1] == 'router'){
            copyDir(Path.join(__dirname, 'templates/router'), RootDir)
        }
        else if (args[1] == 'contract'){
            copyDir(Path.join(__dirname, 'templates/contract'), RootDir)
        }
        else if (args[1] == 'dapp'){
            copyDir(Path.join(__dirname, 'templates/dapp'), RootDir)
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
        serve(args[1] || 8080, args[2] || 'dist');
    };
};
main();