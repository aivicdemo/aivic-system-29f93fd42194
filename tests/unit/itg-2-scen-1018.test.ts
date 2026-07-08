import { recordDocumentModification } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1018: [normal] 説明資料の修正内容の記録・追跡 - 修正箇所・修正前後テキスト・修正理由が正確に記録され、修正履歴として蓄積される
  test("should record and track document modification history with correction location, text before/after, and reason", () => {
    const input = {
      document_id: "doc-20240115-001",
      document_title: "見積査定根拠説明資料_案件A",
      modification_location: "相場乖離の根拠セクション第2段落",
      text_before:
        "過去案件データから同一地域・同一工種の事例は15件抽出され、平均金額は1,200万円です。",
      text_after:
        "過去案件データから同一地域・同一工種の事例は18件抽出され、平均金額は1,210万円です。",
      modification_reason: "最新の物価本更新を反映し、参照案件件数と平均金額を修正",
      modified_by_user_id: "assessor-001",
      modified_timestamp: new Date("2024-01-15T14:30:00Z"),
      document_version: 2,
    };

    const result = recordDocumentModification(input);

    expect(result).toEqual({
      modification_id: expect.stringMatching(/^mod-\d{8}-\d+$/),
      document_id: "doc-20240115-001",
      document_title: "見積査定根拠説明資料_案件A",
      modification_number: 1,
      modification_location: "相場乖離の根拠セクション第2段落",
      text_before:
        "過去案件データから同一地域・同一工種の事例は15件抽出され、平均金額は1,200万円です。",
      text_after:
        "過去案件データから同一地域・同一工種の事例は18件抽出され、平均金額は1,210万円です。",
      modification_reason: "最新の物価本更新を反映し、参照案件件数と平均金額を修正",
      modified_by_user_id: "assessor-001",
      modified_timestamp: new Date("2024-01-15T14:30:00Z"),
      document_version_after: 2,
      is_recorded_in_history: true,
      is_traceable: true,
      char_count_before: 41,
      char_count_after: 41,
      text_diff_detected: true,
    });

    expect(result.modification_id).toBeTruthy();
    expect(result.is_recorded_in_history).toBe(true);
    expect(result.is_traceable).toBe(true);
    expect(result.text_before).toBe(
      "過去案件データから同一地域・同一工種の事例は15件抽出され、平均金額は1,200万円です。"
    );
    expect(result.text_after).toBe(
      "過去案件データから同一地域・同一工種の事例は18件抽出され、平均金額は1,210万円です。"
    );
    expect(result.modification_reason).toBe(
      "最新の物価本更新を反映し、参照案件件数と平均金額を修正"
    );
    expect(result.text_diff_detected).toBe(true);
    expect(result.modification_number).toBe(1);
  });
});