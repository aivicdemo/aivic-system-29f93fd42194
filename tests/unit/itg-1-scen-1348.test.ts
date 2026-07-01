import { structureHearingRecord } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データヒアリング記録の構造化機能", () => {
  test("SCEN-1348: ヒアリング内容から営業成果指標・データ項目・計算ルール・レポート形式が抽出され構造化される", () => {
    // 【入力】ヒアリング記録テキスト（営業成果指標、データ項目、計算ルール、レポート形式を含む）
    const hearingRecordText = `
      営業成果指標：
      - 売上目標: 月次1000万円
      - 受注数: 月次50件
      - 顧客満足度: 90%以上
      
      データ項目：
      - 顧客名（テキスト型）
      - 取引金額（数値型、単位:円）
      - 契約期間（日付型、YYYY-MM-DD形式）
      - 営業担当者名（テキスト型）
      - 商品カテゴリ（テキスト型）
      
      計算ルール：
      - 割引率の適用方法: 契約期間が6ヶ月以上の場合、取引金額に10%割引を適用
      - 手数料計算ロジック: (取引金額 - 割引額) × 3% を営業手数料として計算
      - 成約判定条件: 取引金額 > 100000 かつ 契約期間 >= 30日 の場合に成約
      
      レポート形式：
      - 日次レポート: 取引金額の合計、成約数、顧客満足度（テーブル形式）
      - 月次サマリー: 売上実績 vs 売上目標、受注実績 vs 受注目標、グラフ表示
      - 四半期レポート: 累計売上、累計受注数、トレンド分析（折れ線グラフ）
    `;

    // 【実行】構造化処理
    const result = structureHearingRecord(hearingRecordText);

    // 【検証】営業成果指標が正確に抽出・構造化されている
    expect(result.salesMetrics).toEqual([
      {
        name: "売上目標",
        value: "月次1000万円",
        type: "target",
      },
      {
        name: "受注数",
        value: "月次50件",
        type: "target",
      },
      {
        name: "顧客満足度",
        value: "90%以上",
        type: "threshold",
      },
    ]);

    // 【検証】データ項目が適切に分類・整理されている
    expect(result.dataItems).toEqual([
      {
        name: "顧客名",
        dataType: "text",
        unit: null,
        format: null,
      },
      {
        name: "取引金額",
        dataType: "number",
        unit: "円",
        format: null,
      },
      {
        name: "契約期間",
        dataType: "date",
        unit: null,
        format: "YYYY-MM-DD",
      },
      {
        name: "営業担当者名",
        dataType: "text",
        unit: null,
        format: null,
      },
      {
        name: "商品カテゴリ",
        dataType: "text",
        unit: null,
        format: null,
      },
    ]);

    // 【検証】計算ルールが正しく解析され、実行可能な形式に変換されている
    expect(result.calculationRules).toEqual([
      {
        ruleId: "discount_rule_001",
        name: "割引率の適用方法",
        condition: "契約期間が6ヶ月以上",
        formula: "取引金額 * 0.9",
        description: "契約期間が6ヶ月以上の場合、取引金額に10%割引を適用",
      },
      {
        ruleId: "commission_rule_001",
        name: "手数料計算ロジック",
        condition: null,
        formula: "(取引金額 - 割引額) * 0.03",
        description: "(取引金額 - 割引額) × 3% を営業手数料として計算",
      },
      {
        ruleId: "conclusion_rule_001",
        name: "成約判定条件",
        condition: "取引金額 > 100000 AND 契約期間 >= 30",
        formula: "IF(AND(transactionAmount > 100000, contractDays >= 30), TRUE, FALSE)",
        description: "取引金額 > 100000 かつ 契約期間 >= 30日 の場合に成約",
      },
    ]);

    // 【検証】レポート形式が指定通りに構造化されている
    expect(result.reportFormats).toEqual([
      {
        reportType: "daily",
        name: "日次レポート",
        metrics: ["取引金額の合計", "成約数", "顧客満足度"],
        displayFormat: "table",
        frequency: "daily",
      },
      {
        reportType: "monthly",
        name: "月次サマリー",
        metrics: ["売上実績 vs 売上目標", "受注実績 vs 受注目標"],
        displayFormat: "graph",
        frequency: "monthly",
      },
      {
        reportType: "quarterly",
        name: "四半期レポート",
        metrics: ["累計売上", "累計受注数", "トレンド分析"],
        displayFormat: "line_chart",
        frequency: "quarterly",
      },
    ]);

    // 【検証】構造化された全データが統一されたJSON形式で出力されている
    expect(result).toHaveProperty("salesMetrics");
    expect(result).toHaveProperty("dataItems");
    expect(result).toHaveProperty("calculationRules");
    expect(result).toHaveProperty("reportFormats");
    expect(result).toHaveProperty("exportedAt");

    // 【検証】exportedAt が ISO 8601 形式のタイムスタンプ
    expect(typeof result.exportedAt).toBe("string");
    expect(result.exportedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 【検証】構造化された全データが有効なJSON形式として表現可能
    const jsonOutput = JSON.stringify(result);
    expect(JSON.parse(jsonOutput)).toEqual(result);

    // 【検証】各要素が適切にタグ付けされている
    expect(result.dataItems[0]).toHaveProperty("name");
    expect(result.dataItems[0]).toHaveProperty("dataType");
    expect(result.calculationRules[0]).toHaveProperty("ruleId");
    expect(result.calculationRules[0]).toHaveProperty("formula");
    expect(result.reportFormats[0]).toHaveProperty("reportType");
    expect(result.reportFormats[0]).toHaveProperty("displayFormat");

    // 【検証】営業成果指標の項目数が正確
    expect(result.salesMetrics.length).toBe(3);

    // 【検証】データ項目の項目数が正確
    expect(result.dataItems.length).toBe(5);

    // 【検証】計算ルールの項目数が正確
    expect(result.calculationRules.length).toBe(3);

    // 【検証】レポート形式の項目数が正確
    expect(result.reportFormats.length).toBe(3);

    // 【検証】後続システム処理に必要なメタデータがすべて含まれている
    expect(result.calculationRules[0]).toHaveProperty("ruleId");
    expect(result.calculationRules[1]).toHaveProperty("formula");
    expect(result.reportFormats[0]).toHaveProperty("frequency");

    // 【検証】割引率の計算式が正確に解析されている
    expect(result.calculationRules[0].formula).toBe("取引金額 * 0.9");

    // 【検証】手数料計算ロジックが正確に解析されている
    expect(result.calculationRules[1].formula).toBe(
      "(取引金額 - 割引額) * 0.03"
    );

    // 【検証】成約判定条件の論理式が正確に変換されている
    expect(result.calculationRules[2].condition).toBe(
      "取引金額 > 100000 AND 契約期間 >= 30"
    );

    // 【検証】各データ項目のデータ型が正確に分類されている
    expect(result.dataItems.filter((item) => item.dataType === "text").length).toBe(
      3
    );
    expect(result.dataItems.filter((item) => item.dataType === "number").length).toBe(
      1
    );
    expect(result.dataItems.filter((item) => item.dataType === "date").length).toBe(
      1
    );

    // 【検証】レポート形式の表示方法が正確に指定されている
    expect(result.reportFormats[0].displayFormat).toBe("table");
    expect(result.reportFormats[1].displayFormat).toBe("graph");
    expect(result.reportFormats[2].displayFormat).toBe("line_chart");

    // 【検証】月次レポートメトリクスが2つ含まれている（売上実績 vs 売上目標、受注実績 vs 受注目標）
    expect(result.reportFormats[1].metrics.length).toBe(2);

    // 【検証】四半期レポートメトリクスが3つ含まれている（累計売上、累計受注数、トレンド分析）
    expect(result.reportFormats[2].metrics.length).toBe(3);

    // 【検証】日次レポートメトリクスが3つ含まれている
    expect(result.reportFormats[0].metrics.length).toBe(3);

    // 【検証】契約期間のデータ型が date で、形式が YYYY-MM-DD
    const contractPeriodItem = result.dataItems.find(
      (item) => item.name === "契約期間"
    );
    expect(contractPeriodItem?.dataType).toBe("date");
    expect(contractPeriodItem?.format).toBe("YYYY-MM-DD");

    // 【検証】取引金額のデータ型が number で、単位が円
    const transactionAmountItem = result.dataItems.find(
      (item) => item.name === "取引金額"
    );
    expect(transactionAmountItem?.dataType).toBe("number");
    expect(transactionAmountItem?.unit).toBe("円");

    // 【検証】顧客満足度が 90%以上 という閾値で正確に抽出されている
    const satisfactionMetric = result.salesMetrics.find(
      (metric) => metric.name === "顧客満足度"
    );
    expect(satisfactionMetric?.value).toBe("90%以上");

    // 【検証】売上目標が月次1000万円という目標値で正確に抽出されている
    const revenuTargetMetric = result.salesMetrics.find(
      (metric) => metric.name === "売上目標"
    );
    expect(revenuTargetMetric?.value).toBe("月次1000万円");

    // 【検証】受注数が月次50件という目標で正確に抽出されている
    const orderCountMetric = result.salesMetrics.find(
      (metric) => metric.name === "受注数"
    );
    expect(orderCountMetric?.value).toBe("月次50件");

    // 【検証】割引ルールの説明が完全に保持されている
    const discountRule = result.calculationRules.find(
      (rule) => rule.name === "割引率の適用方法"
    );
    expect(discountRule?.description).toBe(
      "契約期間が6ヶ月以上の場合、取引金額に10%割引を適用"
    );

    // 【検証】全体的な構造化データが漏れなく出力されている
    expect(Object.keys(result).length).toBeGreaterThanOrEqual(4);
  });
});