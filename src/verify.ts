import { getOctokit, context } from '@actions/github'
import * as core from '@actions/core'

// Look for inputs provided by user via workflow_dispatch event
export function verifyInput(inputType: string, inputValue: string): string {
  core.debug(`checking ${inputType} (value: ${inputValue})`)
  if (inputType == 'repo_input') {
    if (!inputValue.match(/^action-[a-z0-9\-]*$/)) {
      throw new Error(
        `Repository name provided (${inputValue}) is invalid. Pattern allowed: action-[a-z0-9-]`
      )
    }
  }

  core.info('[OK] Repository name')
  return inputValue
}

export async function verifyRepository(repoName: string, token: string) {
  const octokit = getOctokit(token)
  const repoOwner = context.repo.owner

  try {
    await octokit.rest.repos
      .get({
        owner: repoOwner,
        repo: repoName
      })
      .then((res) => {
        // If request is successfull it means the repository exists. So let's make the user aware
        throw new Error(
          `Repository name provided (${repoName}) already exists in ${repoOwner}`
        )
      })
      .catch((err) => {
        core.debug(`Response body: ${err}`)
        core.debug(`Response status: ${err.status}`)
        // We continue only when the repository does not exists. <=> 404 - Not found
        if (err.status != 404) {
          throw err
        }
      })
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message)
    }
  }

  core.info('[OK] Repository space available')
}

export async function verifyTemplateRepo(
  templateRepoName: string,
  token: string
) {
  const octokit = getOctokit(token)
  const repoOwner = context.repo.owner

  await octokit.rest.repos
    .get({
      owner: repoOwner,
      repo: templateRepoName
    })
    .then((res) => {
      core.info('[OK] Repository containing templates found')
      return
    })
    .catch((err) => {
      core.debug(`Response body: ${err}`)
      core.debug(`Response status: ${err.status}`)
      // Template repo must exists for action to be successfull!
      if (err.status == 404) {
        throw new Error(
          `Template repository (${templateRepoName}) does not exists in ${repoOwner}. Please create it before continue!`
        )
      }
    })
}
