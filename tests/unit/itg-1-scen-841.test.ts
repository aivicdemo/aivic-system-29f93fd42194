import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  updateContractDocument,
  getContractVersionHistory,
  compareContractVersions,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 契約書バージョン管理", () => {
  let fetchMock: any;

  beforeEach(() => {
    const fetch_module = require("jest-fetch-mock");
    fetchMock = fetch_module;
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  // SCEN-841
  test("既存契約書が更新されたときに最新版と過去版が一元管理される", async () => {
    const contract_id = "CONTRACT-2024-001";
    const previous_version = 1;
    const new_version = 2;
    const updated_by_user_id = "USER-ADMIN-001";
    const update_timestamp = new Date("2024-06-15T10:30:00Z");
    const previous_content =
      "Base contract terms for Customer A - Services X, Y";
    const updated_content =
      "Updated contract terms for Customer A - Services X, Y, Z with 10% discount";

    // 1. 契約書更新APIレスポンスモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        contract_id: contract_id,
        version_number: new_version,
        previous_version: previous_version,
        updated_content: updated_content,
        updated_by: updated_by_user_id,
        updated_at: update_timestamp.toISOString(),
        status: "ACTIVE",
      }),
      { status: 200 }
    );

    const update_result = await updateContractDocument({
      contract_id: contract_id,
      new_content: updated_content,
      updated_by: updated_by_user_id,
    });

    expect(update_result.contract_id).toBe(contract_id);
    expect(update_result.version_number).toBe(new_version);
    expect(update_result.previous_version).toBe(previous_version);
    expect(update_result.status).toBe("ACTIVE");

    // 2. バージョン履歴取得APIレスポンスモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        contract_id: contract_id,
        version_history: [
          {
            version_number: 2,
            content: updated_content,
            updated_by: updated_by_user_id,
            updated_at: "2024-06-15T10:30:00Z",
            is_latest: true,
          },
          {
            version_number: 1,
            content: previous_content,
            updated_by: "USER-ADMIN-000",
            updated_at: "2024-06-01T09:15:00Z",
            is_latest: false,
          },
        ],
        total_versions: 2,
      }),
      { status: 200 }
    );

    const version_history = await getContractVersionHistory({
      contract_id: contract_id,
    });

    expect(version_history.contract_id).toBe(contract_id);
    expect(version_history.total_versions).toBe(2);
    expect(version_history.version_history).toHaveLength(2);

    // 最新版が一覧の最初に表示される
    const latest_version = version_history.version_history[0];
    expect(latest_version.version_number).toBe(2);
    expect(latest_version.is_latest).toBe(true);
    expect(latest_version.content).toBe(updated_content);
    expect(latest_version.updated_by).toBe(updated_by_user_id);
    expect(latest_version.updated_at).toBe("2024-06-15T10:30:00Z");

    // 過去版が一覧に保持されている
    const previous_version_obj = version_history.version_history[1];
    expect(previous_version_obj.version_number).toBe(1);
    expect(previous_version_obj.is_latest).toBe(false);
    expect(previous_version_obj.content).toBe(previous_content);
    expect(previous_version_obj.updated_by).toBe("USER-ADMIN-000");
    expect(previous_version_obj.updated_at).toBe("2024-06-01T09:15:00Z");

    // 3. バージョン比較APIレスポンスモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        contract_id: contract_id,
        version_a: 2,
        version_b: 1,
        differences: [
          {
            field: "services_list",
            previous_value: "X, Y",
            current_value: "X, Y, Z",
            change_type: "ADDED",
          },
          {
            field: "discount_rate",
            previous_value: "0%",
            current_value: "10%",
            change_type: "MODIFIED",
          },
        ],
        summary: "Added service Z and applied 10% discount",
      }),
      { status: 200 }
    );

    const version_comparison = await compareContractVersions({
      contract_id: contract_id,
      version_a: 2,
      version_b: 1,
    });

    expect(version_comparison.contract_id).toBe(contract_id);
    expect(version_comparison.version_a).toBe(2);
    expect(version_comparison.version_b).toBe(1);
    expect(version_comparison.differences).toHaveLength(2);

    // 差分1: サービス追加
    expect(version_comparison.differences[0].field).toBe("services_list");
    expect(version_comparison.differences[0].previous_value).toBe("X, Y");
    expect(version_comparison.differences[0].current_value).toBe("X, Y, Z");
    expect(version_comparison.differences[0].change_type).toBe("ADDED");

    // 差分2: 割引率変更
    expect(version_comparison.differences[1].field).toBe("discount_rate");
    expect(version_comparison.differences[1].previous_value).toBe("0%");
    expect(version_comparison.differences[1].current_value).toBe("10%");
    expect(version_comparison.differences[1].change_type).toBe("MODIFIED");

    expect(version_comparison.summary).toBe(
      "Added service Z and applied 10% discount"
    );

    // 4. 整合性検証: バージョン番号の連続性
    expect(latest_version.version_number).toBe(
      previous_version_obj.version_number + 1
    );

    // 5. 整合性検証: 更新日時が最新版がより新しい
    const latest_timestamp = new Date(latest_version.updated_at);
    const previous_timestamp = new Date(previous_version_obj.updated_at);
    expect(latest_timestamp.getTime()).toBeGreaterThan(
      previous_timestamp.getTime()
    );
  });
});