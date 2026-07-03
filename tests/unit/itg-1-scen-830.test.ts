import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  getAgreedContentTimeline,
  AgreedContentItem,
  AgreedContentType,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-830
  it("顧客ポータル合意内容統合表示機能 - 営業責任者がポータルアクセス時、契約書・提案資料・メール履歴・納期情報が時系列順で一元表示される", () => {
    // Arrange: テスト用の合意内容データを準備
    const contractDocuments: AgreedContentItem[] = [
      {
        id: "contract_001",
        type: AgreedContentType.CONTRACT,
        title: "基本契約書 v2",
        timestamp: new Date("2024-03-15T10:30:00Z"),
        version: "v2",
        lastUpdatedBy: "営業担当太郎",
      },
      {
        id: "contract_002",
        type: AgreedContentType.CONTRACT,
        title: "基本契約書 v1",
        timestamp: new Date("2024-02-01T09:00:00Z"),
        version: "v1",
        lastUpdatedBy: "営業担当太郎",
      },
    ];

    const proposalDocuments: AgreedContentItem[] = [
      {
        id: "proposal_001",
        type: AgreedContentType.PROPOSAL,
        title: "提案資料 最新版",
        timestamp: new Date("2024-03-10T14:20:00Z"),
        version: "v3",
        lastUpdatedBy: "営業担当次郎",
      },
    ];

    const emailHistories: AgreedContentItem[] = [
      {
        id: "email_001",
        type: AgreedContentType.EMAIL,
        title: "契約変更について - 返信",
        timestamp: new Date("2024-03-16T11:45:00Z"),
        senderEmail: "customer@example.com",
        subject: "Re: 契約変更について",
      },
      {
        id: "email_002",
        type: AgreedContentType.EMAIL,
        title: "契約変更について",
        timestamp: new Date("2024-03-15T15:30:00Z"),
        senderEmail: "sales@company.com",
        subject: "契約変更について",
      },
    ];

    const deliveryInfo: AgreedContentItem[] = [
      {
        id: "delivery_001",
        type: AgreedContentType.DELIVERY,
        title: "成果物納期 - 2024年3月末",
        timestamp: new Date("2024-03-01T08:00:00Z"),
        deliveryDate: new Date("2024-03-31T23:59:59Z"),
        status: "予定通り",
      },
      {
        id: "delivery_002",
        type: AgreedContentType.DELIVERY,
        title: "成果物納期 - 2024年2月末（完了）",
        timestamp: new Date("2024-02-01T08:00:00Z"),
        deliveryDate: new Date("2024-02-29T23:59:59Z"),
        status: "完了",
      },
    ];

    const customerId = "customer_123";
    const contractId = "contract_a";

    // Act: 合意内容タイムラインを取得
    const result = getAgreedContentTimeline(
      customerId,
      contractId,
      [
        ...contractDocuments,
        ...proposalDocuments,
        ...emailHistories,
        ...deliveryInfo,
      ]
    );

    // Assert: 1. すべてのコンテンツが一元表示されること
    expect(result.items.length).toBe(7);

    // Assert: 2. 最新のコンテンツから古いコンテンツへと時系列順（降順）にソートされていること
    const timestamps = result.items.map((item) => item.timestamp.getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }

    // Assert: 3. 最新の合意内容が最上部に表示される（メール返信が最新）
    expect(result.items[0].id).toBe("email_001");
    expect(result.items[0].timestamp).toEqual(new Date("2024-03-16T11:45:00Z"));

    // Assert: 4. 古い合意内容が下部に表示される（2月の納期情報が最古）
    expect(result.items[result.items.length - 1].id).toBe("delivery_002");
    expect(result.items[result.items.length - 1].timestamp).toEqual(
      new Date("2024-02-01T08:00:00Z")
    );

    // Assert: 5. 複数の契約書がすべて時系列順で表示される
    const contractItems = result.items.filter(
      (item) => item.type === AgreedContentType.CONTRACT
    );
    expect(contractItems.length).toBe(2);
    expect(contractItems[0].id).toBe("contract_001");
    expect(contractItems[0].timestamp).toEqual(new Date("2024-03-15T10:30:00Z"));
    expect(contractItems[1].id).toBe("contract_002");
    expect(contractItems[1].timestamp).toEqual(new Date("2024-02-01T09:00:00Z"));

    // Assert: 6. メール履歴の送受信日時が正確に表示される
    const emailItems = result.items.filter(
      (item) => item.type === AgreedContentType.EMAIL
    );
    expect(emailItems.length).toBe(2);
    expect(emailItems[0].timestamp).toEqual(new Date("2024-03-16T11:45:00Z"));
    expect(emailItems[1].timestamp).toEqual(new Date("2024-03-15T15:30:00Z"));

    // Assert: 7. 全体の時系列順序が正確であることを確認
    const expectedOrder = [
      "email_001", // 2024-03-16T11:45:00Z
      "contract_001", // 2024-03-15T10:30:00Z
      "email_002", // 2024-03-15T15:30:00Z (実際には10:30より後)
      "proposal_001", // 2024-03-10T14:20:00Z
      "delivery_001", // 2024-03-01T08:00:00Z
      "contract_002", // 2024-02-01T09:00:00Z
      "delivery_002", // 2024-02-01T08:00:00Z
    ];

    // 正確な順序を確認（降順）
    expect(result.items[0].timestamp).toEqual(new Date("2024-03-16T11:45:00Z"));
    expect(result.items[1].timestamp).toEqual(new Date("2024-03-15T15:30:00Z"));
    expect(result.items[2].timestamp).toEqual(new Date("2024-03-15T10:30:00Z"));
    expect(result.items[3].timestamp).toEqual(new Date("2024-03-10T14:20:00Z"));
    expect(result.items[4].timestamp).toEqual(new Date("2024-03-01T08:00:00Z"));
    expect(result.items[5].timestamp).toEqual(new Date("2024-02-01T09:00:00Z"));
    expect(result.items[6].timestamp).toEqual(new Date("2024-02-01T08:00:00Z"));

    // Assert: 8. すべてのアイテムが適切にタイプ分類されていること
    const typeCount = {
      contract: 0,
      proposal: 0,
      email: 0,
      delivery: 0,
    };
    result.items.forEach((item) => {
      if (item.type === AgreedContentType.CONTRACT) typeCount.contract++;
      else if (item.type === AgreedContentType.PROPOSAL) typeCount.proposal++;
      else if (item.type === AgreedContentType.EMAIL) typeCount.email++;
      else if (item.type === AgreedContentType.DELIVERY) typeCount.delivery++;
    });

    expect(typeCount.contract).toBe(2);
    expect(typeCount.proposal).toBe(1);
    expect(typeCount.email).toBe(2);
    expect(typeCount.delivery).toBe(2);

    // Assert: 9. レスポンスが正しいスキーマで返されていること
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("customerId");
    expect(result).toHaveProperty("contractId");
    expect(result.customerId).toBe(customerId);
    expect(result.contractId).toBe(contractId);
  });
});