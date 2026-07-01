import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import {
  createSalesDataMetadata,
  updateSalesDataMetadata,
  getSalesDataMetadata,
  listSalesDataMetadata,
  applySalesDataMetadataToReports,
} from "../../src/logic/it-1781935279444-1-1-1";

fetchMock.enableMocks();

describe("営業データ項目メタデータ管理", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-751: [normal] 営業データメタデータ管理 - 営業データ項目のメタデータ（項目名・単位・データ型・計算ロジック・レポートマッピング）が一元管理される
  test("営業データ項目メタデータの作成・保存・編集・反映が正確に実行される", async () => {
    const metadata_id = "META-20240115-001";
    const item_name = "月間売上";
    const unit = "円";
    const data_type = "数値型";
    const calculation_logic = "売上合計 = 単価 × 数量";
    const report_mapping_ids = ["RPT-001", "RPT-002"];

    // ステップ1: 新しい営業データ項目メタデータを作成する
    const create_request = {
      item_name,
      unit,
      data_type,
      calculation_logic,
      report_mapping_ids,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        metadata_id,
        item_name,
        unit,
        data_type,
        calculation_logic,
        report_mapping_ids,
        created_at: "2024-01-15T09:00:00Z",
        created_by: "user_001",
      }),
      { status: 201 }
    );

    const create_response = await createSalesDataMetadata(create_request);

    expect(create_response.metadata_id).toBe(metadata_id);
    expect(create_response.item_name).toBe(item_name);
    expect(create_response.unit).toBe(unit);
    expect(create_response.data_type).toBe(data_type);
    expect(create_response.calculation_logic).toBe(calculation_logic);
    expect(create_response.report_mapping_ids).toEqual(report_mapping_ids);
    expect(create_response.created_at).toBe("2024-01-15T09:00:00Z");

    // ステップ2: 保存されたメタデータ項目の詳細画面を表示する
    fetchMock.mockResponseOnce(
      JSON.stringify({
        metadata_id,
        item_name,
        unit,
        data_type,
        calculation_logic,
        report_mapping_ids,
        created_at: "2024-01-15T09:00:00Z",
        updated_at: "2024-01-15T09:00:00Z",
        version: 1,
      }),
      { status: 200 }
    );

    const get_response = await getSalesDataMetadata({ metadata_id });

    expect(get_response.metadata_id).toBe(metadata_id);
    expect(get_response.item_name).toBe(item_name);
    expect(get_response.unit).toBe(unit);
    expect(get_response.data_type).toBe(data_type);
    expect(get_response.calculation_logic).toBe(calculation_logic);
    expect(get_response.report_mapping_ids).toEqual(report_mapping_ids);
    expect(get_response.version).toBe(1);

    // ステップ3: メタデータ一覧画面で作成した項目が表示されていることを確認する
    fetchMock.mockResponseOnce(
      JSON.stringify({
        metadata_items: [
          {
            metadata_id,
            item_name,
            unit,
            data_type,
            calculation_logic,
            report_mapping_ids,
            created_at: "2024-01-15T09:00:00Z",
            version: 1,
          },
        ],
        total_count: 1,
      }),
      { status: 200 }
    );

    const list_response = await listSalesDataMetadata({
      limit: 50,
      offset: 0,
    });

    expect(list_response.total_count).toBe(1);
    expect(list_response.metadata_items.length).toBe(1);
    expect(list_response.metadata_items[0].metadata_id).toBe(metadata_id);
    expect(list_response.metadata_items[0].item_name).toBe(item_name);
    expect(list_response.metadata_items[0].unit).toBe(unit);

    // ステップ4: メタデータ項目を編集し、単位を「万円」に変更する
    const updated_unit = "万円";
    const update_request = {
      metadata_id,
      item_name,
      unit: updated_unit,
      data_type,
      calculation_logic,
      report_mapping_ids,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        metadata_id,
        item_name,
        unit: updated_unit,
        data_type,
        calculation_logic,
        report_mapping_ids,
        updated_at: "2024-01-15T10:30:00Z",
        updated_by: "user_001",
        version: 2,
      }),
      { status: 200 }
    );

    const update_response = await updateSalesDataMetadata(update_request);

    expect(update_response.metadata_id).toBe(metadata_id);
    expect(update_response.unit).toBe(updated_unit);
    expect(update_response.version).toBe(2);
    expect(update_response.updated_at).toBe("2024-01-15T10:30:00Z");

    // ステップ5: 別の営業レポート画面でこの項目が正しくマッピングされているか確認する
    const apply_request = {
      metadata_id,
      report_ids: ["RPT-001", "RPT-002"],
      apply_to_all_reports: false,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        metadata_id,
        applied_report_count: 2,
        applied_reports: [
          {
            report_id: "RPT-001",
            report_name: "月次営業成果レポート",
            mapped_field: "monthly_sales",
            mapping_applied_at: "2024-01-15T10:30:00Z",
          },
          {
            report_id: "RPT-002",
            report_name: "顧客別成果指標レポート",
            mapped_field: "customer_sales",
            mapping_applied_at: "2024-01-15T10:30:00Z",
          },
        ],
      }),
      { status: 200 }
    );

    const apply_response = await applySalesDataMetadataToReports(
      apply_request
    );

    expect(apply_response.metadata_id).toBe(metadata_id);
    expect(apply_response.applied_report_count).toBe(2);
    expect(apply_response.applied_reports.length).toBe(2);
    expect(apply_response.applied_reports[0].report_id).toBe("RPT-001");
    expect(apply_response.applied_reports[0].report_name).toBe(
      "月次営業成果レポート"
    );
    expect(apply_response.applied_reports[0].mapped_field).toBe("monthly_sales");
    expect(apply_response.applied_reports[1].report_id).toBe("RPT-002");
    expect(apply_response.applied_reports[1].report_name).toBe(
      "顧客別成果指標レポート"
    );
    expect(apply_response.applied_reports[1].mapped_field).toBe("customer_sales");

    // ステップ6: 最終確認 - 更新後のメタデータが反映されていることを確認
    fetchMock.mockResponseOnce(
      JSON.stringify({
        metadata_id,
        item_name,
        unit: updated_unit,
        data_type,
        calculation_logic,
        report_mapping_ids,
        updated_at: "2024-01-15T10:30:00Z",
        version: 2,
        all_reports_synchronized: true,
      }),
      { status: 200 }
    );

    const final_get_response = await getSalesDataMetadata({ metadata_id });

    expect(final_get_response.unit).toBe(updated_unit);
    expect(final_get_response.version).toBe(2);
    expect(final_get_response.all_reports_synchronized).toBe(true);

    // エラーケース: 存在しないメタデータIDでの取得
    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "メタデータが見つかりません",
      }),
      { status: 404 }
    );

    const invalid_get_response = await getSalesDataMetadata({
      metadata_id: "INVALID-ID",
    });

    expect(invalid_get_response.error).toMatch(/メタデータ/);
  });
});