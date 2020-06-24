import fs from 'fs';
import { listDirectory } from './lib/listDirectory';
import { findChangeSet } from './lib/findChangeSet';


const path = 'vendor/silverstripe/';

if (!fs.existsSync(path)) {
    console.error(`could not find ${path}`);
    process.exit(1);
}

let modules = listDirectory(path).map(modulePath => path + modulePath);

const otherVendors = [
    'cwp',
    'dnadesign',
    'symbiote',
    'bringyourownideas',
    'colymba',
    'tijsverkoyen',
    'tractorcow'
];

otherVendors.forEach((vendor) => {
    const path = `vendor/${vendor}`;
    if (fs.existsSync(path)) {
        modules = modules.concat(
            listDirectory(path).map(modulePath => `${path}/${modulePath}`)
        );
    }
})

modules
    .map(findChangeSet)
    .forEach(promise => {
        promise.then(({path, results}) => {
            let outputChange = !(process.env.ONLY_UPDATE);
            let output = '# ' + path + "\n";
            for (const key in results) {
                const commits = results[key];
                outputChange = outputChange || commits.length > 0;
                output += `* ${key}` + (commits.length === 0 ? `: all up-to-date`: '') + "\n";
                commits.forEach(commit => (output += `  * ${commit}` + "\n"))
            }
            output += "\n";

            if (outputChange) {
                console.log(output);
            }
        })
        .catch(() => {});
    });
