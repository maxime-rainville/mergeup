import {Command, flags} from '@oclif/command'
import * as Config from '@oclif/config';
import { Octokit } from '@octokit/rest';
import {data as ssData} from 'silverstripe-cms-meta';
import {components} from "@octokit/openapi-types";
import { Throttle } from './Throttle';

const removeNulls = <S>(value: S | undefined | null): value is S => value != null && value !== undefined;

/**
 * Result of comparaison between two branches
 */
interface Compare {
  base: string
  head: string;
  html_url: string;
  ahead_by: number;
  commits: (components["schemas"]["commit"])[]
}

/**
 * An entry for a module with all it's comparaison branch.
 */
interface CompareEntry {
  repo: string,
  compares: Compare[]
}

class Mergeup extends Command {

  private octokit = new Octokit({ });

  private throttle = new Throttle(10);

  static description = 'Display Silverstripe module that have outstanding commits to merge up'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    token: flags.string({char: 't', description: 'GitHub Token'}),
    needMergeOnly: flags.boolean({description: 'Only show module and branches with outstanding commit to merge up.', default: false}),
    commits: flags.boolean({char: 'c', description: 'Show commits', default: false}),
    filter: flags.string({char: 'f', description: 'Filter by module name'}),
    output: flags.enum({char: 'o', options: ['pretty', 'json'], default: 'pretty', description: 'Control the output format'}),
    supportedOnly: flags.boolean({default: false, description: 'Limit results to supported module'}),
  }

  static args = [{name: 'file'}]

  constructor(argv: string[], config: Config.IConfig) {
    super(argv, config);
    this.prettyOutput = this.prettyOutput.bind(this)
    this.jsonOutput = this.jsonOutput.bind(this)
  }

  async run() {
    const {args, flags} = this.parse(Mergeup)

    const {token, commits: showCommits, needMergeOnly, filter, output, supportedOnly} = flags;

    // Init the GitHub Rest client
    if (token || process.env.TRAVIS_TOKEN) {
      this.octokit = new Octokit({
        auth: token ?? process.env.TRAVIS_TOKEN
      });
    }

    // Fetch merges UP from GitHub
    const dataFetches = this.getRepos(supportedOnly)
      // Filter module by name
      .filter(filter ? (module => module.repo.indexOf(filter) > -1) : () => true)
      .map((entry) => {
        // Split the module name in org and repo
        const matches = entry.repo.match(/^(.+)\/(.+)$/);
        if (matches === null) {
          return;
        }
        const org = matches[1];
        const repo = matches[2];

        // Fetch branch data for this repo
        return this.getBranches(org, repo)
          .then((branches) => this.findMergeUps(org, repo, branches))
          .then(compares => compares.filter(removeNulls))
          .then((compares) => ({repo: entry.repo, compares}))
          .catch(() => {
            this.error(`# Failed for ${entry.repo}`)
          });
      })

    // Pick an output function
    const outCallback = output === 'json' ? this.jsonOutput : this.prettyOutput;

    // Print out the result
    Promise.all(dataFetches).then((data) => outCallback(data.filter(removeNulls), needMergeOnly, showCommits))
  }

  /**
   * Retrieve a list of module to query.
   * @param supportedOnly
   */
  public getRepos(supportedOnly: boolean) {
    return supportedOnly ? ssData.filter(repo => !!repo.supported) : ssData;
  }

  /**
   * Get the default branch for this repo.
   * @param owner
   * @param repo
   */
  public defaultBranch(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.get({owner, repo}))
      .then(( {data} ) => {
        return data.default_branch;
      });
  }

  /**
   * Get a list of branches matching our release approach sorting from the lowest version te the highest version.
   * @param owner
   * @param repo
   */
  public getBranches(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.listBranches({owner, repo}))
      .then(( {data} ) => (
        data.map(({name}) => name)
        .filter(name => name === 'master' || name === 'main' || name.match(/^\d+(\.\d+)?$/))
        .sort(this.sortBranches)
      ));
  }

  /**
   * Combare two branch names
   * @param a
   * @param b
   */
  public sortBranches(a: string, b: string) {
    // Two branches are equal
    if (a === b) {
      return 0;
    }

    // Main/Master are implicitely the top branch
    if (a === 'master' || a === 'main') {
      return 1;
    }

    if (b === 'master' || b === 'main') {
      return -1;
    }

    // Break down the branch into their sub components
    const aMatch = a.match(/^(\d+)(\.\d+)?$/);
    const bMatch = b.match(/^(\d+)(\.\d+)?$/);

    if (!aMatch || !bMatch) {
      throw 'Invalid branch name should have been filtered';
    }

    // Compare the major version
    const aMajor = Number.parseInt(aMatch[1]);
    const bMajor = Number.parseInt(bMatch[1]);
    if (aMajor > bMajor) {
      return 1;
    }
    if (aMajor < bMajor) {
      return -1;
    }

    // If the branch doesn't have minor part, assume a gigantic value. eg: `4` is always going to be bigger than 4.12345
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

  /**
   * Given a list of branches, find all the ones needing to be merge up.
   * @param owner
   * @param repo
   * @param branches Branches need to be sorted
   */
  public findMergeUps(owner: string, repo: string, branches: string[]) {
    // Initialise the first comparasion
    let head = branches.shift();
    if (!head) {
      return [];
    }
    let base: string|undefined;
    let comparePromises = [];

    // Keep looping until we don't have any branch left
    while (base = branches.shift()) {
      // Check if `head` is meant to be merge into `base`
      if (this.isComparable(head, base)) {
        // If it is ask GitHub to compare them, to see if there's anf outstanding commits
        comparePromises.push(this.compare(owner, repo, head, base));
      }

      // The base becomes the HEAD for the next pass
      head = base;
    }

    return Promise.all(comparePromises);
  }

  /**
   * Check if HEAD can be merge into BASE. This method assumes that the branches are provided in a sequential order.
   * @param head
   * @param base
   */
  public isComparable(head: string, base: string) {
    // Master/main will always be the last branch because they have the higest priority.
    // Since we assume master to be reserved for the next minor, it should always be comparable
    if (['master', 'main'].indexOf(base) !== -1) {
      return true;
    }

    // If HEAD and BASE are on the same major release cycle, they are comparable.
    // e.g. 3.7 can not be compared to 4.0. 4.0 can be compared to 4.1 or 4.
    const headMatches = head.match(/^(\d+)/);
    const baseMatches = base.match(/^(\d+)/);
    return headMatches && baseMatches && headMatches[1] === baseMatches[1];
  }

  /**
   * Ask GitHub if they are commit in HEAD that are not in BASE
   * @param owner
   * @param repo
   * @param head
   * @param base
   */
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

  /**
   * Print the result set to the console in a pretty format smelly humans can understand
   * @param data
   * @param needMergeOnly
   * @param showCommits
   */
  public prettyOutput(data: CompareEntry[], needMergeOnly: boolean, showCommits: boolean) {
    data.forEach(({repo, compares}) => {
      if (needMergeOnly && !compares.find( compare => compare.ahead_by > 0)) {
        // Skip this module because we're not showing entries that don't have anything to merge
        return;
      }

      this.log(`# ${repo}`);
      compares.forEach((compare) => {
        if (needMergeOnly && compare.ahead_by === 0) {
          // Skip this branch because there's nothing to merge
          return;
        }
        // Show branch comparaison
        this.log(`* ${compare.base}...${compare.head}: \ta head by ${compare.ahead_by}\t ${compare.html_url}`);

        // Show commit
        showCommits && compare.commits.forEach((commit) => {
          this.log(`  * ${commit.commit.author?.name} - ${commit.commit.message.split('\n')[0]}`);
        })
      })

      this.log();
    })
  }

  /**
   * Print out the comparaison data to JSON
   * @param data
   * @param needMergeOnly
   * @param showCommits
   */
  public jsonOutput(data: CompareEntry[], needMergeOnly: boolean, showCommits: boolean) {
    const json = data
      .filter(({compares}) => !needMergeOnly || compares.find( compare => compare.ahead_by > 0))
      .map(({compares, ...rest}) => {
        return {
          ...rest,
          compares: compares.
            filter(compare => (!needMergeOnly || compare.ahead_by > 0)).
            map(({commits, html_url, ...compare}) => ( {
              ...compare,
              commits: showCommits ? (commits ? commits : []).map(({sha}) => sha) : undefined
            }))
        }
      });

    this.log(JSON.stringify(json, null, 2));
  }
}

export = Mergeup
