/**
 * Unit tests for session timestamp utilities.
 *
 * Test Level: 1 (Unit)
 * - Pure functions with dependency injection
 * - No external dependencies
 * - Deterministic via injectable time source
 *
 * @see ADR-32 (Timestamp Format) for format specification
 */

import { describe, expect, it } from "vitest";

import { generateSessionId, parseSessionId, SESSION_ID_PATTERN, SESSION_ID_SEPARATOR } from "@/session/timestamp";

describe("generateSessionId", () => {
  it("GIVEN current time WHEN called THEN returns YYYY-MM-DD_HH-mm-ss format", () => {
    // Given: A specific point in time
    const mockDate = new Date("2026-01-13T08:01:05");

    // When: Generate session ID with injected time
    const result = generateSessionId({ now: () => mockDate });

    // Then: Returns correctly formatted ID
    expect(result).toBe("2026-01-13_08-01-05");
  });

  it("GIVEN single-digit components WHEN called THEN pads with zeros", () => {
    // Given: Date with single-digit month, day, hour, minute, second
    const mockDate = new Date("2026-01-03T09:05:07");

    // When: Generate session ID
    const result = generateSessionId({ now: () => mockDate });

    // Then: All components are zero-padded
    expect(result).toBe("2026-01-03_09-05-07");
  });

  it("GIVEN December date WHEN called THEN formats month as 12", () => {
    // Given: Date in December (month index 11)
    const mockDate = new Date("2026-12-25T23:59:59");

    // When: Generate session ID
    const result = generateSessionId({ now: () => mockDate });

    // Then: Month is correctly formatted as 12 (not 11)
    expect(result).toBe("2026-12-25_23-59-59");
  });

  it("GIVEN no options WHEN called THEN uses current time", () => {
    // When: Generate session ID without options
    const result = generateSessionId();

    // Then: Returns valid format (matches pattern from production code)
    expect(result).toMatch(SESSION_ID_PATTERN);
  });

  it("GIVEN result WHEN inspected THEN uses correct separator", () => {
    // Given: Any time
    const mockDate = new Date("2026-06-15T12:30:45");

    // When: Generate session ID
    const result = generateSessionId({ now: () => mockDate });

    // Then: Uses the defined separator between date and time
    expect(result).toContain(SESSION_ID_SEPARATOR);
    expect(result.split(SESSION_ID_SEPARATOR)).toHaveLength(2);
  });
});

describe("parseSessionId", () => {
  it("GIVEN valid ID WHEN parsed THEN returns correct Date", () => {
    // Given: Valid session ID
    const id = "2026-01-13_08-01-05";

    // When: Parse the ID
    const result = parseSessionId(id);

    // Then: Returns Date with correct components
    expect(result).toEqual(new Date(2026, 0, 13, 8, 1, 5));
  });

  it("GIVEN invalid ID WHEN parsed THEN returns null", () => {
    // When: Parse invalid format
    const result = parseSessionId("invalid-format");

    // Then: Returns null, not an exception
    expect(result).toBeNull();
  });

  it("GIVEN ID without padding WHEN parsed THEN returns null", () => {
    // Given: ID with unpadded components (violates format spec)
    const unpadded = "2026-1-3_8-1-5";

    // When: Parse unpadded ID
    const result = parseSessionId(unpadded);

    // Then: Returns null (strict format required)
    expect(result).toBeNull();
  });

  it("GIVEN empty string WHEN parsed THEN returns null", () => {
    // When: Parse empty string
    const result = parseSessionId("");

    // Then: Returns null
    expect(result).toBeNull();
  });

  it("GIVEN ID with colons WHEN parsed THEN returns null", () => {
    // Given: ISO-style format with colons (not filesystem-safe)
    const isoStyle = "2026-01-13_08:01:05";

    // When: Parse ISO-style ID
    const result = parseSessionId(isoStyle);

    // Then: Returns null (colons not allowed per ADR-32)
    expect(result).toBeNull();
  });

  it("GIVEN ID with T separator WHEN parsed THEN returns null", () => {
    // Given: ISO 8601 format with T separator
    const iso8601 = "2026-01-13T08-01-05";

    // When: Parse ISO 8601 ID
    const result = parseSessionId(iso8601);

    // Then: Returns null (must use underscore separator)
    expect(result).toBeNull();
  });

  it("GIVEN ID with invalid month WHEN parsed THEN returns null", () => {
    // Given: ID with month > 12
    const invalidMonth = "2026-13-01_08-01-05";

    // When: Parse
    const result = parseSessionId(invalidMonth);

    // Then: Returns null
    expect(result).toBeNull();
  });

  it("GIVEN ID with invalid hour WHEN parsed THEN returns null", () => {
    // Given: ID with hour > 23
    const invalidHour = "2026-01-13_25-01-05";

    // When: Parse
    const result = parseSessionId(invalidHour);

    // Then: Returns null
    expect(result).toBeNull();
  });

  it("GIVEN generated ID WHEN parsed THEN roundtrips correctly", () => {
    // Given: A specific time
    const originalDate = new Date(2026, 5, 15, 14, 30, 45); // June 15, 2026 14:30:45

    // When: Generate and parse back
    const id = generateSessionId({ now: () => originalDate });
    const parsed = parseSessionId(id);

    // Then: Roundtrip produces equivalent date
    expect(parsed).toEqual(originalDate);
  });
});

describe("SESSION_ID_PATTERN", () => {
  it("GIVEN valid session ID WHEN tested THEN matches pattern", () => {
    // Given: Various valid session IDs
    const validIds = [
      "2026-01-13_08-01-05",
      "2000-01-01_00-00-00",
      "2099-12-31_23-59-59",
    ];

    // Then: All match the exported pattern
    for (const id of validIds) {
      expect(id).toMatch(SESSION_ID_PATTERN);
    }
  });

  it("GIVEN invalid formats WHEN tested THEN pattern rejects", () => {
    // Given: Various invalid formats
    const invalidIds = [
      "invalid",
      "2026-1-13_08-01-05", // unpadded month
      "2026-01-13T08-01-05", // T separator
      "2026-01-13_08:01:05", // colons
      "2026-01-13_08-01-05-000", // extra component
    ];

    // Then: None match the pattern
    for (const id of invalidIds) {
      expect(id).not.toMatch(SESSION_ID_PATTERN);
    }
  });
});
