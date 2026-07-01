import { validateContractDataIntegrity } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-922: 契約内容との整合性検証機能 - 契約書の納期が営業データの報告内容と異なる場合、修正指示フラグが立つ", () => {
    // テストデータ: 契約情報（納期: 2024年3月31日）
    const contract_id = "CONTRACT-001";
    const contract_delivery_date = new Date("2024-03-31");

    // テストデータ: 営業データ（報告内容の納期: 2024年4月15日）
    const report_delivery_date = new Date("2024-04-15");
    const sales_data = {
      contract_id: contract_id,
      reported_delivery_date: report_delivery_date,
    };

    // 契約内容との整合性検証機能を実行
    const result = validateContractDataIntegrity({
      contract_id: contract_id,
      contract_delivery_date: contract_delivery_date,
      sales_data: sales_data,
    });

    // 修正指示フラグが立つことを確認
    expect(result.correction_flag_raised).toBe(true);

    // 不整合が検出されたことを確認
    expect(result.has_discrepancy).toBe(true);

    // 差分日数を計算（2024年4月15日 - 2024年3月31日 = 15日）
    const expected_difference_days = 15;
    expect(result.difference_days).toBe(expected_difference_days);

    // エラーログに不整合の詳細情報が記録されることを確認
    expect(result.error_log).toBeDefined();
    expect(result.error_log.contract_id).toBe(contract_id);
    expect(result.error_log.contract_delivery_date).toEqual(contract_delivery_date);
    expect(result.error_log.reported_delivery_date).toEqual(report_delivery_date);
    expect(result.error_log.difference_days).toBe(expected_difference_days);

    // ログメッセージが納期不整合に関する内容を含むことを確認
    expect(result.error_log.message).toMatch(/納期/);
    expect(result.error_log.message).toMatch(/不整合/);
  });
});