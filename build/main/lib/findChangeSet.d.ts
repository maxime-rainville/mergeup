import { MergeUpResults } from './MergeUpResult';
export declare const findChangeSet: (path: string) => Promise<{
    path: string;
    results: MergeUpResults;
}>;
