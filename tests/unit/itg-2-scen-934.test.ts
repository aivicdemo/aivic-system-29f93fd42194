import { recordJudgmentCriteriaVersion } from "../../src/logic/it-6-3-1";

describe("判定基準・学習データ版管理機能", () => {
  // SCEN-934: [edge] 版管理履歴が空の状態で変更を記録する際に初版として正しく登録される
  test("版管理履歴が空の状態で初回変更を記録する場合、版番号が1.0として自動採番され、すべてのメタデータが正確に登録される", () => {
    // === 前提条件: 版管理履歴が空の状態 ===
    const versionHistory: Array<{
      versionNumber: string;
      timestamp: string;
      changeContent: string;
      changedBy: string;
      changeType: string;
      status: string;
    }> = [];

    // === 入力: 初回変更内容 ===
    const changeRecord = {
      changeContent: "判定基準の追加: 工種別相場範囲を定義。過去案件データ100件以上参照。",
      changedBy: "user_admin_001",
      changeType: "criteria_definition",
      status: "approved",
    };

    const fixedTimestamp = "2024-02-15T10:30:45Z";

    // === 実行 ===
    const result = recordJudgmentCriteriaVersion(
      versionHistory,
      changeRecord,
      fixedTimestamp
    );

    // === 検証 ===
    // 1. 版番号が初版「1.0」として正しく採番されていること
    expect(result.versionNumber).toBe("1.0");

    // 2. タイムスタンプが正確に記録されていること
    expect(result.timestamp).toBe("2024-02-15T10:30:45Z");

    // 3. 変更内容が正確に記録されていること
    expect(result.changeContent).toBe(
      "判定基準の追加: 工種別相場範囲を定義。過去案件データ100件以上参照。"
    );

    // 4. 変更者情報が適切に記録されていること
    expect(result.changedBy).toBe("user_admin_001");

    // 5. 変更種別が正しく記録されていること
    expect(result.changeType).toBe("criteria_definition");

    // 6. ステータスが正しく設定されていること
    expect(result.status).toBe("approved");

    // 7. 返却されるオブジェクトが必須フィールドをすべて含んでいること
    expect(result).toHaveProperty("versionNumber");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("changeContent");
    expect(result).toHaveProperty("changedBy");
    expect(result).toHaveProperty("changeType");
    expect(result).toHaveProperty("status");

    // 8. 以後の変更では版番号が2.0以上にインクリメントされることを検証
    // (同じ入力で再度実行すると版番号が2.0になることを確認)
    const updatedHistory = [...versionHistory, result];

    const secondChangeRecord = {
      changeContent: "学習データの更新: 物価本新版v2を反映。地域別データ追加。",
      changedBy: "user_admin_002",
      changeType: "learning_data_update",
      status: "approved",
    };

    const secondTimestamp = "2024-02-16T09:15:30Z";

    const secondResult = recordJudgmentCriteriaVersion(
      updatedHistory,
      secondChangeRecord,
      secondTimestamp
    );

    expect(secondResult.versionNumber).toBe("2.0");
    expect(secondResult.timestamp).toBe("2024-02-16T09:15:30Z");
    expect(secondResult.changeContent).toBe(
      "学習データの更新: 物価本新版v2を反映。地域別データ追加。"
    );
    expect(secondResult.changedBy).toBe("user_admin_002");
    expect(secondResult.changeType).toBe("learning_data_update");
    expect(secondResult.status).toBe("approved");

    // 9. 版管理履歴に新しいレコードが追加可能であることを確認
    const finalHistory = [...updatedHistory, secondResult];
    expect(finalHistory).toHaveLength(2);
    expect(finalHistory[0].versionNumber).toBe("1.0");
    expect(finalHistory[1].versionNumber).toBe("2.0");
  });
});