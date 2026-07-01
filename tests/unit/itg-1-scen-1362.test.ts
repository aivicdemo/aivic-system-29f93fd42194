import { validateSystemCompatibility } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1362
  test("営業システム更新頻度がバックオフィス要件より低い場合、互換性なしと判定される", () => {
    const salesSystemConfig = {
      updateFrequency: "monthly",
      dataItems: ["appointmentCount", "closureCount", "customerResponse"],
      outputFormat: "JSON",
    };

    const backofficeRequirements = {
      requiredUpdateFrequency: "daily",
      requiredDataItems: [
        "appointmentCount",
        "closureCount",
        "customerResponse",
      ],
      requiredFormat: "JSON",
    };

    const result = validateSystemCompatibility(
      salesSystemConfig,
      backofficeRequirements
    );

    expect(result.isCompatible).toBe(false);
    expect(result.status).toBe("error");
    expect(result.errorMessage).toMatch(/更新頻度/);
    expect(result.incompatibilityReason).toMatch(/月次|日次/);
  });
});