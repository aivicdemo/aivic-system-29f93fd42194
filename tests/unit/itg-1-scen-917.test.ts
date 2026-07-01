import { generateMonthlySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-917: [edge] 営業報告書月次サマリー自動集計機能 - 営業活動データが存在しない月で、ゼロ集計のサマリーが生成される
  test("営業活動データが存在しない月でゼロ集計のサマリーが生成される", () => {
    const targetYear = 2024;
    const targetMonth = 3;
    const targetDate = new Date("2024-03-01T00:00:00Z");
    const generatedAt = new Date("2024-03-31T23:59:59Z");

    const result = generateMonthlySummary({
      year: targetYear,
      month: targetMonth,
      salesActivitiesData: [],
      generatedAt: generatedAt,
    });

    // (1) 全集計項目がゼロまたはNULL
    expect(result.totalRevenue).toBe(0);
    expect(result.totalAppoCount).toBe(0);
    expect(result.totalContractCount).toBe(0);
    expect(result.totalAmount).toBe(0);
    expect(result.averageContractValue).toBeNull();

    // (2) エラーメッセージが表示されない
    expect(result.hasError).toBe(false);
    expect(result.errorMessage).toBeNull();

    // (3) サマリーレコードが正常に作成されている
    expect(result.recordId).toBeDefined();
    expect(typeof result.recordId).toBe("string");
    expect(result.recordId.length).toBeGreaterThan(0);

    // (4) サマリーヘッダーには正しい対象月と生成日時が記録される
    expect(result.targetYear).toBe(2024);
    expect(result.targetMonth).toBe(3);
    expect(result.generatedAt).toEqual(generatedAt);
    expect(result.generatedAtISO).toBe("2024-03-31T23:59:59Z");

    // (5) ステータスがsuccess
    expect(result.status).toBe("success");
    expect(result.systemLog).toBeNull();
  });
});