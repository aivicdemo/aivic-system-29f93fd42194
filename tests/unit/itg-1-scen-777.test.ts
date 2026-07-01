import { describe, test, expect } from "@jest/globals";
import { filterDocumentsByMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-777: [normal] 資料検索・フィルタリング機能 - 顧客ID・案件ID・資料種別・有効期限に基づいてフィルタリングされた資料一覧が正確に抽出される
  test("should filter documents correctly by customerId, projectId, documentType, and validityPeriod", () => {
    // Setup: Mock documents with various metadata
    const inputDocuments = [
      {
        documentId: "doc-001",
        customerId: "cust-100",
        projectId: "proj-A",
        documentType: "proposal",
        validFromDate: new Date("2024-01-01T00:00:00Z"),
        validToDate: new Date("2024-12-31T23:59:59Z"),
        fileName: "Proposal_CustA_ProjA.pdf",
        version: "1.0",
      },
      {
        documentId: "doc-002",
        customerId: "cust-100",
        projectId: "proj-B",
        documentType: "contract",
        validFromDate: new Date("2024-02-01T00:00:00Z"),
        validToDate: new Date("2024-11-30T23:59:59Z"),
        fileName: "Contract_CustA_ProjB.pdf",
        version: "2.1",
      },
      {
        documentId: "doc-003",
        customerId: "cust-200",
        projectId: "proj-A",
        documentType: "proposal",
        validFromDate: new Date("2024-03-01T00:00:00Z"),
        validToDate: new Date("2024-10-31T23:59:59Z"),
        fileName: "Proposal_CustB_ProjA.pdf",
        version: "1.5",
      },
      {
        documentId: "doc-004",
        customerId: "cust-100",
        projectId: "proj-A",
        documentType: "proposal",
        validFromDate: new Date("2024-01-15T00:00:00Z"),
        validToDate: new Date("2024-12-31T23:59:59Z"),
        fileName: "Proposal_CustA_ProjA_Updated.pdf",
        version: "1.2",
      },
      {
        documentId: "doc-005",
        customerId: "cust-100",
        projectId: "proj-A",
        documentType: "proposal",
        validFromDate: new Date("2023-01-01T00:00:00Z"),
        validToDate: new Date("2023-12-31T23:59:59Z"),
        fileName: "Proposal_CustA_ProjA_Archived.pdf",
        version: "0.9",
      },
    ];

    // Filter criteria
    const filterCriteria = {
      customerId: "cust-100",
      projectId: "proj-A",
      documentType: "proposal",
      validityStartDate: new Date("2024-01-01T00:00:00Z"),
      validityEndDate: new Date("2024-12-31T23:59:59Z"),
    };

    // Execute
    const filteredDocuments = filterDocumentsByMetadata(
      inputDocuments,
      filterCriteria
    );

    // Assertions: Only doc-001 and doc-004 should match all criteria
    // - customerId === "cust-100" ✓
    // - projectId === "proj-A" ✓
    // - documentType === "proposal" ✓
    // - validFromDate <= filterCriteria.validityStartDate AND validToDate >= filterCriteria.validityEndDate ✓

    expect(filteredDocuments).toHaveLength(2);

    expect(filteredDocuments[0]).toEqual({
      documentId: "doc-001",
      customerId: "cust-100",
      projectId: "proj-A",
      documentType: "proposal",
      validFromDate: new Date("2024-01-01T00:00:00Z"),
      validToDate: new Date("2024-12-31T23:59:59Z"),
      fileName: "Proposal_CustA_ProjA.pdf",
      version: "1.0",
    });

    expect(filteredDocuments[1]).toEqual({
      documentId: "doc-004",
      customerId: "cust-100",
      projectId: "proj-A",
      documentType: "proposal",
      validFromDate: new Date("2024-01-15T00:00:00Z"),
      validToDate: new Date("2024-12-31T23:59:59Z"),
      fileName: "Proposal_CustA_ProjA_Updated.pdf",
      version: "1.2",
    });

    // Verify excluded documents
    const excludedDocumentIds = filteredDocuments.map((d) => d.documentId);
    expect(excludedDocumentIds).not.toContain("doc-002"); // Different projectId
    expect(excludedDocumentIds).not.toContain("doc-003"); // Different customerId
    expect(excludedDocumentIds).not.toContain("doc-005"); // Outside validity period

    // Verify all returned documents match all filter criteria
    filteredDocuments.forEach((doc) => {
      expect(doc.customerId).toBe(filterCriteria.customerId);
      expect(doc.projectId).toBe(filterCriteria.projectId);
      expect(doc.documentType).toBe(filterCriteria.documentType);
      expect(doc.validFromDate.getTime()).toBeLessThanOrEqual(
        filterCriteria.validityStartDate.getTime()
      );
      expect(doc.validToDate.getTime()).toGreaterThanOrEqual(
        filterCriteria.validityEndDate.getTime()
      );
    });

    // Verify order: newer version first (based on version number semantic)
    expect(parseFloat(filteredDocuments[0].version)).toBeGreaterThanOrEqual(
      parseFloat(filteredDocuments[1].version)
    );
  });
});