import * as core from "@actions/core"
import { verifyName } from "../../src/verify"

describe("Test repo name verification", () => {
  test("Valid name and template provided", async () => {
    const infoMock = jest.spyOn(core, "info")
    await verifyName("action-test", "action")
    expect(infoMock).toHaveBeenCalledWith("[OK] Repository name valid")
  })
})
