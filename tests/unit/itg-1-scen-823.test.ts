import { describe, test, expect } from "@jest/globals";
import {
  saveInteractionRecord,
  retrieveInteractionHistory,
  updateInteractionRecord,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-823: 対応内容の構造化データ保存・ポータル反映機能
  test("対応内容がポータルに記録・更新された際に構造化データとして保存され、顧客企業が履歴参照可能になる", () => {
    // 初期状態: 営業ポータル画面で新規対応内容を入力
    const interaction_record_input = {
      customer_id: "CUST-001",
      interaction_date: "2024-01-15T10:30:00Z",
      interaction_content: "契約変更に関する顧客確認実施",
      interaction_person_name: "田中太郎",
      interaction_type: "確認対応",
      contract_id: "CONT-2024-001",
    };

    // 対応内容を保存
    const saved_record = saveInteractionRecord(interaction_record_input);

    // 保存結果の検証: 構造化データが正確に保存されたこと
    expect(saved_record).toBeDefined();
    expect(saved_record.record_id).toBeDefined();
    expect(typeof saved_record.record_id).toBe("string");
    expect(saved_record.customer_id).toBe("CUST-001");
    expect(saved_record.interaction_date).toBe("2024-01-15T10:30:00Z");
    expect(saved_record.interaction_content).toBe(
      "契約変更に関する顧客確認実施"
    );
    expect(saved_record.interaction_person_name).toBe("田中太郎");
    expect(saved_record.interaction_type).toBe("確認対応");
    expect(saved_record.contract_id).toBe("CONT-2024-001");
    expect(saved_record.created_at).toBeDefined();
    expect(saved_record.updated_at).toBeDefined();

    // 顧客企業ユーザーでポータルにログイン後、対応履歴を取得
    const customer_id = "CUST-001";
    const history_list = retrieveInteractionHistory(customer_id);

    // 対応履歴が正確に表示されることを確認
    expect(Array.isArray(history_list)).toBe(true);
    expect(history_list.length).toBeGreaterThan(0);

    const found_record = history_list.find(
      (h) => h.record_id === saved_record.record_id
    );
    expect(found_record).toBeDefined();
    expect(found_record?.customer_id).toBe("CUST-001");
    expect(found_record?.interaction_date).toBe("2024-01-15T10:30:00Z");
    expect(found_record?.interaction_content).toBe(
      "契約変更に関する顧客確認実施"
    );
    expect(found_record?.interaction_person_name).toBe("田中太郎");
    expect(found_record?.interaction_type).toBe("確認対応");

    // 対応内容を更新
    const updated_input = {
      record_id: saved_record.record_id,
      customer_id: "CUST-001",
      interaction_date: "2024-01-15T10:30:00Z",
      interaction_content: "契約変更内容の詳細説明を実施し顧客が了承",
      interaction_person_name: "田中太郎",
      interaction_type: "確認対応",
      contract_id: "CONT-2024-001",
    };

    const updated_record = updateInteractionRecord(updated_input);

    // 更新内容がデータベースに反映されたことを確認
    expect(updated_record).toBeDefined();
    expect(updated_record.record_id).toBe(saved_record.record_id);
    expect(updated_record.interaction_content).toBe(
      "契約変更内容の詳細説明を実施し顧客が了承"
    );
    expect(updated_record.updated_at).toBeDefined();
    expect(
      new Date(updated_record.updated_at).getTime() >=
        new Date(saved_record.created_at).getTime()
    ).toBe(true);

    // 更新後の対応履歴を再度確認
    const updated_history_list = retrieveInteractionHistory(customer_id);
    expect(updated_history_list.length).toBeGreaterThan(0);

    const updated_found_record = updated_history_list.find(
      (h) => h.record_id === saved_record.record_id
    );
    expect(updated_found_record).toBeDefined();
    expect(updated_found_record?.interaction_content).toBe(
      "契約変更内容の詳細説明を実施し顧客が了承"
    );
    expect(updated_found_record?.updated_at).toBe(updated_record.updated_at);
  });
});