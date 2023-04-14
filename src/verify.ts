import { getOctokit } from '@actions/github'
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

  return inputValue
}

export async function verifyRepository(repoName: string, token: string) {
  const octokit = getOctokit(token)

  try {
    await octokit.rest.repos
      .get({
        owner: 'SolalVall',
        repo: repoName
      })
      .then((res) => {
        // If promise is successfull it means the repository exists. So let's make the user aware
        throw new Error(
          `Repository name provided (${repoName}) already exists in`
        )
      })
      .catch((err) => {
        core.info('heyy')
        core.debug(`Response body: ${err}`)
        // We continue only when the repository does not exists
        if (err.status == 404) {
          return
        } else {
          throw err
        }
      })
  } catch (err) {
    if (err instanceof Error) {
      core.error(err.message)
    }
  }
}
