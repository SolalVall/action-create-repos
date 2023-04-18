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
  var bContent = await octokit.rest.repos
    .getContent({
      owner,
      repo: bRepo,
      path: "tests/templates",
      ref: "main"
    })
    .then((res) => {
      let templateSelected = "gh-action"
      let templateRepoContent = Object.values(res.data)
      core.debug(`Repository content: ${JSON.stringify(templateRepoContent)}`)

      // Filter API response for the template provided (template <=> directory in the repository)
      let dirContent = templateRepoContent.find(
        (dir) => dir.name === templateSelected
      )

      if (dirContent === undefined) {
        throw new Error(`Cannot find directory named: ${templateSelected}`)
      }

      // Return git tree SHA only for the dir provided
      core.debug(`Git tree SHA for ${templateSelected}: ${dirContent.sha}`)
      return dirContent.sha
    })

  console.log(bContent)
  //tree_sha: bTarget.data.commit.sha
  var bTree = await octokit.rest.git
    .getTree({
      owner,
      repo: bRepo,
      tree_sha: bContent,
      recursive: "yes"
    })
    .then((res) => {
      return res.data.tree
    })

  console.log(bTree)

  const promises = bTree.map(async (file: any) => {
    // I've excluded all '.github/' blob because they are getting rejected during
    // git tree creation....
    if (file["type"] == "blob" && !file["path"].startsWith(".github")) {
      var templateBlob = await octokit.rest.git.getBlob({
        owner,
        repo: bRepo,
        file_sha: file["sha"]
      })

      var newBlob = await octokit.rest.git.createBlob({
        owner,
        repo: tRepo,
        content: templateBlob.data.content,
        encoding: "base64"
      })

      return {
        path: file["path"],
        mode: file["mode"],
        type: file["type"],
        sha: newBlob.data.sha
      }
    }
  })
  const newBlobTree = await Promise.all(promises)
  const finalBlobTree = newBlobTree.filter((item) => item)

  console.log(finalBlobTree)
  var tree = await octokit.rest.git.createTree({
    owner,
    repo: tRepo,
    tree: Object(finalBlobTree)
  })

  var commitSHA = await octokit.rest.git
    .createCommit({
      owner,
      repo: tRepo,
      message: "test",
      tree: tree.data.sha,
      name: "SolalVall",
      email: "solal.vallee@gmail.com"
    })
    .then((res) => {
      return res.data.sha
    })

  octokit.rest.git.updateRef({
    owner,
    repo: "action-test-2",
    ref: "heads/main",
    sha: commitSHA,
    force: true
  })
}
