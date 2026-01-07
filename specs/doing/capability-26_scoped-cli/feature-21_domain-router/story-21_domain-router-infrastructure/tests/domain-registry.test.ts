import { clearDomains, getAllDomains, getDomain, registerDomain } from "@/domains/registry";
import type { Domain } from "@/domains/types";
import { beforeEach, describe, expect, it } from "vitest";

describe("Domain Registry", () => {
  beforeEach(() => {
    clearDomains();
  });

  describe("registerDomain", () => {
    it("GIVEN domain definition WHEN registering THEN domain is stored", () => {
      // Given: A domain definition
      const domain: Domain = {
        name: "spec",
        description: "Manage spec workflow",
        register: () => {},
      };

      // When: Registering the domain
      registerDomain(domain);

      // Then: Domain can be retrieved
      const retrieved = getDomain("spec");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("spec");
      expect(retrieved?.description).toBe("Manage spec workflow");
    });

    it("GIVEN existing domain WHEN registering duplicate THEN throws error", () => {
      // Given: A registered domain
      const domain: Domain = {
        name: "spec",
        description: "Manage spec workflow",
        register: () => {},
      };
      registerDomain(domain);

      // When/Then: Registering duplicate throws
      expect(() => registerDomain(domain)).toThrow(
        "Domain \"spec\" already registered",
      );
    });

    it("GIVEN multiple domains WHEN registering THEN all are stored", () => {
      // Given: Multiple domain definitions
      const spec: Domain = {
        name: "spec",
        description: "Manage spec workflow",
        register: () => {},
      };
      const claude: Domain = {
        name: "claude",
        description: "Manage Claude Code plugins",
        register: () => {},
      };

      // When: Registering both domains
      registerDomain(spec);
      registerDomain(claude);

      // Then: Both can be retrieved
      expect(getDomain("spec")).toBeDefined();
      expect(getDomain("claude")).toBeDefined();
      expect(getAllDomains()).toHaveLength(2);
    });
  });

  describe("getDomain", () => {
    it("GIVEN registered domain WHEN getting by name THEN returns domain", () => {
      // Given: A registered domain
      const domain: Domain = {
        name: "spec",
        description: "Manage spec workflow",
        register: () => {},
      };
      registerDomain(domain);

      // When: Getting domain by name
      const retrieved = getDomain("spec");

      // Then: Returns correct domain
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("spec");
    });

    it("GIVEN no registered domain WHEN getting by name THEN returns undefined", () => {
      // Given: Empty registry
      // When: Getting non-existent domain
      const retrieved = getDomain("nonexistent");

      // Then: Returns undefined
      expect(retrieved).toBeUndefined();
    });
  });

  describe("getAllDomains", () => {
    it("GIVEN empty registry WHEN getting all domains THEN returns empty array", () => {
      // Given: Empty registry
      // When: Getting all domains
      const domains = getAllDomains();

      // Then: Returns empty array
      expect(domains).toEqual([]);
    });

    it("GIVEN multiple domains WHEN getting all THEN returns all in array", () => {
      // Given: Multiple registered domains
      const spec: Domain = {
        name: "spec",
        description: "Manage spec workflow",
        register: () => {},
      };
      const claude: Domain = {
        name: "claude",
        description: "Manage Claude Code plugins",
        register: () => {},
      };
      registerDomain(spec);
      registerDomain(claude);

      // When: Getting all domains
      const domains = getAllDomains();

      // Then: Returns array with both domains
      expect(domains).toHaveLength(2);
      expect(domains.map((d) => d.name)).toEqual(
        expect.arrayContaining(["spec", "claude"]),
      );
    });
  });

  describe("clearDomains", () => {
    it("GIVEN registered domains WHEN clearing THEN registry is empty", () => {
      // Given: Registered domain
      const domain: Domain = {
        name: "spec",
        description: "Manage spec workflow",
        register: () => {},
      };
      registerDomain(domain);
      expect(getAllDomains()).toHaveLength(1);

      // When: Clearing domains
      clearDomains();

      // Then: Registry is empty
      expect(getAllDomains()).toHaveLength(0);
      expect(getDomain("spec")).toBeUndefined();
    });
  });
});
