import {
  recordProposalMaterialChangeHistory,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-827: [normal] 契約書・提案資料バージョン管理機能 - 提案資料が更新されたとき、変更内容が変更履歴テーブルに自動記録される
  test("提案資料が更新されるたびに、変更内容が変更履歴テーブルに正確に記録される", () => {
    // Arrange: テストデータとして提案資料を作成
    const proposal_material_id = "PM001";
    const updated_by_user_id = "USR001";
    const change_timestamp = new Date("2024-01-15T10:30:00Z");

    // 初期状態：変更履歴が空
    const initial_history: any[] = [];

    // 第1回目の更新：タイトルと金額を変更
    const first_update = {
      proposal_material_id,
      updated_by_user_id,
      change_timestamp,
      changes: [
        {
          field_name: "title",
          old_value: "提案資料 v1",
          new_value: "提案資料 v2",
        },
        {
          field_name: "amount",
          old_value: "100000",
          new_value: "120000",
        },
      ],
    };

    // 第1回目の変更履歴を記録
    let recorded_history = recordProposalMaterialChangeHistory(
      proposal_material_id,
      first_update.changes,
      updated_by_user_id,
      change_timestamp
    );

    // Assert: 第1回目の更新後、変更履歴テーブルに2件のレコードが作成されることを確認
    expect(recorded_history).toHaveLength(2);

    // Assert: 第1件目の変更履歴レコードを検証
    expect(recorded_history[0]).toEqual({
      proposal_material_id: "PM001",
      field_name: "title",
      old_value: "提案資料 v1",
      new_value: "提案資料 v2",
      changed_at: change_timestamp,
      changed_by: "USR001",
    });

    // Assert: 第2件目の変更履歴レコードを検証
    expect(recorded_history[1]).toEqual({
      proposal_material_id: "PM001",
      field_name: "amount",
      old_value: "100000",
      new_value: "120000",
      changed_at: change_timestamp,
      changed_by: "USR001",
    });

    // 第2回目の更新：有効期限を変更
    const second_update_timestamp = new Date("2024-01-15T11:00:00Z");
    const second_update = {
      proposal_material_id,
      updated_by_user_id,
      change_timestamp: second_update_timestamp,
      changes: [
        {
          field_name: "valid_until",
          old_value: "2024-12-31",
          new_value: "2025-06-30",
        },
      ],
    };

    // 第2回目の変更履歴を記録
    recorded_history = recordProposalMaterialChangeHistory(
      proposal_material_id,
      second_update.changes,
      updated_by_user_id,
      second_update_timestamp
    );

    // Assert: 第2回目の更新後、変更履歴テーブルに新たなレコードが追加されていることを確認
    // 合計3件のレコードが存在することを検証
    expect(recorded_history).toHaveLength(3);

    // Assert: 第3件目（第2回目の更新）の変更履歴レコードを検証
    expect(recorded_history[2]).toEqual({
      proposal_material_id: "PM001",
      field_name: "valid_until",
      old_value: "2024-12-31",
      new_value: "2025-06-30",
      changed_at: second_update_timestamp,
      changed_by: "USR001",
    });

    // Assert: 変更履歴が時系列順に正しく並んでいることを確認
    // 第1件目の変更日時 <= 第2件目の変更日時 <= 第3件目の変更日時
    expect(recorded_history[0].changed_at.getTime()).toBeLessThanOrEqual(
      recorded_history[1].changed_at.getTime()
    );
    expect(recorded_history[1].changed_at.getTime()).toBeLessThanOrEqual(
      recorded_history[2].changed_at.getTime()
    );

    // Assert: すべてのレコードが同じ proposal_material_id を持つことを確認
    recorded_history.forEach((record) => {
      expect(record.proposal_material_id).toBe("PM001");
    });

    // Assert: すべてのレコードが同じ changed_by ユーザーを持つことを確認
    recorded_history.forEach((record) => {
      expect(record.changed_by).toBe("USR001");
    });

    // Assert: 複数項目を同時に更新した場合、各項目ごとに個別レコードが作成されていることを確認
    // 第1回目の更新で2項目を同時に更新し、2件の個別レコードが作成されたことを検証
    const first_update_records = recorded_history.slice(0, 2);
    expect(first_update_records[0].field_name).toBe("title");
    expect(first_update_records[1].field_name).toBe("amount");
  });
});