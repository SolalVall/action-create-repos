import { getOctokit, context } from "@actions/github"
import * as core from "@actions/core"

export async function createRepo(
  owner: string,
  repoName: string,
  personalUse: string,
  token: string
) {
  const octokit = getOctokit(token)

  if (personalUse === "true") {
    await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: true,
      auto_init: true
    })
  } else {
    await octokit.rest.repos.createInOrg({
      org: owner,
      name: repoName,
      auto_init: true
    })
  }
}

export async function pushTemplate(
  owner: string,
  repoName: string,
  templateTree: any,
  token: string
) {
  const octokit = getOctokit(token)
  const tRepo = "action-test-2"
  const bRepo = "actions"
  const template = "gh-action"
  const commitMessage = `(init) auto-generated template from ${bRepo} [template: ${template}]`
  const committerName = "SolalVall"
  const committerEmail = "solal.vallee@gmail.com"

  //console.log(bContent)
  core.info(`> Retrieving SHA for ${template} directory..`)
  const dirSHA = await getDirSHA(
    template,
    "tests/templates",
    owner,
    bRepo,
    octokit
  )

  core.info(`> Generating blobs for ${tRepo}..`)
  const blobTree = await generateBlobs(dirSHA, owner, bRepo, tRepo, octokit)

  core.info(`> Creating git tree based on blobs generated..`)
  const treeSHA = await createTree(owner, tRepo, blobTree, octokit)

  core.info(`> Generating new commit for ${tRepo}`)
  const commitSHA = await createCommit(
    owner,
    tRepo,
    treeSHA,
    commitMessage,
    committerName,
    committerEmail,
    octokit
  )

  core.info(`> Push commit to ${tRepo}`)
  await pushChanges(owner, tRepo, commitSHA, octokit)
}

async function getDirSHA(
  templateName: string,
  templatePath: string,
  owner: string,
  repo: string,
  octokit: any
) {
  // First we get the git content of our template repository
  const repoContent = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: templatePath,
    ref: "main"
  })

  // Filter API response to the template provided (template <=> directory in the repository)
  let dirContent = repoContent.data.find(
    (dir: any) => dir.name === templateName
  )

  if (dirContent === undefined) {
    throw new Error(`Cannot find directory named: ${templateName}`)
  }

  core.debug(`API details about ${templateName}: ${JSON.stringify(dirContent)}`)
  core.info(
    `[OK] Git SHA for ${templateName} successfully retrieved. (value: ${dirContent.sha})`
  )
  return dirContent.sha
}

async function generateBlobs(
  tree_sha: string,
  owner: string,
  currentRepo: string,
  targetRepo: string,
  octokit: any
) {
  // First we get the git tree content based on the directory SHA retrieved for our template
  var templateTree = await octokit.rest.git.getTree({
    owner,
    repo: currentRepo,
    tree_sha,
    recursive: "yes"
  })

  // Then:
  // 1. Retrieve all the 'blob' from that directory (blob <=> actual file in git)
  // 2. Recreate the 'blob' but using a different repo as the target (SHA generated will be different)
  const promises = templateTree.data.tree.map(async (file: any) => {
    if (file["type"] == "blob") {
      // Retrieve 'blob'
      var templateBlob = await octokit.rest.git.getBlob({
        owner,
        repo: currentRepo,
        file_sha: file["sha"]
      })

      // Recreate 'blob' by targeting our new repository
      var newBlob = await octokit.rest.git.createBlob({
        owner,
        repo: targetRepo,
        content: templateBlob.data.content,
        encoding: "base64"
      })

      // Return new 'blob' content. Will be used to create a new git tree
      core.info(`[OK] blob for ${file["path"]} successfully created.`)
      return {
        path: file["path"],
        mode: file["mode"],
        type: file["type"],
        sha: newBlob.data.sha
      }
    }
  })

  // Dynamically populate our new blob tree
  const tree = await Promise.all(promises)
  const cleanedTree = tree.filter((item) => item)
  return cleanedTree
}

async function createTree(
  owner: string,
  repo: string,
  tree: any,
  octokit: any
) {
  var targetTree = await octokit.rest.git.createTree({
    owner,
    repo,
    tree
  })
  core.info(`[OK] Tree generated for ${repo}. (SHA: ${targetTree.data.sha})`)
  core.debug(`API git tree response ${JSON.stringify(targetTree)}`)
  return targetTree.data.sha
}

async function createCommit(
  owner: string,
  repo: string,
  tree: string,
  message: string,
  name: string,
  email: string,
  octokit: any
) {
  var commitSHA = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree,
    name,
    email
  })
  core.info(`[OK] Commit successfully created. (SHA: ${commitSHA.data.sha})`)
  core.debug(`API git commit response: ${JSON.stringify(commitSHA)}`)
  return commitSHA.data.sha
}

async function pushChanges(
  owner: string,
  repo: string,
  sha: string,
  octokit: any
) {
  var pushContent = await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha,
    force: true
  })
  core.debug(`API git push response: ${JSON.stringify(pushContent)}`)
  core.info(`[OK] ${repo} updated: https://github.com/${owner}/${repo})`)
}
