import fs from 'fs';
import { listDirectory } from './lib/listDirectory';
import { findChangeSet } from './lib/findChangeSet';


const path = 'vendor/silverstripe/';

if (!fs.existsSync(path)) {
    console.error(`could not find ${path}`);
    process.exit(1);
}

let modules = listDirectory(path).map(modulePath => path + modulePath);

if (fs.existsSync('vendor/cwp')) {
    modules = modules.concat(
        listDirectory('vendor/cwp').map(modulePath => 'vendor/cwp/' + modulePath)
    );
}

if (fs.existsSync('vendor/dnadesign')) {
    modules = modules.concat(
        listDirectory('vendor/dnadesign').map(modulePath => 'vendor/dnadesign/' + modulePath)
    );
}

if (fs.existsSync('vendor/symbiote')) {
    modules = modules.concat(
        listDirectory('vendor/symbiote').map(modulePath => 'vendor/symbiote/' + modulePath)
    );
}


modules
    .map(findChangeSet)
    .forEach(promise => {
        promise.then(({path, results}) => {
            console.log('# ' + path);
            for (const key in results) {
                const commits = results[key];
                console.log(`* ${key}` + (commits.length === 0 ? `: all up-to-date`: ''));
                commits.forEach(commit => console.log(`  * ${commit}`))
            }
            console.log('');
        })
        .catch(() => {});
    });
