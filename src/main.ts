import * as core from "@actions/core"
import { context } from "@actions/github"
import { verifyName, verifyExistence } from "./verify"
import { repoCreate, repoDelete, repoPush, repoWorkflowAccess } from "./repo"

const owner: string = context.repo.owner
const token: string = core.getInput("github_token")
const is_personal: boolean = core.getInput("personal_use") === "true"
const template: string = core.getInput("template")
const templatePath: string = core.getInput("template_path")
const repoName: string = core.getInput("repo_name")
const repoDescription: string = core.getInput("repo_description")
const repoPrivate: boolean = core.getInput("repo_is_private") === "true"
const writeAccessWorkflow: boolean =
  core.getInput("repo_workflow_access") === "true"
const delRepo: boolean = core.getInput("delete_repo") === "true"

// Skeleton
;(async function main() {
  try {
    verifyName(repoName, template)
    await verifyExistence(repoName, owner, token)
    await repoCreate(
      owner,
      repoName,
      repoDescription,
      repoPrivate,
      is_personal,
      token
    )
    if (writeAccessWorkflow) {
      repoWorkflowAccess(owner, repoName, token)
    }
    await repoPush(owner, repoName, template, templatePath, token)

    // This part is only use for testing with act.
    if (delRepo) {
      await repoDelete(owner, repoName, token)
    }
  } catch (error) {
    core.setFailed((<any>error).message)
  }
})()
