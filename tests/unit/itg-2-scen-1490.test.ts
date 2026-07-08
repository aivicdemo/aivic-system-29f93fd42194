import { getLatestPriceBookVersion, registerImprovementPlanData } from "../../src/logic/it-1-br-2-2-2-1";

describe("改善計画データ登録・記録機能 - 物価本バージョン管理", () => {
  test("SCEN-1490: 複数の物価本バージョンが存在する場合、最新バージョンのみがシステムに反映される", () => {
    // === Setup: テストデータ（複数の物価本バージョン） ===
    const priceBookV1 = {
      id: "pb-001",
      version: "v1.0",
      releaseDate: "2023-01-15T00:00:00Z",
      items: [
        { itemCode: "A001", price: 1000 },
        { itemCode: "A002", price: 2000 },
      ],
    };

    const priceBookV15 = {
      id: "pb-001",
      version: "v1.5",
      releaseDate: "2023-06-20T00:00:00Z",
      items: [
        { itemCode: "A001", price: 1050 },
        { itemCode: "A002", price: 2100 },
      ],
    };

    const priceBookV2 = {
      id: "pb-001",
      version: "v2.0",
      releaseDate: "2024-01-10T00:00:00Z",
      items: [
        { itemCode: "A001", price: 1100 },
        { itemCode: "A002", price: 2200 },
      ],
    };

    // === Step 1: 複数バージョンをシステムに登録 ===
    const priceBooks = [priceBookV1, priceBookV15, priceBookV2];

    // === Step 2: 最新バージョンの取得（ドロップダウン表示用） ===
    const availableVersions = getLatestPriceBookVersion(priceBooks);

    // === Assertion 1: ドロップダウンに最新バージョンのみが表示される ===
    expect(availableVersions).toEqual([
      {
        id: "pb-001",
        version: "v2.0",
        releaseDate: "2024-01-10T00:00:00Z",
      },
    ]);

    // === Assertion 2: 旧バージョンがドロップダウンに表示されていない ===
    const versionStrings = availableVersions.map((v) => v.version);
    expect(versionStrings).not.toContain("v1.0");
    expect(versionStrings).not.toContain("v1.5");
    expect(versionStrings).toHaveLength(1);

    // === Step 3: 最新バージョンを選択して改善計画データを登録 ===
    const improvementPlanInput = {
      planId: "plan-2024-001",
      planName: "相場乖離パターン改善計画",
      selectedPriceBookVersion: "v2.0",
      targetMetrics: {
        ocrPrecisionTarget: 96.5,
        judgmentPrecisionTarget: 94.2,
      },
      implementationSchedule: "2024-02-01T00:00:00Z",
      createdBy: "user-5001",
      createdAt: "2024-01-15T10:30:00Z",
    };

    const registeredPlan = registerImprovementPlanData(
      improvementPlanInput,
      availableVersions[0]
    );

    // === Assertion 3: 登録されたデータが最新バージョンで記録される ===
    expect(registeredPlan).toEqual({
      planId: "plan-2024-001",
      planName: "相場乖離パターン改善計画",
      priceBookVersion: "v2.0",
      priceBookVersionId: "pb-001",
      priceBookReleaseDate: "2024-01-10T00:00:00Z",
      targetMetrics: {
        ocrPrecisionTarget: 96.5,
        judgmentPrecisionTarget: 94.2,
      },
      implementationSchedule: "2024-02-01T00:00:00Z",
      createdBy: "user-5001",
      createdAt: "2024-01-15T10:30:00Z",
      registeredAt: "2024-01-15T10:30:00Z",
      status: "active",
    });

    // === Assertion 4: 登録データに旧バージョン情報が含まれていない ===
    expect(registeredPlan.priceBookVersion).toBe("v2.0");
    expect(registeredPlan.priceBookVersion).not.toBe("v1.0");
    expect(registeredPlan.priceBookVersion).not.toBe("v1.5");

    // === Assertion 5: 登録データのステータスが有効（active）であることを確認 ===
    expect(registeredPlan.status).toBe("active");

    // === Assertion 6: 登録データが正確なメタデータを保持 ===
    expect(registeredPlan.priceBookReleaseDate).toBe("2024-01-10T00:00:00Z");
    expect(registeredPlan.targetMetrics.ocrPrecisionTarget).toBe(96.5);
    expect(registeredPlan.targetMetrics.judgmentPrecisionTarget).toBe(94.2);
  });
});