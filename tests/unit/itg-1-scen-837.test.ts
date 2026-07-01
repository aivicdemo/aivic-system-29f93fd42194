import { recordInteractionResponse } from "../../src/logic/it-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-837
  test("対応内容がポータルに記録・更新される際、構造化データとして正常に保存され、顧客企業が履歴を参照可能になる", () => {
    fetchMock.resetMocks();

    const interactionInput = {
      contractId: "CTR-20240115-001",
      recordedBy: "user-rep-001",
      recordedAt: new Date("2024-01-15T10:30:00Z"),
      interactionType: "call",
      interactionContent: "顧客との通話：サービス内容確認、納期について質問受付",
      duration: 45,
      outcome: "要望内容確認、次回フォローアップ予定",
      relatedCustomerId: "CUST-20240115-001",
    };

    const savedInteraction = {
      interactionId: "INT-20240115-001",
      contractId: "CTR-20240115-001",
      recordedBy: "user-rep-001",
      recordedAt: "2024-01-15T10:30:00Z",
      interactionType: "call",
      interactionContent: "顧客との通話：サービス内容確認、納期について質問受付",
      duration: 45,
      outcome: "要望内容確認、次回フォローアップ予定",
      relatedCustomerId: "CUST-20240115-001",
      savedAt: "2024-01-15T10:32:00Z",
      status: "saved",
    };

    fetchMock.mockResponseOnce(JSON.stringify(savedInteraction), {
      status: 201,
    });

    const result = recordInteractionResponse({
      contractId: interactionInput.contractId,
      recordedBy: interactionInput.recordedBy,
      recordedAt: interactionInput.recordedAt,
      interactionType: interactionInput.interactionType,
      interactionContent: interactionInput.interactionContent,
      duration: interactionInput.duration,
      outcome: interactionInput.outcome,
      relatedCustomerId: interactionInput.relatedCustomerId,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/interactions"),
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(result).toEqual(
      expect.objectContaining({
        interactionId: "INT-20240115-001",
        contractId: "CTR-20240115-001",
        interactionType: "call",
        status: "saved",
      })
    );

    expect(result.interactionContent).toBe(
      "顧客との通話：サービス内容確認、納期について質問受付"
    );
    expect(result.duration).toBe(45);
    expect(result.outcome).toBe("要望内容確認、次回フォローアップ予定");

    const secondInteractionInput = {
      contractId: "CTR-20240115-001",
      recordedBy: "user-rep-001",
      recordedAt: new Date("2024-01-15T14:15:00Z"),
      interactionType: "visit",
      interactionContent: "顧客訪問：契約内容変更対応、請求額説明",
      duration: 60,
      outcome: "契約変更合意、次月より新条件適用予定",
      relatedCustomerId: "CUST-20240115-001",
    };

    const secondSavedInteraction = {
      interactionId: "INT-20240115-002",
      contractId: "CTR-20240115-001",
      recordedBy: "user-rep-001",
      recordedAt: "2024-01-15T14:15:00Z",
      interactionType: "visit",
      interactionContent: "顧客訪問：契約内容変更対応、請求額説明",
      duration: 60,
      outcome: "契約変更合意、次月より新条件適用予定",
      relatedCustomerId: "CUST-20240115-001",
      savedAt: "2024-01-15T14:17:00Z",
      status: "saved",
    };

    fetchMock.mockResponseOnce(JSON.stringify(secondSavedInteraction), {
      status: 201,
    });

    const secondResult = recordInteractionResponse({
      contractId: secondInteractionInput.contractId,
      recordedBy: secondInteractionInput.recordedBy,
      recordedAt: secondInteractionInput.recordedAt,
      interactionType: secondInteractionInput.interactionType,
      interactionContent: secondInteractionInput.interactionContent,
      duration: secondInteractionInput.duration,
      outcome: secondInteractionInput.outcome,
      relatedCustomerId: secondInteractionInput.relatedCustomerId,
    });

    expect(secondResult.interactionId).toBe("INT-20240115-002");
    expect(secondResult.interactionType).toBe("visit");
    expect(secondResult.status).toBe("saved");

    const editedInteractionInput = {
      interactionId: "INT-20240115-002",
      contractId: "CTR-20240115-001",
      recordedBy: "user-rep-001",
      recordedAt: new Date("2024-01-15T14:15:00Z"),
      interactionType: "visit",
      interactionContent:
        "顧客訪問：契約内容変更対応、請求額説明、割引条件について追加協議実施",
      duration: 75,
      outcome: "契約変更合意、割引率20%適用で確定、次月より新条件適用予定",
      relatedCustomerId: "CUST-20240115-001",
    };

    const updatedInteraction = {
      interactionId: "INT-20240115-002",
      contractId: "CTR-20240115-001",
      recordedBy: "user-rep-001",
      recordedAt: "2024-01-15T14:15:00Z",
      interactionType: "visit",
      interactionContent:
        "顧客訪問：契約内容変更対応、請求額説明、割引条件について追加協議実施",
      duration: 75,
      outcome: "契約変更合意、割引率20%適用で確定、次月より新条件適用予定",
      relatedCustomerId: "CUST-20240115-001",
      savedAt: "2024-01-15T14:19:00Z",
      status: "updated",
    };

    fetchMock.mockResponseOnce(JSON.stringify(updatedInteraction), {
      status: 200,
    });

    const editResult = recordInteractionResponse({
      interactionId: editedInteractionInput.interactionId,
      contractId: editedInteractionInput.contractId,
      recordedBy: editedInteractionInput.recordedBy,
      recordedAt: editedInteractionInput.recordedAt,
      interactionType: editedInteractionInput.interactionType,
      interactionContent: editedInteractionInput.interactionContent,
      duration: editedInteractionInput.duration,
      outcome: editedInteractionInput.outcome,
      relatedCustomerId: editedInteractionInput.relatedCustomerId,
    });

    expect(editResult.status).toBe("updated");
    expect(editResult.duration).toBe(75);
    expect(editResult.interactionContent).toContain("割引条件について追加協議実施");
    expect(editResult.outcome).toContain("割引率20%適用で確定");

    expect(result.recordedAt).toBe("2024-01-15T10:30:00Z");
    expect(secondResult.recordedAt).toBe("2024-01-15T14:15:00Z");
    expect(editResult.recordedAt).toBe("2024-01-15T14:15:00Z");
  });
});