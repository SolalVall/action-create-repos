import * as core from '@actions/core';
import * as github from '@actions/github'

(async function main() {
    try {
        const repo: string = core.getInput('repo_name')
        core.info('Create new action named ${repo}');
    } catch (error) {
        core.setFailed((<any>error).message);
    }
})();