import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

import {
  approveContractChangeWithSignature,
  verifySignatureRecord,
  validateAuditLog,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1214: [normal] 契約変更内容の承認・署名・ログ生成
  test("電子署名が必須の契約について、承認と同時に電子署名が生成されシステムに記録される", async () => {
    // === Setup: 承認対象の契約変更データ ===
    const contractChangeId = "CC-20240115-001";
    const contractId = "CONT-2024-00123";
    const userId = "USER-00456";
    const changeContent = {
      fieldName: "billing_unit_price",
      previousValue: "50000",
      newValue: "55000",
      effectiveDate: "2024-02-01",
      reason: "成約数増加に伴う価格改定",
    };
    const signatureRequired = true;
    const timestampIso = "2024-01-15T11:00:00Z";
    const signatureValue =
      "sig_abc123def456ghi789jkl012mno345pqr678stu901";

    // === API mock: 署名データ取得エンドポイント ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        signerId: userId,
        timestamp: timestampIso,
        contractChangeId: contractChangeId,
        requiresSignature: true,
      }),
      { status: 200 }
    );

    // === API mock: 署名実行エンドポイント ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        signatureId: "SIG-20240115-001",
        signatureValue: signatureValue,
        timestamp: timestampIso,
        signerId: userId,
        status: "signed",
      }),
      { status: 200 }
    );

    // === API mock: 審査ログ記録エンドポイント ===
    fetchMock.mockResponseOnce(
      JSON.stringify({
        auditLogId: "AUDIT-20240115-001",
        events: [
          {
            eventType: "contract_change_approval",
            timestamp: timestampIso,
            userId: userId,
            contractChangeId: contractChangeId,
            status: "completed",
          },
          {
            eventType: "electronic_signature_generation",
            timestamp: timestampIso,
            userId: userId,
            signatureId: "SIG-20240115-001",
            status: "completed",
          },
          {
            eventType: "signature_record_saved",
            timestamp: timestampIso,
            userId: userId,
            recordId: "REC-20240115-001",
            status: "completed",
          },
        ],
      }),
      { status: 200 }
    );

    // === Test: 承認と署名の処理実行 ===
    const approvalResult = await approveContractChangeWithSignature({
      contractChangeId: contractChangeId,
      contractId: contractId,
      userId: userId,
      changeContent: changeContent,
      signatureRequired: signatureRequired,
      timestamp: new Date(timestampIso),
    });

    // === Assertion 1: 承認ステータスが『承認済み』に更新されている ===
    expect(approvalResult.approvalStatus).toBe("approved");
    expect(approvalResult.contractChangeId).toBe(contractChangeId);

    // === Assertion 2: 電子署名データが契約変更履歴に記録されている ===
    const signatureRecordVerification = await verifySignatureRecord({
      contractChangeId: contractChangeId,
      signatureId: "SIG-20240115-001",
    });

    expect(signatureRecordVerification.recordExists).toBe(true);
    expect(signatureRecordVerification.signerId).toBe(userId);
    expect(signatureRecordVerification.timestamp).toBe(timestampIso);
    expect(signatureRecordVerification.signatureValue).toBe(signatureValue);
    expect(signatureRecordVerification.contractChangeId).toBe(
      contractChangeId
    );

    // === Assertion 3: 監査ログにおいて時系列順に3つのイベントが記録されている ===
    const auditLogValidation = await validateAuditLog({
      contractChangeId: contractChangeId,
      userId: userId,
      auditLogId: "AUDIT-20240115-001",
    });

    expect(auditLogValidation.isValid).toBe(true);
    expect(auditLogValidation.eventCount).toBe(3);
    expect(auditLogValidation.events[0].eventType).toBe(
      "contract_change_approval"
    );
    expect(auditLogValidation.events[0].status).toBe("completed");
    expect(auditLogValidation.events[1].eventType).toBe(
      "electronic_signature_generation"
    );
    expect(auditLogValidation.events[1].status).toBe("completed");
    expect(auditLogValidation.events[2].eventType).toBe(
      "signature_record_saved"
    );
    expect(auditLogValidation.events[2].status).toBe("completed");

    // === Assertion 4: イベント時系列順序の検証 ===
    const event0Time = new Date(auditLogValidation.events[0].timestamp);
    const event1Time = new Date(auditLogValidation.events[1].timestamp);
    const event2Time = new Date(auditLogValidation.events[2].timestamp);

    expect(event0Time.getTime()).toBeLessThanOrEqual(event1Time.getTime());
    expect(event1Time.getTime()).toBeLessThanOrEqual(event2Time.getTime());

    // === Assertion 5: すべてのデータが改ざん検知可能な形式で保存されている ===
    expect(auditLogValidation.dataIntegrityChecksum).toBeDefined();
    expect(auditLogValidation.dataIntegrityChecksum).toMatch(
      /^[a-f0-9]{64}$/
    );
    expect(signatureRecordVerification.integrityHash).toBeDefined();
    expect(signatureRecordVerification.integrityHash).toMatch(
      /^[a-f0-9]{64}$/
    );

    // === Assertion 6: API呼び出しの検証 ===
    expect(fetchMock.mock.calls.length).toBe(3);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/signature/get-signature-info"
    );
    expect(fetchMock.mock.calls[1][0]).toContain("/api/signature/execute");
    expect(fetchMock.mock.calls[2][0]).toContain("/api/audit-log/record");

    // === Assertion 7: 承認結果に含まれる署名情報の完全性 ===
    expect(approvalResult.signature).toBeDefined();
    expect(approvalResult.signature.signatureId).toBe("SIG-20240115-001");
    expect(approvalResult.signature.timestamp).toBe(timestampIso);
    expect(approvalResult.signature.signerId).toBe(userId);
    expect(approvalResult.auditLogId).toBe("AUDIT-20240115-001");
  });
});