import { getOctokit, context } from '@actions/github'
import * as core from '@actions/core'
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'

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

export async function verifyRepository(
  repoName: string,
  repoOwner: string,
  token: string
) {
  const octokit = getOctokit(token)

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

  core.info('[OK] Repository space available')
}

export async function verifyTemplateRepo(
  templateRepoName: string,
  repoOwner: string,
  token: string
) {
  const octokit = getOctokit(token)

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

export async function getTemplateTree(
  templateRepoName: string,
  templateSelected: string,
  token: string
) {
  const octokit = getOctokit(token)
  const repoOwner = context.repo.owner

  // Retrive base SHA for dir provided
  var dirSHA = await octokit.rest.repos
    .getContent({
      owner: repoOwner,
      repo: templateRepoName,
      path: '.'
    })
    .then((res) => {
      let templateRepoContent = Object.values(res.data)
      core.debug(`Repository content: ${JSON.stringify(templateRepoContent)}`)

      // Filter API response for the template provided (template <=> directory in the repository)
      let dirContent = templateRepoContent.find(
        (dir) => dir.name === templateSelected
      )

      if (dirContent === undefined) {
        throw new Error(
          `Cannot find in ${templateRepoName} directory named: ${templateSelected}`
        )
      }

      // Return git tree SHA only for the dir provided
      core.debug(`Git tree SHA for ${templateSelected}: ${dirContent.sha}`)
      return dirContent.sha
    })

  // Get all Git objects for the dir provided. Git tree details: https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28
  var dirGitTree = await octokit.rest.git
    .getTree({
      owner: repoOwner,
      repo: templateRepoName,
      tree_sha: dirSHA,
      recursive: 'yes'
    })
    .then((res) => {
      core.debug(
        `Git tree for ${templateSelected}: ${JSON.stringify(res.data.tree)}`
      )
      return res.data.tree
    })

  return dirGitTree
}
