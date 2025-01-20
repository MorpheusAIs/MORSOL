import { execSync } from "child_process";

describe("Testing Pipeline", () => {
  it("Runs all tests in sequence", () => {
    const testFiles = [
      // // init tests
      "config/initializeConfig.test.ts",
      "token/createToken.test.ts",
      "token/mintToken.test.ts",
      "token/burnToken.test.ts",
    ];

    for (const testFile of testFiles) {
      console.log(`Running ${testFile}...`);
      execSync(
        `yarn ts-mocha -p ./tsconfig.json -t 1000000 tests/cases/${testFile}`,
        { stdio: "inherit" }
      );
    }
  });
});
