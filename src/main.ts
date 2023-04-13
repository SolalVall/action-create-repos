import * as core from '@actions/core'
import * as github from '@actions/github'
import { verifyInput, verifyRepository } from './verify'

// Skeleton
;(async function main() {
  try {
    // Verification steps
    core.info('Verifying input(s) provided..')
    const repo: string = verifyInput('repo_input', core.getInput('repo_name'))
    core.info('Verifying repository details')
    verifyRepository(repo, core.getInput('github_token'))
    core.info(`Createe new action named ${repo}`)
  } catch (error) {
    core.setFailed((<any>error).message)
  }
})()
