import simpleGit from 'simple-git/promise';
import { StatusResult, BranchSummary } from 'simple-git/typings/response';
import { MergeUpResults } from './MergeUpResult';

export const findChangeSet = (path: string) => {

  let currentBranch: string;
  let baseBranch: string;
  let branchList: string[];

  const git = simpleGit(path);

  const findingBaseBranch = git.status().then((status: StatusResult) => {
    currentBranch = status.current;
    const matches = currentBranch.match(/^\d+/);
    if (matches) {
      baseBranch = matches[0];
      return Promise.resolve();
    }

    return Promise.reject(`${path}: ${currentBranch} is not a valid branch for a merge up`);
  });

  const findingBranchList = git.fetch('--all').then(() => {
    return git.branch(['--remotes']).then(({all}: BranchSummary) => {
      branchList = all
        .filter(branch => branch.match(/^origin\/\d+\.\d+$/))
        .map(branch => branch.replace('origin/', ''));
        
      return Promise.resolve();
    })
  });

  return Promise.all([findingBaseBranch, findingBranchList]).then(() => {
    branchList = branchList
      .filter(branch => branch.startsWith(baseBranch + '.'));
    branchList.push(baseBranch);

    const results: MergeUpResults = {};
    const comparePromises: Promise<void>[] = [];

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


    return Promise.all(comparePromises).then(() => Promise.resolve({path, results}));
  });

}