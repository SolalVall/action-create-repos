import * as core from '@actions/core'
import { getOctokit, context } from '@actions/github'

// Skeleton
;(async function main() {
  try {
    // WRITE ACTION CODE HERE
    core.info(`Hello world from ${context.repo.repo}`)
  } catch (error) {
    core.setFailed((<any>error).message)
  }
})()
