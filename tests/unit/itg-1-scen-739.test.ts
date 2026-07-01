import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-739: [normal] 営業データ自動検証ルール - 営業担当者の入力データが定義済み検証ルールに基づいて自動検証され、全項目が基準を満たす場合に合格判定される
  test("営業担当者の入力データが定義済み検証ルールに基づいて自動検証され、全項目が基準を満たす場合に合格判定される", () => {
    const validSalesData = {
      customerName: "株式会社テスト太郎商事",
      contactDate: "2024-01-15",
      contactTime: "14:30",
      serviceType: "営業代行",
      appointmentConfirmed: true,
      dealAmount: 250000,
      dealStatus: "成約",
      salesPersonId: "SP001",
      notes: "初回訪問完了、次回フォローアップ予定あり",
    };

    const validationRules = [
      {
        fieldName: "customerName",
        required: true,
        dataType: "string",
        minLength: 2,
        maxLength: 100,
      },
      {
        fieldName: "contactDate",
        required: true,
        dataType: "string",
        format: "YYYY-MM-DD",
      },
      {
        fieldName: "contactTime",
        required: true,
        dataType: "string",
        format: "HH:mm",
      },
      {
        fieldName: "serviceType",
        required: true,
        dataType: "string",
        allowedValues: ["営業代行", "営業支援", "営業コンサルティング"],
      },
      {
        fieldName: "appointmentConfirmed",
        required: true,
        dataType: "boolean",
      },
      {
        fieldName: "dealAmount",
        required: true,
        dataType: "number",
        minValue: 0,
        maxValue: 10000000,
      },
      {
        fieldName: "dealStatus",
        required: true,
        dataType: "string",
        allowedValues: ["検討中", "提案済み", "成約", "失注"],
      },
      {
        fieldName: "salesPersonId",
        required: true,
        dataType: "string",
        format: "SP[0-9]{3}",
      },
      {
        fieldName: "notes",
        required: false,
        dataType: "string",
        maxLength: 500,
      },
    ];

    const result = validateSalesData(validSalesData, validationRules);

    expect(result).toEqual({
      isValid: true,
      status: "合格",
      errors: [],
      warnings: [],
      validationCompletedAt: expect.any(String),
      appliedRules: expect.arrayContaining([
        expect.objectContaining({ fieldName: "customerName" }),
        expect.objectContaining({ fieldName: "contactDate" }),
        expect.objectContaining({ fieldName: "contactTime" }),
        expect.objectContaining({ fieldName: "serviceType" }),
        expect.objectContaining({ fieldName: "appointmentConfirmed" }),
        expect.objectContaining({ fieldName: "dealAmount" }),
        expect.objectContaining({ fieldName: "dealStatus" }),
        expect.objectContaining({ fieldName: "salesPersonId" }),
      ]),
    });

    expect(result.isValid).toBe(true);
    expect(result.status).toBe("合格");
    expect(result.errors.length).toBe(0);
    expect(result.warnings.length).toBe(0);
    expect(result.validationCompletedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
    expect(result.appliedRules.length).toBe(9);
    expect(
      result.appliedRules.every((rule: any) => rule.isApplied === true)
    ).toBe(true);
  });
});