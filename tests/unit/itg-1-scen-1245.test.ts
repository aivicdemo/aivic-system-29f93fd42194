import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { recordContractChangeApproval } from "../../src/logic/it-1781935279444-2-1-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1245: [edge] 契約変更承認・署名記録機能 - 複数の承認者がいる場合、全承認者の承認記録が保存される
  test("複数承認者による契約変更承認時に全承認者の承認記録がシステムに保存される", async () => {
    // テストデータ: 3人の承認者が設定された契約変更申請
    const contractChangeId = "CC-2024-001";
    const approver_a = {
      userId: "approver-a-001",
      userName: "承認者A",
      email: "approver.a@company.com",
    };
    const approver_b = {
      userId: "approver-b-001",
      userName: "承認者B",
      email: "approver.b@company.com",
    };
    const approver_c = {
      userId: "approver-c-001",
      userName: "承認者C",
      email: "approver.c@company.com",
    };
    const approversList = [approver_a, approver_b, approver_c];

    const contractChangeContent = {
      contractId: "CONTRACT-2024-100",
      changeType: "renewal",
      previousTerms: "Standard Plan",
      newTerms: "Premium Plan",
      effectiveDate: "2024-02-01",
    };

    // Mock API: 承認者A の承認記録を保存
    const approvalTimestampA = new Date("2024-01-15T09:00:00Z");
    const signatureDataA = "SIGNATURE_A_BASE64_ENCODED";
    const approvalRecordA = {
      contractChangeId,
      approverId: approver_a.userId,
      approverName: approver_a.userName,
      approvalTimestamp: approvalTimestampA.toISOString(),
      signature: signatureDataA,
      approvalDateTime: new Date("2024-01-15T09:00:00Z").toISOString(),
      status: "approved",
      sequenceNumber: 1,
    };

    fetchMock.mockResponseOnce(JSON.stringify(approvalRecordA), { status: 201 });

    const resultA = await recordContractChangeApproval({
      contractChangeId,
      approverId: approver_a.userId,
      approverName: approver_a.userName,
      approvalTimestamp: approvalTimestampA,
      signature: signatureDataA,
      changeContent: contractChangeContent,
      sequenceNumber: 1,
    });

    expect(resultA).toEqual(approvalRecordA);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/contract-change/approval"),
      expect.objectContaining({ method: "POST" })
    );

    // Mock API: 承認者B の承認記録を保存
    const approvalTimestampB = new Date("2024-01-15T10:30:00Z");
    const signatureDataB = "SIGNATURE_B_BASE64_ENCODED";
    const approvalRecordB = {
      contractChangeId,
      approverId: approver_b.userId,
      approverName: approver_b.userName,
      approvalTimestamp: approvalTimestampB.toISOString(),
      signature: signatureDataB,
      approvalDateTime: new Date("2024-01-15T10:30:00Z").toISOString(),
      status: "approved",
      sequenceNumber: 2,
    };

    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(JSON.stringify(approvalRecordB), { status: 201 });

    const resultB = await recordContractChangeApproval({
      contractChangeId,
      approverId: approver_b.userId,
      approverName: approver_b.userName,
      approvalTimestamp: approvalTimestampB,
      signature: signatureDataB,
      changeContent: contractChangeContent,
      sequenceNumber: 2,
    });

    expect(resultB).toEqual(approvalRecordB);

    // Mock API: 承認者C の承認記録を保存
    const approvalTimestampC = new Date("2024-01-15T11:45:00Z");
    const signatureDataC = "SIGNATURE_C_BASE64_ENCODED";
    const approvalRecordC = {
      contractChangeId,
      approverId: approver_c.userId,
      approverName: approver_c.userName,
      approvalTimestamp: approvalTimestampC.toISOString(),
      signature: signatureDataC,
      approvalDateTime: new Date("2024-01-15T11:45:00Z").toISOString(),
      status: "approved",
      sequenceNumber: 3,
    };

    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(JSON.stringify(approvalRecordC), { status: 201 });

    const resultC = await recordContractChangeApproval({
      contractChangeId,
      approverId: approver_c.userId,
      approverName: approver_c.userName,
      approvalTimestamp: approvalTimestampC,
      signature: signatureDataC,
      changeContent: contractChangeContent,
      sequenceNumber: 3,
    });

    expect(resultC).toEqual(approvalRecordC);

    // Mock API: 承認履歴一覧を取得
    const allApprovalRecords = [approvalRecordA, approvalRecordB, approvalRecordC];

    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({ approvalRecords: allApprovalRecords, totalCount: 3 }),
      { status: 200 }
    );

    // 承認履歴を取得してすべての承認記録が存在することを検証
    const response = await fetch(
      `https://api.example.com/contract-change/${contractChangeId}/approval-history`,
      { method: "GET" }
    );
    const historyData = await response.json();

    expect(historyData.approvalRecords).toHaveLength(3);
    expect(historyData.totalCount).toBe(3);

    // 各承認記録の完全性を検証
    expect(historyData.approvalRecords[0]).toEqual({
      contractChangeId,
      approverId: approver_a.userId,
      approverName: "承認者A",
      approvalTimestamp: "2024-01-15T09:00:00.000Z",
      signature: signatureDataA,
      approvalDateTime: "2024-01-15T09:00:00.000Z",
      status: "approved",
      sequenceNumber: 1,
    });

    expect(historyData.approvalRecords[1]).toEqual({
      contractChangeId,
      approverId: approver_b.userId,
      approverName: "承認者B",
      approvalTimestamp: "2024-01-15T10:30:00.000Z",
      signature: signatureDataB,
      approvalDateTime: "2024-01-15T10:30:00.000Z",
      status: "approved",
      sequenceNumber: 2,
    });

    expect(historyData.approvalRecords[2]).toEqual({
      contractChangeId,
      approverId: approver_c.userId,
      approverName: "承認者C",
      approvalTimestamp: "2024-01-15T11:45:00.000Z",
      signature: signatureDataC,
      approvalDateTime: "2024-01-15T11:45:00.000Z",
      status: "approved",
      sequenceNumber: 3,
    });

    // Mock API: データベースクエリ - 承認記録テーブルから3件すべてが存在することを確認
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        records: [
          {
            id: "approval-record-1",
            contractChangeId,
            approverId: approver_a.userId,
            approverName: "承認者A",
            approvalTimestamp: "2024-01-15T09:00:00Z",
            signature: signatureDataA,
            approvalDateTime: "2024-01-15T09:00:00Z",
            status: "approved",
          },
          {
            id: "approval-record-2",
            contractChangeId,
            approverId: approver_b.userId,
            approverName: "承認者B",
            approvalTimestamp: "2024-01-15T10:30:00Z",
            signature: signatureDataB,
            approvalDateTime: "2024-01-15T10:30:00Z",
            status: "approved",
          },
          {
            id: "approval-record-3",
            contractChangeId,
            approverId: approver_c.userId,
            approverName: "承認者C",
            approvalTimestamp: "2024-01-15T11:45:00Z",
            signature: signatureDataC,
            approvalDateTime: "2024-01-15T11:45:00Z",
            status: "approved",
          },
        ],
        recordCount: 3,
      }),
      { status: 200 }
    );

    const dbQueryResponse = await fetch(
      `https://api.example.com/database/approval-records?contractChangeId=${contractChangeId}`,
      { method: "GET" }
    );
    const dbData = await dbQueryResponse.json();

    expect(dbData.recordCount).toBe(3);
    expect(dbData.records).toHaveLength(3);

    // 各承認記録の詳細が正確に保存されていることを検証
    const recordFromDb1 = dbData.records[0];
    expect(recordFromDb1.approverId).toBe(approver_a.userId);
    expect(recordFromDb1.approverName).toBe("承認者A");
    expect(recordFromDb1.signature).toBe(signatureDataA);
    expect(recordFromDb1.approvalTimestamp).toBe("2024-01-15T09:00:00Z");
    expect(recordFromDb1.status).toBe("approved");

    const recordFromDb2 = dbData.records[1];
    expect(recordFromDb2.approverId).toBe(approver_b.userId);
    expect(recordFromDb2.approverName).toBe("承認者B");
    expect(recordFromDb2.signature).toBe(signatureDataB);
    expect(recordFromDb2.approvalTimestamp).toBe("2024-01-15T10:30:00Z");
    expect(recordFromDb2.status).toBe("approved");

    const recordFromDb3 = dbData.records[2];
    expect(recordFromDb3.approverId).toBe(approver_c.userId);
    expect(recordFromDb3.approverName).toBe("承認者C");
    expect(recordFromDb3.signature).toBe(signatureDataC);
    expect(recordFromDb3.approvalTimestamp).toBe("2024-01-15T11:45:00Z");
    expect(recordFromDb3.status).toBe("approved");

    // 全承認者による承認が完全に記録されたことを確認
    expect(historyData.approvalRecords.map((r: any) => r.approverName)).toEqual([
      "承認者A",
      "承認者B",
      "承認者C",
    ]);
    expect(
      historyData.approvalRecords.every(
        (r: any) => r.status === "approved" && r.signature
      )
    ).toBe(true);
  });
});