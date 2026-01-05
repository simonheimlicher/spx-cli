/**
 * spx Custom ESLint Rules
 *
 * Custom ESLint rules for proper BDD test behavior.
 */

import noBddTryCatchAntiPattern from "./no-bdd-try-catch-anti-pattern";

const eslintRules = {
  meta: {
    name: "eslint-plugin-spx",
    version: "0.1.0",
    namespace: "spx",
  },
  rules: {
    "no-bdd-try-catch-anti-pattern": noBddTryCatchAntiPattern,
  },
};

export default eslintRules;
