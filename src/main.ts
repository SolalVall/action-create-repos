import * as core from "@actions/core"
import { getOctokit, context } from "@actions/github"
import {
  verifyInput,
  verifyRepository,
  verifyTemplateRepo,
  getTemplateTree
} from "./verify"
import { createRepo, pushTemplate } from "./create"

const org: string = context.repo.owner
const token: string = core.getInput("github_token")
const is_personal: string = core.getInput("personal_use")
const templateRepository: string = "repository-templates"

// Skeleton
;(async function main() {
  try {
    // Verification steps
    const repo: string = verifyInput("repo_input", core.getInput("repo_name"))
    //await verifyRepository(repo, org, token)
    //await verifyTemplateRepo(templateRepository, org, token)
    // Create repository
    const templateTree: {} = await getTemplateTree(
      templateRepository,
      core.getInput("repo_template"),
      token
    )
    //await createRepo(org, repo, is_personal, token)
    pushTemplate(org, repo, templateTree, token)
  } catch (error) {
    core.setFailed((<any>error).message)
  }
})()
