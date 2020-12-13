import {Command, flags} from '@oclif/command'
import { Octokit } from '@octokit/rest';
import {data as ssData} from 'silverstripe-cms-meta';
import { Throttle } from './Throttle';

interface RepoKey {
  owner: string
  repo: string
}


class Mergeup extends Command {

  private octokit = new Octokit({ });

  private throttle = new Throttle(40);

  static description = 'describe the command here'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    token: flags.string({char: 't', description: 'GitHub Token'}),
    needMergeOnly: flags.boolean({description: 'Only show module and branches with outstanding commit to merge up.'}),
    commits: flags.boolean({char: 'c', description: 'Show commits'}),
    filter: flags.string({char: 'f', description: 'Filter by module name'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Mergeup)

    const {token, commits, needMergeOnly, filter} = flags;

    if (token || process.env.TRAVIS_TOKEN) {
      this.octokit = new Octokit({
        auth: token ?? process.env.TRAVIS_TOKEN
      });
    }
    
    this.getSupportedRepos()
    .filter(filter ? (module => module.repo.indexOf(filter) > -1) : () => true)
    .forEach((entry) => {
      const matches = entry.repo.match(/^(.+)\/(.+)$/);
      if (matches === null) {
        return
      }

      const org = matches[1];
      const repo = matches[2];

      this.getBranches(org, repo)
      .then((branches) => this.findMergeUps(org, repo, branches))
      .then((compares) => {
        if (needMergeOnly && !compares.find( compare => compare?.ahead_by !== undefined &&  compare.ahead_by > 0)) {
          return;
        }

        this.log(`# ${entry.repo}`);
        compares.forEach((compare) => {
          if (compare === null || compare.ahead_by === 0) {
            return;
          }
          this.log(`* ${compare.base}...${compare.head}: a head by ${compare.ahead_by}`);
          commits && compare.commits.forEach((commit) => {
            this.log(`  * ${commit.commit.author?.name} - ${commit.commit.message.split('\n')[0]}`);
          })
        })
        this.log();
      }).catch(() => {
        this.error(`# Failed for ${entry.repo}`)
      });
    });
    
  }

  public getSupportedRepos() {
    return ssData.filter(repo => !!repo.supported);
  }

  public defaultBranch(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.get({owner, repo}))
      .then(( {data} ) => {
        return data.default_branch;
      });
  }

  public getBranches(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.listBranches({owner, repo}))
      .then(( {data} ) => (
        data.map(({name}) => name)
        .filter(name => name === 'master' || name === 'main' || name.match(/^\d+(\.\d+)?$/))
        .sort(this.sortBranches)
      ));
  }

  public sortBranches(a: string, b: string) {
    if (a === b) {
      return 0;
    }

    if (a === 'master' || a === 'main') {
      return 1;
    }

    if (b === 'master' || b === 'main') {
      return -1;
    }

    const aMatch = a.match(/^(\d+)(\.\d+)?$/);
    const bMatch = b.match(/^(\d+)(\.\d+)?$/);

    if (!aMatch || !bMatch) {
      throw 'Invalid branch name should have been filtered';
    }

    const aMajor = Number.parseInt(aMatch[1]);
    const bMajor = Number.parseInt(bMatch[1]);
    if (aMajor > bMajor) {
      return 1;
    }
    if (aMajor < bMajor) {
      return -1;
    }

    const aMinor = aMatch[2] ? Number.parseInt(aMatch[2].replace('.', '')) : 9999999;
    const bMinor = bMatch[2] ? Number.parseInt(bMatch[2].replace('.', '')) : 9999999;
    if (aMinor > bMinor) {
      return 1;
    }
    if (aMinor < bMinor) {
      return -1;
    }

    return 0;
  };

  public findMergeUps(owner: string, repo: string, branches: string[]) {

    let head = branches.shift();
    if (!head) {
      return [];
    }
    let base: string|undefined;
    let comparePromises = [];

    while (base = branches.shift()) {
      if (this.isComparable(head, base)) {
        comparePromises.push(this.compare(owner, repo, head, base));
      }
      head = base;
    }

    return Promise.all(comparePromises);
  }

  public isComparable(head: string, base: string) {
    if (['master', 'main'].indexOf(base) > -1) {
      return false;
    }

    const headMatches = head.match(/^(\d+)/);
    const baseMatches = base.match(/^(\d+)/);
    return headMatches && baseMatches && headMatches[1] === baseMatches[1];
  }

  public compare(owner:string, repo:string, head:string, base:string) {
    return this.throttle.throttle(() => this.octokit.repos.compareCommits({owner, repo, base, head}))
      .then(({data: {ahead_by, commits, html_url}}) => ({
        base, head, ahead_by, commits, html_url
      }))
      .catch((error) => {
        this.error(error);
        return null
      });
  }
}



export = Mergeup
