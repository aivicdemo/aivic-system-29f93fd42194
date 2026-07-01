import { extractSalesDataForQuestion } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1046: [error] 質問内容に対応する根拠データ自動抽出と説明資料生成 - 質問内容に対応する営業データが存在しないとき抽出失敗が通知される
  test("質問内容に対応する営業データが存在しないとき、抽出失敗エラーが通知される", () => {
    const non_existent_customer_id = "XYZ999";
    const question_content = `架空の顧客ID: ${non_existent_customer_id}`;
    const user_id = "user_001";
    const session_date = new Date("2024-01-15T11:00:00Z");

    expect(() => {
      extractSalesDataForQuestion({
        question_content: question_content,
        user_id: user_id,
        session_date: session_date,
      });
    }).toThrow(/抽出失敗/);
  });
});