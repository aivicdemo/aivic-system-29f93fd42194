import { searchSalesActivities } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出機能", () => {
  test("SCEN-1157: 複合検索条件で正しくAND/OR演算が適用される", () => {
    // ========== ハッピーパス: 複合条件 (営業担当者='田中太郎' AND ステータス='成約') OR (金額>=100万円 OR 金額<=50万円) ==========

    // 第1条件グループ: 営業担当者='田中太郎' AND ステータス='成約'
    // 第2条件グループ: 金額>=100万円 OR 金額<=50万円
    // 全体: 第1グループ OR 第2グループ

    const result = searchSalesActivities({
      filters: [
        {
          operator: "AND",
          conditions: [
            { field: "salesRepName", condition: "equals", value: "田中太郎" },
            { field: "status", condition: "equals", value: "成約" }
          ]
        },
        {
          operator: "OR",
          conditions: [
            { field: "amount", condition: "greaterThanOrEqual", value: 1000000 },
            { field: "amount", condition: "lessThanOrEqual", value: 500000 }
          ]
        }
      ],
      topLevelOperator: "OR"
    });

    // 検証1: 返却データが配列であること
    expect(Array.isArray(result.data)).toBe(true);

    // 検証2: AND条件内で営業担当者と成約ステータスが両方満たされるデータのみが含まれること
    const andGroupResults = result.data.filter(
      (record: any) => record.salesRepName === "田中太郎" && record.status === "成約"
    );
    expect(andGroupResults.length).toBeGreaterThan(0);

    // 検証3: OR条件で金額>=100万円 または 金額<=50万円のデータが含まれること
    const orGroupResults = result.data.filter(
      (record: any) => record.amount >= 1000000 || record.amount <= 500000
    );
    expect(orGroupResults.length).toBeGreaterThan(0);

    // 検証4: 複合条件の論理構造を検証
    // 各レコードが第1グループ条件 OR 第2グループ条件を満たすことを確認
    result.data.forEach((record: any) => {
      const satisfiesFirstGroup =
        record.salesRepName === "田中太郎" && record.status === "成約";
      const satisfiesSecondGroup =
        record.amount >= 1000000 || record.amount <= 500000;
      expect(satisfiesFirstGroup || satisfiesSecondGroup).toBe(true);
    });

    // 検証5: 生成SQL文が正しい構造を持つこと
    expect(result.generatedSQL).toContain("WHERE");
    expect(result.generatedSQL.toUpperCase()).toContain("AND");
    expect(result.generatedSQL.toUpperCase()).toContain("OR");
    // 括弧による優先度が反映されていることを確認
    expect(result.generatedSQL).toContain("(");
    expect(result.generatedSQL).toContain(")");

    // ========== パターン2: AND優先で複数条件を組み合わせる ==========
    const resultPattern2 = searchSalesActivities({
      filters: [
        {
          operator: "AND",
          conditions: [
            { field: "salesRepName", condition: "equals", value: "鈴木花子" },
            { field: "period", condition: "greaterThanOrEqual", value: "2024-01-01" },
            { field: "period", condition: "lessThanOrEqual", value: "2024-12-31" }
          ]
        }
      ],
      topLevelOperator: "AND"
    });

    // パターン2検証1: AND条件内のすべての条件が満たされるデータのみが返却されること
    resultPattern2.data.forEach((record: any) => {
      expect(record.salesRepName).toBe("鈴木花子");
      expect(record.period).toGreaterThanOrEqual("2024-01-01");
      expect(record.period).toBeLessThanOrEqual("2024-12-31");
    });

    // パターン2検証2: 生成SQLにおいてAND演算子が複数含まれること
    const andCount = (resultPattern2.generatedSQL.match(/\bAND\b/gi) || []).length;
    expect(andCount).toBeGreaterThanOrEqual(2);

    // ========== パターン3: OR優先で複数条件を組み合わせる ==========
    const resultPattern3 = searchSalesActivities({
      filters: [
        {
          operator: "OR",
          conditions: [
            { field: "status", condition: "equals", value: "成約" },
            { field: "status", condition: "equals", value: "提案中" },
            { field: "status", condition: "equals", value: "アポ確定" }
          ]
        }
      ],
      topLevelOperator: "OR"
    });

    // パターン3検証1: OR条件内のいずれかの条件が満たされるデータが返却されること
    resultPattern3.data.forEach((record: any) => {
      const statusMatches =
        record.status === "成約" ||
        record.status === "提案中" ||
        record.status === "アポ確定";
      expect(statusMatches).toBe(true);
    });

    // パターン3検証2: 生成SQLにおいてOR演算子が複数含まれること
    const orCount = (resultPattern3.generatedSQL.match(/\bOR\b/gi) || []).length;
    expect(orCount).toBeGreaterThanOrEqual(2);

    // ========== パターン4: 複雑な入れ子構造 (AND条件グループ) OR (AND条件グループ) ==========
    const resultPattern4 = searchSalesActivities({
      filters: [
        {
          operator: "AND",
          conditions: [
            { field: "salesRepName", condition: "equals", value: "田中太郎" },
            { field: "status", condition: "equals", value: "成約" }
          ]
        },
        {
          operator: "AND",
          conditions: [
            { field: "salesRepName", condition: "equals", value: "鈴木花子" },
            { field: "status", condition: "equals", value: "成約" }
          ]
        }
      ],
      topLevelOperator: "OR"
    });

    // パターン4検証1: 第1グループ（田中太郎&成約）または第2グループ（鈴木花子&成約）のいずれかが満たされること
    resultPattern4.data.forEach((record: any) => {
      const satisfiesFirstGroup =
        record.salesRepName === "田中太郎" && record.status === "成約";
      const satisfiesSecondGroup =
        record.salesRepName === "鈴木花子" && record.status === "成約";
      expect(satisfiesFirstGroup || satisfiesSecondGroup).toBe(true);
    });

    // パターン4検証2: 生成SQLにおいて複数の括弧が含まれ、論理構造が保持されていること
    const openParenCount = (resultPattern4.generatedSQL.match(/\(/g) || []).length;
    expect(openParenCount).toBeGreaterThanOrEqual(2);
    const closeParenCount = (resultPattern4.generatedSQL.match(/\)/g) || []).length;
    expect(closeParenCount).toBe(openParenCount);

    // ========== エラー系: AND/OR演算子を明示的に指定しないと例外 ==========
    expect(() =>
      searchSalesActivities({
        filters: [
          {
            operator: undefined as any,
            conditions: [{ field: "salesRepName", condition: "equals", value: "田中太郎" }]
          }
        ],
        topLevelOperator: "OR"
      })
    ).toThrow(/演算子/);

    // ========== エラー系: 無効な比較演算子を使用すると例外 ==========
    expect(() =>
      searchSalesActivities({
        filters: [
          {
            operator: "AND",
            conditions: [
              {
                field: "amount",
                condition: "invalid_operator" as any,
                value: 1000000
              }
            ]
          }
        ],
        topLevelOperator: "AND"
      })
    ).toThrow(/比較演算子/);

    // ========== エラー系: 存在しないフィールドを指定すると例外 ==========
    expect(() =>
      searchSalesActivities({
        filters: [
          {
            operator: "AND",
            conditions: [
              { field: "nonexistentField", condition: "equals", value: "value" }
            ]
          }
        ],
        topLevelOperator: "AND"
      })
    ).toThrow(/フィールド/);

    // ========== エラー系: 空の検索条件を渡すと例外 ==========
    expect(() =>
      searchSalesActivities({
        filters: [],
        topLevelOperator: "AND"
      })
    ).toThrow(/条件/);

    // ========== エラー系: 条件内が空配列だと例外 ==========
    expect(() =>
      searchSalesActivities({
        filters: [
          {
            operator: "AND",
            conditions: []
          }
        ],
        topLevelOperator: "AND"
      })
    ).toThrow(/条件/);
  });
});