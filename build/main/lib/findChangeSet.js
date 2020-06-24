"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("simple-git/promise"));
exports.findChangeSet = (path) => {
    let currentBranch;
    let baseBranch;
    let branchList;
    const git = promise_1.default(path);
    const findingBaseBranch = git.status().then((status) => {
        currentBranch = status.current;
        const matches = currentBranch.match(/^\d+/);
        if (matches) {
            baseBranch = matches[0];
            return Promise.resolve();
        }
        return Promise.reject(`${path}: ${currentBranch} is not a valid branch for a merge up`);
    });
    const findingBranchList = git.fetch('--all').then(() => {
        return git.branch(['--remotes']).then(({ all }) => {
            branchList = all
                .filter(branch => branch.match(/^origin\/\d+\.\d+$/))
                .map(branch => branch.replace('origin/', ''));
            return Promise.resolve();
        });
    });
    return Promise.all([findingBaseBranch, findingBranchList]).then(() => {
        branchList = branchList
            .filter(branch => branch.startsWith(baseBranch + '.'));
        branchList.push(baseBranch);
        const results = {};
        const comparePromises = [];
        let from = branchList.shift();
        let to;
        while (to = branchList.shift()) {
            const compare = `origin/${to}..origin/${from}`;
            results[compare] = [];
            comparePromises.push(git.log([compare]).then((logList) => {
                results[compare] = logList.all.map(log => `${log.author_name} - ${log.message}`);
                return Promise.resolve();
            }));
            from = to;
        }
        return Promise.all(comparePromises).then(() => Promise.resolve({ path, results }));
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZENoYW5nZVNldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvZmluZENoYW5nZVNldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGlFQUEyQztBQUk5QixRQUFBLGFBQWEsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFO0lBRTVDLElBQUksYUFBcUIsQ0FBQztJQUMxQixJQUFJLFVBQWtCLENBQUM7SUFDdkIsSUFBSSxVQUFvQixDQUFDO0lBRXpCLE1BQU0sR0FBRyxHQUFHLGlCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFNUIsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBb0IsRUFBRSxFQUFFO1FBQ25FLGFBQWEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQy9CLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUMsSUFBSSxPQUFPLEVBQUU7WUFDWCxVQUFVLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLGFBQWEsdUNBQXVDLENBQUMsQ0FBQztJQUMxRixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ3JELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQyxHQUFHLEVBQWdCLEVBQUUsRUFBRTtZQUM3RCxVQUFVLEdBQUcsR0FBRztpQkFDYixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7aUJBQ3BELEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFaEQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ25FLFVBQVUsR0FBRyxVQUFVO2FBQ3BCLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekQsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU1QixNQUFNLE9BQU8sR0FBbUIsRUFBRSxDQUFDO1FBQ25DLE1BQU0sZUFBZSxHQUFvQixFQUFFLENBQUM7UUFFNUMsSUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLElBQUksRUFBRSxDQUFDO1FBRVAsT0FBTyxFQUFFLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQzlCLE1BQU0sT0FBTyxHQUFHLFVBQVUsRUFBRSxZQUFZLElBQUksRUFBRSxDQUFDO1lBQy9DLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdEIsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDdkQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsV0FBVyxNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxHQUFHLEVBQUUsQ0FBQztTQUNYO1FBR0QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUMsQ0FBQztJQUNuRixDQUFDLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQSJ9