import * as core from '@actions/core';
import * as github from '@actions/github'

(async function main() {
    try {
        core.info('Create new action');
    } catch (error) {
        core.setFailed((<any>error).message);
    }
})();