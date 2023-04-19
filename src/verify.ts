import { getOctokit } from "@actions/github"
import * as core from "@actions/core"

// Look for inputs provided by user via workflow_dispatch event
export function verifyName(repoName: string, template: string) {
  core.info(`> Checking name provided (${repoName})`)
  var regex = new RegExp("^" + template + "-[a-z0-9-]*$")
  if (!repoName.match(regex)) {
    throw new Error(
      `Repository name provided (${repoName}) is invalid. Pattern allowed: ${template}-[a-z0-9-]+`
    )
  }
  core.info("[OK] Repository name valid")
}

export async function verifyExistence(
  repoName: string,
  repoOwner: string,
  token: string
) {
  const octokit = getOctokit(token)

  core.info(`> Verifying ${repoName} existence`)
  try {
    await octokit.rest.repos
      .get({
        owner: repoOwner,
        repo: repoName
      })
      .then((res) => {
        // If request is successfull it means the repository exists. So let's make the user aware
        throw Error(
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
      throw err
    }
  }

  core.info("[OK] Repository space available")
}
