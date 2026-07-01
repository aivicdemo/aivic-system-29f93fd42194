import { determinePriorityVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-796: 複数バージョン存在時の優先度ルール適用機能 - 優先度が同一の場合エラーを発生させる", () => {
    // テストデータ: 優先度が同一の複数バージョン
    const duplicatePriorityVersions = [
      {
        versionId: "v001",
        priority: 1,
        itemName: "アポ数",
        unit: "件",
        dataType: "number",
        calculationLogic: "COUNT",
        reportMapping: "appointment_count",
        createdAt: "2024-01-10T09:00:00Z",
        updatedAt: "2024-01-10T09:00:00Z"
      },
      {
        versionId: "v002",
        priority: 1,
        itemName: "アポ数",
        unit: "件",
        dataType: "number",
        calculationLogic: "COUNT",
        reportMapping: "appointment_count",
        createdAt: "2024-01-11T10:30:00Z",
        updatedAt: "2024-01-11T10:30:00Z"
      }
    ];

    // 優先度ルール適用機能を実行し、複数バージョンの競合を検出
    expect(() => {
      determinePriorityVersion(duplicatePriorityVersions);
    }).toThrow(/優先度/);

    // スローされた例外オブジェクトのエラーメッセージにバージョン情報が含まれることを確認
    try {
      determinePriorityVersion(duplicatePriorityVersions);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/v001|v002/);
      }
    }
  });

  test("SCEN-796: 複数バージョン存在時の優先度ルール適用機能 - 優先度が異なる場合は正しくバージョンを選定する", () => {
    // テストデータ: 優先度が異なる複数バージョン
    const differentPriorityVersions = [
      {
        versionId: "v003",
        priority: 2,
        itemName: "成約数",
        unit: "件",
        dataType: "number",
        calculationLogic: "COUNT",
        reportMapping: "contract_count",
        createdAt: "2024-01-10T09:00:00Z",
        updatedAt: "2024-01-10T09:00:00Z"
      },
      {
        versionId: "v004",
        priority: 1,
        itemName: "成約数",
        unit: "件",
        dataType: "number",
        calculationLogic: "COUNT",
        reportMapping: "contract_count",
        createdAt: "2024-01-11T10:30:00Z",
        updatedAt: "2024-01-11T10:30:00Z"
      }
    ];

    // 優先度ルール適用機能を実行し、最も優先度が高いバージョンを選定
    const result = determinePriorityVersion(differentPriorityVersions);

    // 期待結果: 優先度が 1 であるバージョン v004 が選定される
    expect(result.versionId).toBe("v004");
    expect(result.priority).toBe(1);
    expect(result.itemName).toBe("成約数");
    expect(result.calculationLogic).toBe("COUNT");
  });

  test("SCEN-796: 複数バージョン存在時の優先度ルール適用機能 - 単一バージョンの場合は正常に処理される", () => {
    // テストデータ: 単一バージョン
    const singleVersion = [
      {
        versionId: "v005",
        priority: 1,
        itemName: "顧客反応",
        unit: "段階",
        dataType: "string",
        calculationLogic: "CATEGORIZE",
        reportMapping: "customer_response",
        createdAt: "2024-01-12T14:00:00Z",
        updatedAt: "2024-01-12T14:00:00Z"
      }
    ];

    // 優先度ルール適用機能を実行
    const result = determinePriorityVersion(singleVersion);

    // 期待結果: 唯一のバージョン v005 が選定される
    expect(result.versionId).toBe("v005");
    expect(result.priority).toBe(1);
    expect(result.itemName).toBe("顧客反応");
    expect(result.dataType).toBe("string");
  });

  test("SCEN-796: 複数バージョン存在時の優先度ルール適用機能 - 空配列の場合はエラーを発生させる", () => {
    // テストデータ: 空配列
    const emptyVersions: never[] = [];

    // 優先度ルール適用機能を実行し、空配列エラーを検出
    expect(() => {
      determinePriorityVersion(emptyVersions);
    }).toThrow(/バージョン/);
  });

  test("SCEN-796: 複数バージョン存在時の優先度ルール適用機能 - 複数バージョンが全て異なる優先度を持つ場合は最高優先度を返す", () => {
    // テストデータ: 異なる優先度を持つ複数バージョン
    const multipleDifferentPriorities = [
      {
        versionId: "v006",
        priority: 3,
        itemName: "売上金額",
        unit: "円",
        dataType: "number",
        calculationLogic: "SUM",
        reportMapping: "sales_amount",
        createdAt: "2024-01-13T08:00:00Z",
        updatedAt: "2024-01-13T08:00:00Z"
      },
      {
        versionId: "v007",
        priority: 2,
        itemName: "売上金額",
        unit: "円",
        dataType: "number",
        calculationLogic: "SUM",
        reportMapping: "sales_amount",
        createdAt: "2024-01-14T09:00:00Z",
        updatedAt: "2024-01-14T09:00:00Z"
      },
      {
        versionId: "v008",
        priority: 1,
        itemName: "売上金額",
        unit: "円",
        dataType: "number",
        calculationLogic: "SUM",
        reportMapping: "sales_amount",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z"
      }
    ];

    // 優先度ルール適用機能を実行
    const result = determinePriorityVersion(multipleDifferentPriorities);

    // 期待結果: 最も優先度が高い v008 が選定される
    expect(result.versionId).toBe("v008");
    expect(result.priority).toBe(1);
    expect(result.reportMapping).toBe("sales_amount");
  });
});