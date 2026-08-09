import { defineConfig } from "vitest/config";

const LIB_TESTS = ["src/lib/**/*.test.ts"];

// The whole product is a calendar: every lib suite runs under two timezones
// (home CDT and UTC+14) so any UTC-vs-local slip fails loudly.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "tz-chicago",
          include: LIB_TESTS,
          env: { TZ: "America/Chicago" },
        },
      },
      {
        test: {
          name: "tz-kiritimati",
          include: LIB_TESTS,
          env: { TZ: "Pacific/Kiritimati" },
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/types.ts"],
    },
  },
});
