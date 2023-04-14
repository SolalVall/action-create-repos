import * as core from '@actions/core'
import { getOctokit, context } from '@actions/github'
import { verifyInput, verifyRepository, verifyTemplateRepo } from './verify'

// Skeleton
;(async function main() {
  try {
    const templateRepository: string = 'repository-templates'

    // Verification steps
    const repo: string = verifyInput('repo_input', core.getInput('repo_name'))
    await verifyRepository(repo, core.getInput('github_token'))
    await verifyTemplateRepo(templateRepository, core.getInput('github_token'))
  } catch (error) {
    core.setFailed((<any>error).message)
  }
})()
