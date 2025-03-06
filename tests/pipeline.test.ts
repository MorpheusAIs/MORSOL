import { execSync } from "child_process";

describe("Testing Pipeline", () => {
  it("Runs all tests in sequence", () => {
    // uncomment required test file
    const testFiles = [
      // config tests
      // 'config/initialize_config.test.ts',
      // 'config/update_config.test.ts',

      // token tests
      // 'test.ts',
      "checkBridge.ts",

      // // staking tests
      // 'staking/initialize_staking.test.ts',
      // 'staking/stake_tokens.test.ts',
      // // 'staking/claim_rewards.test.ts',
      // // 'staking/stake_with_apy_change.test.ts',

      // // // referrals
      // // "referrals/apply_referral_to_account.test.ts",
      // 'referrals/create_referals.test.ts',
      // // "fetch/fetch_user_staked_account.test.ts",
      // // 'fetch/get_info.test.ts',
    ];

    for (const testFile of testFiles) {
      console.log(`Running ${testFile}...`);
      execSync(
        `pnpm ts-mocha -p ./tsconfig.json -t 1000000 tests/cases/${testFile}`,
        {
          stdio: "inherit",
        },
      );
    }

    // for (const deployFile of deployFiles) {
    //   console.log(`Running ${deployFile}...`);
    //   execSync(
    //     `yarn ts-mocha -p ./tsconfig.json -t 1000000 tests/deploy/${deployFile}`,
    //     { stdio: "inherit" }
    //   );
    // }
  });
});
