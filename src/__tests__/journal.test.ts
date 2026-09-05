import { describe, it, expect } from "vitest";
import {
  validateJournalEntry,
  formatJournalLocation,
  getFirestoreJournalPath,
} from "../lib/journalValidation";
import type { UserInteraction, JournalLocation } from "../types";

describe("Journal Entry Validation Suite", () => {
  it("requires a valid, non-empty user UID", () => {
    const invalidEntry: Partial<UserInteraction> = {
      id: "entry-123",
      userId: "",
      prompt: "Reflecting on my day...",
    };

    const result = validateJournalEntry(invalidEntry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("User UID is required and cannot be empty.");
  });

  it("passes validation when all required fields including UID are present", () => {
    const validEntry: Partial<UserInteraction> = {
      id: "entry-123",
      userId: "user-abc-456",
      prompt: "Reflecting on my day...",
    };

    const result = validateJournalEntry(validEntry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("handles missing or zero coordinates gracefully without throwing errors", () => {
    // Case 1: Location object with missing address and zero coordinates
    const missingCoordsLoc: JournalLocation = {
      lat: 0,
      lng: 0,
      address: "",
      name: "",
    };
    expect(formatJournalLocation(missingCoordsLoc)).toBe("Location details unavailable");

    // Case 2: Null / undefined location
    expect(formatJournalLocation(null)).toBe("No location attached");
    expect(formatJournalLocation(undefined)).toBe("No location attached");

    // Case 3: Valid address with missing lat/lng
    const textOnlyLoc: JournalLocation = {
      lat: 0,
      lng: 0,
      address: "Tokyo Tower, Japan",
    };
    expect(formatJournalLocation(textOnlyLoc)).toBe("Tokyo Tower, Japan");

    // Case 4: Coords present without address
    const coordsOnlyLoc: JournalLocation = {
      lat: 35.6586,
      lng: 139.7454,
      address: "",
    };
    expect(formatJournalLocation(coordsOnlyLoc)).toBe("Coordinates (35.6586, 139.7454)");
  });

  it("constructs isolated Firestore journal paths strictly under users/{uid}/journals/{entryId}", () => {
    const uid = "uid_884930";
    const entryId = "entry_992011";

    const path = getFirestoreJournalPath(uid, entryId);
    expect(path).toBe("users/uid_884930/journals/entry_992011");
  });

  it("throws an error if attempting to build a Firestore path without user UID", () => {
    expect(() => getFirestoreJournalPath("", "entry-123")).toThrow(
      "Cannot construct Firestore journal path without a valid user UID."
    );
  });
});
