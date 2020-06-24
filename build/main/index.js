"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const listDirectory_1 = require("./lib/listDirectory");
const findChangeSet_1 = require("./lib/findChangeSet");
const path = 'vendor/silverstripe/';
if (!fs_1.default.existsSync(path)) {
    console.error(`could not find ${path}`);
    process.exit(1);
}
let modules = listDirectory_1.listDirectory(path).map(modulePath => path + modulePath);
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
    if (fs_1.default.existsSync(path)) {
        modules = modules.concat(listDirectory_1.listDirectory(path).map(modulePath => `${path}/${modulePath}`));
    }
});
modules
    .map(findChangeSet_1.findChangeSet)
    .forEach(promise => {
    promise.then(({ path, results }) => {
        let outputChange = !(process.env.ONLY_UPDATE);
        let output = '# ' + path + "\n";
        for (const key in results) {
            const commits = results[key];
            outputChange = outputChange || commits.length > 0;
            output += `* ${key}` + (commits.length === 0 ? `: all up-to-date` : '') + "\n";
            commits.forEach(commit => (output += `  * ${commit}` + "\n"));
        }
        output += "\n";
        if (outputChange) {
            console.log(output);
        }
    })
        .catch(() => { });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw0Q0FBb0I7QUFDcEIsdURBQW9EO0FBQ3BELHVEQUFvRDtBQUdwRCxNQUFNLElBQUksR0FBRyxzQkFBc0IsQ0FBQztBQUVwQyxJQUFJLENBQUMsWUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUN0QixPQUFPLENBQUMsS0FBSyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDbkI7QUFFRCxJQUFJLE9BQU8sR0FBRyw2QkFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsQ0FBQztBQUV2RSxNQUFNLFlBQVksR0FBRztJQUNqQixLQUFLO0lBQ0wsV0FBVztJQUNYLFVBQVU7SUFDVixtQkFBbUI7SUFDbkIsU0FBUztJQUNULGNBQWM7SUFDZCxZQUFZO0NBQ2YsQ0FBQztBQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtJQUM1QixNQUFNLElBQUksR0FBRyxVQUFVLE1BQU0sRUFBRSxDQUFDO0lBQ2hDLElBQUksWUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNyQixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FDcEIsNkJBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUNqRSxDQUFDO0tBQ0w7QUFDTCxDQUFDLENBQUMsQ0FBQTtBQUVGLE9BQU87S0FDRixHQUFHLENBQUMsNkJBQWEsQ0FBQztLQUNsQixPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFDZixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLEVBQUUsRUFBRTtRQUM3QixJQUFJLFlBQVksR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QyxJQUFJLE1BQU0sR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQyxLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRTtZQUN2QixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsWUFBWSxHQUFHLFlBQVksSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQzlFLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBSSxPQUFPLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUE7U0FDaEU7UUFDRCxNQUFNLElBQUksSUFBSSxDQUFDO1FBRWYsSUFBSSxZQUFZLEVBQUU7WUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3ZCO0lBQ0wsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDIn0=