import { saveResponseContentStructured } from "../../src/logic/it-1-1-1";

describe("対応内容の構造化データ保存・ポータル反映機能", () => {
  test("SCEN-825: 対応内容が複数回更新された際に各バージョンが時系列で正確に構造化データとして保存される", () => {
    // テストデータ：営業対応内容レコード
    const recordId = "REC-20240115-001";
    const customerId = "CUST-00123";
    const userId1 = "USER-00001";
    const userId2 = "USER-00002";

    // ===== 初回対応内容の保存 =====
    const timestamp1 = new Date("2024-01-15T09:00:00Z");
    const firstResponse = {
      recordId,
      customerId,
      content: "初期対応: 顧客に製品説明を実施",
      userId: userId1,
      timestamp: timestamp1,
    };

    const result1 = saveResponseContentStructured(firstResponse);

    // 初回保存の検証
    expect(result1).toEqual({
      recordId,
      customerId,
      versionNumber: 1,
      content: "初期対応: 顧客に製品説明を実施",
      userId: userId1,
      createdAt: timestamp1,
      updatedAt: timestamp1,
      versions: [
        {
          versionNumber: 1,
          content: "初期対応: 顧客に製品説明を実施",
          userId: userId1,
          createdAt: timestamp1,
          updatedAt: timestamp1,
        },
      ],
    });

    expect(result1.versionNumber).toBe(1);
    expect(result1.versions.length).toBe(1);
    expect(result1.versions[0].versionNumber).toBe(1);
    expect(result1.versions[0].createdAt).toEqual(timestamp1);
    expect(result1.versions[0].updatedAt).toEqual(timestamp1);
    expect(result1.versions[0].userId).toBe(userId1);

    // ===== 2回目の対応内容に更新 =====
    const timestamp2 = new Date("2024-01-15T10:30:00Z");
    const secondResponse = {
      recordId,
      customerId,
      content: "追加対応: 技術仕様書を提供",
      userId: userId2,
      timestamp: timestamp2,
      previousVersions: result1.versions,
    };

    const result2 = saveResponseContentStructured(secondResponse);

    // 2回目保存の検証
    expect(result2).toEqual({
      recordId,
      customerId,
      versionNumber: 2,
      content: "追加対応: 技術仕様書を提供",
      userId: userId2,
      createdAt: timestamp1,
      updatedAt: timestamp2,
      versions: [
        {
          versionNumber: 1,
          content: "初期対応: 顧客に製品説明を実施",
          userId: userId1,
          createdAt: timestamp1,
          updatedAt: timestamp1,
        },
        {
          versionNumber: 2,
          content: "追加対応: 技術仕様書を提供",
          userId: userId2,
          createdAt: timestamp2,
          updatedAt: timestamp2,
        },
      ],
    });

    expect(result2.versionNumber).toBe(2);
    expect(result2.versions.length).toBe(2);
    expect(result2.versions[1].versionNumber).toBe(2);
    expect(result2.versions[1].content).toBe("追加対応: 技術仕様書を提供");
    expect(result2.versions[1].userId).toBe(userId2);
    expect(result2.versions[1].createdAt).toEqual(timestamp2);

    // バージョン間の時間差検証
    const timeDiffMs =
      result2.versions[1].createdAt.getTime() -
      result2.versions[0].createdAt.getTime();
    expect(timeDiffMs).toBe(90 * 60 * 1000); // 1時間30分 = 90分 = 5400秒 = 5400000ms

    // ===== 3回目の対応内容に更新 =====
    const timestamp3 = new Date("2024-01-15T14:15:00Z");
    const thirdResponse = {
      recordId,
      customerId,
      content: "最終対応: 契約条件について合意",
      userId: userId1,
      timestamp: timestamp3,
      previousVersions: result2.versions,
    };

    const result3 = saveResponseContentStructured(thirdResponse);

    // 3回目保存の検証
    expect(result3.versionNumber).toBe(3);
    expect(result3.versions.length).toBe(3);
    expect(result3.versions[2].versionNumber).toBe(3);
    expect(result3.versions[2].content).toBe("最終対応: 契約条件について合意");
    expect(result3.versions[2].userId).toBe(userId1);
    expect(result3.versions[2].createdAt).toEqual(timestamp3);

    // ===== 全バージョン履歴の時系列検証 =====
    // 時系列昇順確認
    expect(result3.versions[0].createdAt.getTime()).toBeLessThan(
      result3.versions[1].createdAt.getTime()
    );
    expect(result3.versions[1].createdAt.getTime()).toBeLessThan(
      result3.versions[2].createdAt.getTime()
    );

    // 全バージョンのメタデータ完全性確認
    expect(result3.versions[0]).toEqual({
      versionNumber: 1,
      content: "初期対応: 顧客に製品説明を実施",
      userId: userId1,
      createdAt: timestamp1,
      updatedAt: timestamp1,
    });

    expect(result3.versions[1]).toEqual({
      versionNumber: 2,
      content: "追加対応: 技術仕様書を提供",
      userId: userId2,
      createdAt: timestamp2,
      updatedAt: timestamp2,
    });

    expect(result3.versions[2]).toEqual({
      versionNumber: 3,
      content: "最終対応: 契約条件について合意",
      userId: userId1,
      createdAt: timestamp3,
      updatedAt: timestamp3,
    });

    // ===== ポータル反映の構造化データ検証 =====
    // ポータル表示用データの完全一致確認
    const portalDisplayData = {
      recordId: result3.recordId,
      customerId: result3.customerId,
      currentVersion: result3.versionNumber,
      currentContent: result3.content,
      currentUserId: result3.userId,
      lastUpdatedAt: result3.updatedAt,
      versionHistory: result3.versions.map((v) => ({
        versionNumber: v.versionNumber,
        content: v.content,
        userId: v.userId,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    };

    // ポータル表示内容とデータベース構造化データの完全一致
    expect(portalDisplayData.recordId).toBe(result3.recordId);
    expect(portalDisplayData.customerId).toBe(result3.customerId);
    expect(portalDisplayData.currentVersion).toBe(result3.versionNumber);
    expect(portalDisplayData.currentContent).toBe(result3.content);
    expect(portalDisplayData.currentUserId).toBe(result3.userId);
    expect(portalDisplayData.lastUpdatedAt).toEqual(result3.updatedAt);

    // ポータル表示の全バージョン履歴が保存済みデータと完全一致
    expect(portalDisplayData.versionHistory.length).toBe(3);
    expect(portalDisplayData.versionHistory).toEqual([
      {
        versionNumber: 1,
        content: "初期対応: 顧客に製品説明を実施",
        userId: userId1,
        createdAt: timestamp1,
        updatedAt: timestamp1,
      },
      {
        versionNumber: 2,
        content: "追加対応: 技術仕様書を提供",
        userId: userId2,
        createdAt: timestamp2,
        updatedAt: timestamp2,
      },
      {
        versionNumber: 3,
        content: "最終対応: 契約条件について合意",
        userId: userId1,
        createdAt: timestamp3,
        updatedAt: timestamp3,
      },
    ]);

    // ===== メタデータ改ざん検知 =====
    // 初回作成日時が変更されていないことを確認
    expect(result3.createdAt).toEqual(timestamp1);
    // 最終更新日時が3回目タイムスタンプであることを確認
    expect(result3.updatedAt).toEqual(timestamp3);

    // 各バージョンのメタデータが独立して保持されていることを確認
    result3.versions.forEach((v, index) => {
      expect(v.versionNumber).toBe(index + 1);
      expect(v.createdAt).toBeDefined();
      expect(v.updatedAt).toBeDefined();
      expect(v.userId).toBeDefined();
      expect(typeof v.versionNumber).toBe("number");
      expect(typeof v.content).toBe("string");
      expect(typeof v.userId).toBe("string");
    });

    // バージョン内용 순서 검증 (실제 시간 순서와 일치)
    for (let i = 0; i < result3.versions.length - 1; i++) {
      const currentTime = result3.versions[i].createdAt.getTime();
      const nextTime = result3.versions[i + 1].createdAt.getTime();
      expect(currentTime).toBeLessThan(nextTime);
    }

    // 최종 결과 통합 검증
    expect(result3).toMatchObject({
      recordId,
      customerId,
      versionNumber: 3,
      content: "최종対応: 契약条件について合意",
      userId: userId1,
    });

    expect(result3.versions.length).toBe(3);
    expect(result3.createdAt.getTime()).toBeLessThanOrEqual(
      result3.updatedAt.getTime()
    );
  });
});