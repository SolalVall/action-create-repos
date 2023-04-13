import { getOctokit } from '@actions/github'
import * as core from '@actions/core'

// Look for inputs provided by user via workflow_dispatch event
export function verifyInput(input_type: string, input_value: string): string {
  core.debug(`checking ${input_type} (value: ${input_value})`)
  if (input_type == 'repo_input') {
    if (!input_value.match(/^action-[a-z0-9\-]*$/)) {
      throw new Error(
        `Repository name provided (${input_value}) is invalid. Pattern allowed: action-[a-z0-9-]`
      )
    }
  }

  return input_value
}

export async function verifyRepository(repo_name: string, token: string) {
  const octokit = getOctokit(token)

  const result = await octokit.rest.repos.get({
    repo: 'SolalVall',
    owner: repo_name
  })
}
