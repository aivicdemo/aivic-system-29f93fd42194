import { describe, test, expect, beforeEach } from "@jest/globals";
import { recordContractChangeSignature } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1243: [normal] 契約変更承認・署名記録機能 - 営業責任者の署名要件が電子署名である場合、電子署名が生成・記録される
  test("should record electronic signature when sales manager signature requirement is electronic signature", () => {
    const input = {
      contractChangeId: "CC-20240115-001",
      contractId: "CT-2024-0001",
      customerId: "CUST-0001",
      salesManagerId: "SM-0001",
      salesManagerName: "山田太郎",
      salesManagerEmail: "yamada@example.com",
      signatureRequirement: "electronic_signature",
      changeItems: [
        {
          fieldName: "serviceType",
          oldValue: "service_a",
          newValue: "service_b",
          changeReason: "顧客要望による変更"
        }
      ],
      signatureImageData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      signatureTimestamp: "2024-01-15T10:30:00Z",
      signatureDeviceId: "SIGN-PAD-001"
    };

    const result = recordContractChangeSignature(input);

    // 署名記録が正常に保存されたことを確認
    expect(result.success).toBe(true);
    
    // 署名レコードIDが生成されていることを確認
    expect(result.signatureRecordId).toBeDefined();
    expect(result.signatureRecordId).toMatch(/^SIG-/);
    
    // 電子署名が正常に記録されたことを確認
    expect(result.signatureType).toBe("electronic_signature");
    
    // 署名画像データが保存されていることを確認
    expect(result.signatureImageData).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...");
    
    // タイムスタンプが正確に記録されていることを確認
    expect(result.signatureTimestamp).toBe("2024-01-15T10:30:00Z");
    
    // 署名者情報が正しく記録されていることを確認
    expect(result.signerInfo).toEqual({
      managerId: "SM-0001",
      managerName: "山田太郎",
      managerEmail: "yamada@example.com"
    });
    
    // 契約変更情報が紐付いていることを確認
    expect(result.contractChangeId).toBe("CC-20240115-001");
    expect(result.contractId).toBe("CT-2024-0001");
    expect(result.customerId).toBe("CUST-0001");
    
    // 署名デバイス情報が記録されていることを確認
    expect(result.signatureDeviceId).toBe("SIGN-PAD-001");
    
    // ステータスが「承認済み」に遷移していることを確認
    expect(result.changeApprovalStatus).toBe("approved");
    
    // 承認履歴に記録されていることを確認
    expect(result.recordedInHistory).toBe(true);
    expect(result.historyRecordId).toBeDefined();
    
    // 署名要件が電子署名であることを確認
    expect(result.signatureRequirement).toBe("electronic_signature");
    
    // 変更項目が紐付いていることを確認
    expect(result.changeItemsCount).toBe(1);
    expect(result.changeItemDetails[0]).toEqual({
      fieldName: "serviceType",
      oldValue: "service_a",
      newValue: "service_b",
      changeReason: "顧客要望による変更"
    });
  });
});