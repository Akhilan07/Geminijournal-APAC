import type { UserInteraction, JournalLocation } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
  * Validates that journal entries require a valid user UID, ID, and prompt.
  */
export function validateJournalEntry(entry: Partial<UserInteraction>): ValidationResult {
  const errors: string[] = [];

  if (!entry.userId || entry.userId.trim() === "") {
    errors.push("User UID is required and cannot be empty.");
  }

  if (!entry.id || entry.id.trim() === "") {
    errors.push("Journal Entry ID is required and cannot be empty.");
  }

  if (!entry.prompt || entry.prompt.trim() === "") {
    errors.push("Journal prompt text cannot be empty.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
  * Gracefully formats location information when coordinates are missing, zero, or partial.
  */
export function formatJournalLocation(location: JournalLocation | null | undefined): string {
  if (!location) {
    return "No location attached";
  }

  if (location.address && location.address.trim() !== "") {
    return location.address.trim();
  }

  if (location.name && location.name.trim() !== "") {
    return location.name.trim();
  }

  if (
    typeof location.lat === "number" &&
    typeof location.lng === "number" &&
    (location.lat !== 0 || location.lng !== 0)
  ) {
    return `Coordinates (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
  }

  return "Location details unavailable";
}

/**
  * Generates user-scoped Firestore path adhering to Skill Rule 2: users/{uid}/journals/{entryId}
  */
export function getFirestoreJournalPath(userId: string, entryId: string): string {
  if (!userId || !userId.trim()) {
    throw new Error("Cannot construct Firestore journal path without a valid user UID.");
  }
  if (!entryId || !entryId.trim()) {
    throw new Error("Cannot construct Firestore journal path without a valid entry ID.");
  }
  return `users/${userId.trim()}/journals/${entryId.trim()}`;
}
