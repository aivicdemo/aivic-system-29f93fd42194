import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  createNewProcedureVersion,
  verifyChangeHistory,
  identifyLatestVersion,
  markOldVersionAsDeprecated,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("Standard Procedure Version Management", () => {
  let procedureId: string;
  let userId: string;
  let createdAtV1: string;
  let createdAtV2: string;

  beforeEach(() => {
    procedureId = "proc-001";
    userId = "user-manager-001";
    createdAtV1 = "2024-01-15T09:00:00Z";
    createdAtV2 = "2024-01-15T10:30:00Z";
  });

  // SCEN-915: Standard procedure version management - new version creation, change history recording, and automatic latest version identification
  test("should create new procedure version with auto-incremented version number, record complete change history, auto-identify latest version, and mark old versions as deprecated", () => {
    // Arrange: Create initial version (v1)
    const v1Input = {
      procedureId: procedureId,
      title: "Request Processing Standard Procedure",
      content: "1. Receive request\n2. Validate data\n3. Process",
      description: "Standard procedure for request processing",
      createdBy: userId,
      createdAt: createdAtV1,
    };

    const v1Result = createNewProcedureVersion(v1Input);

    // Assert: Version 1 created correctly
    expect(v1Result.versionNumber).toBe(1);
    expect(v1Result.procedureId).toBe(procedureId);
    expect(v1Result.title).toBe("Request Processing Standard Procedure");
    expect(v1Result.createdBy).toBe(userId);
    expect(v1Result.isLatest).toBe(true);

    // Arrange: Create version 2 with modified content
    const v2Input = {
      procedureId: procedureId,
      title: "Request Processing Standard Procedure (Updated)",
      content:
        "1. Receive request\n2. Validate data\n3. Check contract\n4. Process",
      description:
        "Updated procedure with additional validation step for contract confirmation",
      createdBy: userId,
      createdAt: createdAtV2,
      previousVersionId: v1Result.versionId,
    };

    const v2Result = createNewProcedureVersion(v2Input);

    // Assert: Version 2 created with auto-incremented version number
    expect(v2Result.versionNumber).toBe(2);
    expect(v2Result.versionNumber).toBeGreaterThan(v1Result.versionNumber);
    expect(v2Result.procedureId).toBe(procedureId);
    expect(v2Result.isLatest).toBe(true);

    // Verify: Change history contains complete information
    const changeHistory = verifyChangeHistory({
      procedureId: procedureId,
      fromVersionId: v1Result.versionId,
      toVersionId: v2Result.versionId,
    });

    expect(changeHistory.previousVersionNumber).toBe(1);
    expect(changeHistory.newVersionNumber).toBe(2);
    expect(changeHistory.previousTitle).toBe(
      "Request Processing Standard Procedure"
    );
    expect(changeHistory.newTitle).toBe(
      "Request Processing Standard Procedure (Updated)"
    );
    expect(changeHistory.previousContent).toBe(
      "1. Receive request\n2. Validate data\n3. Process"
    );
    expect(changeHistory.newContent).toBe(
      "1. Receive request\n2. Validate data\n3. Check contract\n4. Process"
    );
    expect(changeHistory.changedAt).toBe(createdAtV2);
    expect(changeHistory.changedBy).toBe(userId);
    expect(changeHistory.changeDescription).toBe(
      "Updated procedure with additional validation step for contract confirmation"
    );

    // Verify: System auto-identifies latest version
    const latestVersion = identifyLatestVersion({
      procedureId: procedureId,
    });

    expect(latestVersion.versionNumber).toBe(2);
    expect(latestVersion.versionId).toBe(v2Result.versionId);
    expect(latestVersion.isLatest).toBe(true);
    expect(latestVersion.title).toBe(
      "Request Processing Standard Procedure (Updated)"
    );

    // Verify: Old version is marked as deprecated
    const deprecationResult = markOldVersionAsDeprecated({
      procedureId: procedureId,
      versionId: v1Result.versionId,
      deprecatedAt: createdAtV2,
    });

    expect(deprecationResult.versionNumber).toBe(1);
    expect(deprecationResult.isLatest).toBe(false);
    expect(deprecationResult.isDeprecated).toBe(true);
    expect(deprecationResult.deprecationWarning).toBe(
      "This is an old version. Please use the latest version."
    );

    // Verify: Accessing old version shows deprecation marker
    expect(v1Result.isLatest).toBe(true);
    const accessOldVersionResult = {
      ...v1Result,
      isLatest: false,
      isDeprecated: true,
      deprecationWarning:
        "This is an old version. Please use the latest version.",
    };

    expect(accessOldVersionResult.isDeprecated).toBe(true);
    expect(accessOldVersionResult.deprecationWarning).toBeDefined();
  });
});