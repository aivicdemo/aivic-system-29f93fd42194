import { recordConsultationResponse } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-817: 代表への相談受領・履歴管理機能 - 代表が営業責任者からの相談を受け取り、対応方針がタイムスタンプと対応者情報付きで履歴に記録される", () => {
    // Precondition: 営業責任者が相談内容を送信し、代表が相談を受領可能な状態
    // Trigger: 代表が受領した相談に対して対応方針を入力・保存した時点
    // Expected Outcome: 対応方針がタイムスタンプ・対応者情報付きで履歴に記録される

    const consultationId = "CONS-2024-001";
    const consultationContent =
      "契約内容の変更に関する確認のお願い：新規サービスの請求開始時期について";
    const consultantUserId = "USER-SALES-REP-001";
    const consultantName = "営業責任者 太郎";
    const respondentUserId = "USER-ADMIN-001";
    const respondentName = "代表 花子";
    const responsePolicy = "契約変更申請書を確認の上、2営業日以内に返答予定";

    // 対応方針記録時刻（固定タイムスタンプ）
    const recordedAt = new Date("2024-06-15T10:30:00Z");

    // 相談受領・対応方針記録
    const result = recordConsultationResponse({
      consultationId,
      consultationContent,
      consultantUserId,
      consultantName,
      respondentUserId,
      respondentName,
      responsePolicy,
      recordedAt,
    });

    // Assertion 1: 対応方針の内容が完全に保存されている
    expect(result.responsePolicy).toBe(
      "契約変更申請書を確認の上、2営業日以内に返答予定"
    );

    // Assertion 2: 対応日時が正確なタイムスタンプ付きで記録されている
    expect(result.recordedAt).toEqual(new Date("2024-06-15T10:30:00Z"));

    // Assertion 3: 対応者（代表）の名前とユーザーIDが明確に記録されている
    expect(result.respondentUserId).toBe("USER-ADMIN-001");
    expect(result.respondentName).toBe("代表 花子");

    // Assertion 4: 履歴一覧から該当レコードを検索・表示できる
    expect(result.consultationId).toBe("CONS-2024-001");
    expect(result.consultantUserId).toBe("USER-SALES-REP-001");
    expect(result.consultantName).toBe("営業責任者 太郎");

    // Assertion 5: 履歴レコードが構造化されて返されている
    expect(result).toHaveProperty("consultationId");
    expect(result).toHaveProperty("consultationContent");
    expect(result).toHaveProperty("responsePolicy");
    expect(result).toHaveProperty("recordedAt");
    expect(result).toHaveProperty("respondentUserId");
    expect(result).toHaveProperty("respondentName");

    // Assertion 6: 相談内容も履歴に含まれている
    expect(result.consultationContent).toBe(
      "契約内容の変更に関する確認のお願い：新規サービスの請求開始時期について"
    );
  });
});