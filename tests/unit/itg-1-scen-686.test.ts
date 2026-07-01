import { validateAppointmentConfirmationStatus } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-686: アポ確定状況が定義済み選択肢以外の値で入力された場合にエラーが検出される", () => {
    const valid_statuses = ["confirmed", "pending", "cancelled"];
    const invalid_input = "未定義ステータス";

    expect(() => {
      validateAppointmentConfirmationStatus(invalid_input, valid_statuses);
    }).toThrow(/選択肢/);
  });
});