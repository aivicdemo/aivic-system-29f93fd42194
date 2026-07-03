import { extractContractChangeTimeline, calculateBillingDifference } from "../../src/logic/it-1-2-1";

describe("契約変更条件と請求パターンの差分可視化機能", () => {
  // SCEN-634
  test("契約変更前後の条件を時系列で抽出し請求額差分が正確に算出される", () => {
    // テストデータ準備: 契約ID、変更前条件、変更後条件、変更日時を含む契約変更レコード
    const contractId = "CONTRACT-001";
    const serviceId = "SERVICE-A";
    const customerId = "CUSTOMER-001";

    // 変更前条件: 基本料金 10,000円、成果報酬（アポ数）200円/件、数量 50件、割引率 5%
    const preChangeCondition = {
      contractId,
      serviceId,
      customerId,
      baseFee: 10000,
      performanceFeePerUnit: 200,
      unitType: "アポ数",
      quantity: 50,
      discountRate: 0.05,
      effectiveDate: "2024-01-01T00:00:00Z",
    };

    // 変更後条件: 基本料金 12,000円、成果報酬（アポ数）220円/件、数量 60件、割引率 10%
    const postChangeCondition = {
      contractId,
      serviceId,
      customerId,
      baseFee: 12000,
      performanceFeePerUnit: 220,
      unitType: "アポ数",
      quantity: 60,
      discountRate: 0.1,
      effectiveDate: "2024-02-01T00:00:00Z",
    };

    // 複数の契約変更が存在する場合のテスト用に、さらに 1 件追加
    const secondChangeCondition = {
      contractId,
      serviceId,
      customerId,
      baseFee: 13000,
      performanceFeePerUnit: 240,
      unitType: "アポ数",
      quantity: 70,
      discountRate: 0.08,
      effectiveDate: "2024-03-01T00:00:00Z",
    };

    const contractChangeHistory = [
      preChangeCondition,
      postChangeCondition,
      secondChangeCondition,
    ];

    // 契約変更前後の条件を時系列で抽出
    const extractedTimeline = extractContractChangeTimeline({
      contractId,
      contractChangeHistory,
    });

    // 抽出された条件が正確であることを検証
    expect(extractedTimeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          effectiveDate: "2024-01-01T00:00:00Z",
          baseFee: 10000,
          performanceFeePerUnit: 200,
          quantity: 50,
          discountRate: 0.05,
        }),
        expect.objectContaining({
          effectiveDate: "2024-02-01T00:00:00Z",
          baseFee: 12000,
          performanceFeePerUnit: 220,
          quantity: 60,
          discountRate: 0.1,
        }),
        expect.objectContaining({
          effectiveDate: "2024-03-01T00:00:00Z",
          baseFee: 13000,
          performanceFeePerUnit: 240,
          quantity: 70,
          discountRate: 0.08,
        }),
      ])
    );

    // 時系列順序が正しく並んでいることを確認
    expect(extractedTimeline[0].effectiveDate).toBe("2024-01-01T00:00:00Z");
    expect(extractedTimeline[1].effectiveDate).toBe("2024-02-01T00:00:00Z");
    expect(extractedTimeline[2].effectiveDate).toBe("2024-03-01T00:00:00Z");

    // 請求額計算: 変更前
    // 計算式: (基本料金 + (成果報酬 × 数量)) × (1 - 割引率)
    // = (10,000 + (200 × 50)) × (1 - 0.05)
    // = (10,000 + 10,000) × 0.95
    // = 20,000 × 0.95
    // = 19,000
    const preChangeBilling = calculateBillingDifference({
      preCondition: preChangeCondition,
      postCondition: null,
    });
    expect(preChangeBilling.preBillingAmount).toBe(19000);

    // 請求額計算: 変更後（1回目）
    // = (12,000 + (220 × 60)) × (1 - 0.1)
    // = (12,000 + 13,200) × 0.9
    // = 25,200 × 0.9
    // = 22,680
    const firstChangeBilling = calculateBillingDifference({
      preCondition: preChangeCondition,
      postCondition: postChangeCondition,
    });
    expect(firstChangeBilling.postBillingAmount).toBe(22680);

    // 請求額差分（1回目: 変更後 - 変更前）
    // = 22,680 - 19,000
    // = 3,680
    expect(firstChangeBilling.billingDifference).toBe(3680);

    // 請求額計算: 変更後（2回目）
    // = (13,000 + (240 × 70)) × (1 - 0.08)
    // = (13,000 + 16,800) × 0.92
    // = 29,800 × 0.92
    // = 27,416
    const secondChangeBilling = calculateBillingDifference({
      preCondition: postChangeCondition,
      postCondition: secondChangeCondition,
    });
    expect(secondChangeBilling.postBillingAmount).toBe(27416);

    // 請求額差分（2回目: 変更後 - 変更前）
    // = 27,416 - 22,680
    // = 4,736
    expect(secondChangeBilling.billingDifference).toBe(4736);

    // 複数の契約変更が存在する場合、各変更ごとの差分が正確に算出されていることを確認
    const allDifferences = [
      firstChangeBilling.billingDifference,
      secondChangeBilling.billingDifference,
    ];
    expect(allDifferences).toEqual([3680, 4736]);

    // 差分可視化機能で、契約変更前後の条件と請求額差分が正確に表示されることを検証
    const visualizationData = {
      contractId,
      serviceId,
      customerId,
      changeTimeline: extractedTimeline,
      billingChanges: [
        {
          changeIndex: 0,
          preCondition: preChangeCondition,
          postCondition: postChangeCondition,
          preBillingAmount: 19000,
          postBillingAmount: 22680,
          billingDifference: 3680,
          effectiveDate: "2024-02-01T00:00:00Z",
        },
        {
          changeIndex: 1,
          preCondition: postChangeCondition,
          postCondition: secondChangeCondition,
          preBillingAmount: 22680,
          postBillingAmount: 27416,
          billingDifference: 4736,
          effectiveDate: "2024-03-01T00:00:00Z",
        },
      ],
    };

    expect(visualizationData.changeTimeline).toHaveLength(3);
    expect(visualizationData.billingChanges).toHaveLength(2);
    expect(visualizationData.billingChanges[0].billingDifference).toBe(3680);
    expect(visualizationData.billingChanges[1].billingDifference).toBe(4736);
    expect(visualizationData.billingChanges[0].effectiveDate).toBe(
      "2024-02-01T00:00:00Z"
    );
    expect(visualizationData.billingChanges[1].effectiveDate).toBe(
      "2024-03-01T00:00:00Z"
    );
  });
});