import * as core from "@actions/core"
import { getOctokit, context } from "@actions/github"
import { verifyInput, verifyRepository } from "./verify"
import { createRepo, pushTemplate } from "./create"

const org: string = context.repo.owner
const token: string = core.getInput("github_token")
const is_personal: string = core.getInput("personal_use")

// Skeleton
;(async function main() {
  try {
    // Verification steps
    const repo: string = verifyInput("repo_input", core.getInput("repo_name"))
    //await verifyRepository(repo, org, token)
    //await verifyTemplateRepo(templateRepository, org, token)
    // Create repository
    //await createRepo(org, repo, is_personal, token)
    pushTemplate(org, repo, {}, token)
  } catch (error) {
    core.setFailed((<any>error).message)
  }
})()
