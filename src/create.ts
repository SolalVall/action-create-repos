import { getOctokit, context } from '@actions/github'

export async function createRepo(
  owner: string,
  repoName: string,
  personalUse: string,
  token: string
) {
  const octokit = getOctokit(token)

  if (personalUse === 'true') {
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

  var curatedTree = new Array()

  const promises = templateTree.map(async (file: any) => {
    if (
      file['type'] == 'blob' &&
      file['path'] != '.github/workflows/default.yaml'
    ) {
      var templateBlob = await octokit.rest.git.getBlob({
        owner,
        repo: 'repository-templates',
        file_sha: file['sha']
      })

      var newBlob = await octokit.rest.git.createBlob({
        owner,
        repo: repoName,
        content: templateBlob.data.content
      })

      //var templateBlob = await octokit.rest.git.getTree({
      //  owner,
      //  repo: 'repository-templates',
      //  tree_sha: file['sha']
      //})
      //return newBlob
      return {
        path: file['path'],
        mode: file['mode'],
        type: file['type'],
        sha: newBlob.data.sha
        //content: templateBlob.data.content
      }
    }
  })
  const newBlobTree = await Promise.all(promises)
  const finalBlobTree = newBlobTree.filter((item) => item)

  console.log(finalBlobTree)

  var newTree = await octokit.rest.git.createTree({
    owner,
    repo: repoName,
    tree: finalBlobTree
  })

  console.log(newTree)
  //console.log(newTree)
  //octokit.rest.git.createCommit({
  //  owner,
  //  repo: repoName,
  //  message: 'test',
  //  tree: curatedTree.toString()
  //})
}
