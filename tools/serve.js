const http = require('http');
const fs = require('fs');
const Path = require('path');
const RootDir = process.cwd();

async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};
async function readDir(path) {
    return new Promise((resolve, reject) => {
        fs.readdir(path, { withFileTypes: true }, (err, files) => { 
            if (err) reject(err);
            else resolve(files);
        });
    });
};
async function getDevData(path) {
    let result = {};
    let files = await readDir(path);
    for (let file of files) {
        if (file.isDirectory()) {
            let r = await getDevData(Path.join(path, file.name));
            for (let name in r) {
                result[file.name + '/' + name] = r[name];
            }
        }
        else {
            if (file.name.endsWith('.json')){
                result[file.name] = await readFile(Path.join(path, file.name))
            }
        }
    };
    return result;
};
async function checkPath(path, distPath){
    const dist = await readDir(distPath);
    let inDist = false;

    for (let file of dist){
        const fileName = file.name;
        if (path.startsWith(`/${fileName}`)) {
            inDist = true;
            break;
        }
    }

    return inDist;
}
let devData = {};
module.exports = async function(port, distPath, devDataPath, scconfig){
    port = port || 8080;
    if (!distPath)
        distPath = Path.resolve(RootDir, './dist')
    if (!distPath.startsWith('/'))
        distPath = Path.resolve(RootDir, distPath);
    if (devDataPath){
        devDataPath = Path.resolve(RootDir, devDataPath);
        devData = await getDevData(devDataPath);
    };
    http.createServer(async function (request, response) {    
        var url = request.url;
        var filePath;
        let files = url.split('/');
        const useHash = scconfig.useHashRouting ?? true;
        const inDist = await checkPath(url, distPath);
        if (url == '/' || (!useHash && !inDist)) {
            filePath = Path.join(distPath, useHash ? files[1] || 'index.html' : 'index.html');
        }
        else
            filePath = Path.join(distPath, url);   
        filePath = Path.resolve(filePath);
        
        if (!filePath.startsWith(distPath)){
            response.writeHead(404, { 'Content-Type': 'text/html' });
            return response.end('404 not found!', 'utf-8');
        };
        var extname = String(Path.extname(filePath)).toLowerCase();
        var mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.wasm': 'application/wasm'
        };
    
        var contentType = mimeTypes[extname] || 'application/octet-stream';
    
        fs.readFile(filePath, async function(error, content) {
            if (error) {
                console.dir('File not found: ' + request.url);
                if(error.code == 'ENOENT'){
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end('404 not found!', 'utf-8');
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                }
            }
            else {
                if (devDataPath && filePath.endsWith('index.html')){
                    content = content.toString().replace('</head>', `<script>application.dev={paths:${JSON.stringify(devData)}}</script></head>`);
                }
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    
    }).listen(port);
    console.log(`Server running at http://localhost:${port}`);
}