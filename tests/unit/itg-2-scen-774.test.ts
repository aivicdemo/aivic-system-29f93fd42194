import { describe, test, expect, beforeEach } from "@jest/globals";

const fetchMock = require("jest-fetch-mock");

describe("OCR精度・AI判定精度監視ダッシュボード - 精度実績データ存在チェック", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-774
  test("精度実績データが存在しない場合にエラーハンドリングが行われる", async () => {
    // ===== Arrange =====
    // 精度実績データが空配列の場合
    const empty_precision_data: any[] = [];
    fetchMock.mockResponseOnce(JSON.stringify({
      ocr_precision_records: empty_precision_data,
      ai_judgment_precision_records: empty_precision_data,
    }), { status: 200 });

    const { initializeDashboardWithPrecisionData } = await import(
      "../../src/logic/it-1-br-2-2-2-1"
    );

    // ===== Act =====
    let result: any = null;
    let error_message: string | null = null;

    try {
      result = await initializeDashboardWithPrecisionData();
    } catch (err: any) {
      error_message = err.message || String(err);
    }

    // ===== Assert =====
    // エラーハンドラーが正常に実行され、適切なエラーメッセージが返される
    expect(error_message).toMatch(/精度実績データ/);
    expect(result).toBeNull();

    // fetch が呼び出されたことを確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("精度実績データが null の場合にエラーハンドリングが行われる", async () => {
    // ===== Arrange =====
    // API が null を返す場合
    fetchMock.mockResponseOnce(JSON.stringify({
      ocr_precision_records: null,
      ai_judgment_precision_records: null,
    }), { status: 200 });

    const { initializeDashboardWithPrecisionData } = await import(
      "../../src/logic/it-1-br-2-2-2-1"
    );

    // ===== Act =====
    let error_thrown: boolean = false;
    let error_message: string | null = null;

    try {
      await initializeDashboardWithPrecisionData();
    } catch (err: any) {
      error_thrown = true;
      error_message = err.message || String(err);
    }

    // ===== Assert =====
    expect(error_thrown).toBe(true);
    expect(error_message).toMatch(/精度実績データ/);
  });

  test("API エラーレスポンス時にエラーハンドリングが行われる", async () => {
    // ===== Arrange =====
    // API が 500 エラーを返す場合
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );

    const { initializeDashboardWithPrecisionData } = await import(
      "../../src/logic/it-1-br-2-2-2-1"
    );

    // ===== Act =====
    let error_thrown: boolean = false;
    let error_message: string | null = null;

    try {
      await initializeDashboardWithPrecisionData();
    } catch (err: any) {
      error_thrown = true;
      error_message = err.message || String(err);
    }

    // ===== Assert =====
    expect(error_thrown).toBe(true);
    expect(error_message).toMatch(/API/);
  });

  test("正常なデータが存在する場合にダッシュボードが初期化される", async () => {
    // ===== Arrange =====
    // 正常な精度実績データの場合
    const normal_ocr_records = [
      {
        record_id: "ocr_001",
        measurement_date: "2024-01-15",
        ocr_precision_rate: 95.5,
        sample_count: 100,
      },
    ];
    const normal_ai_records = [
      {
        record_id: "ai_001",
        measurement_date: "2024-01-15",
        ai_judgment_precision_rate: 92.3,
        sample_count: 100,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify({
      ocr_precision_records: normal_ocr_records,
      ai_judgment_precision_records: normal_ai_records,
    }), { status: 200 });

    const { initializeDashboardWithPrecisionData } = await import(
      "../../src/logic/it-1-br-2-2-2-1"
    );

    // ===== Act =====
    const dashboard_result = await initializeDashboardWithPrecisionData();

    // ===== Assert =====
    expect(dashboard_result).not.toBeNull();
    expect(dashboard_result.ocr_precision_records).toEqual(normal_ocr_records);
    expect(dashboard_result.ai_judgment_precision_records).toEqual(normal_ai_records);
    expect(dashboard_result.dashboard_status).toBe("initialized");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("エラー状態からのシステム復帰可能性が確保される", async () => {
    // ===== Arrange =====
    // 最初の呼び出し: エラー
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: "Not Found" }),
      { status: 404 }
    );

    const { initializeDashboardWithPrecisionData } = await import(
      "../../src/logic/it-1-br-2-2-2-1"
    );

    // ===== Act & Assert (第1回目: エラー) =====
    let first_error: any = null;
    try {
      await initializeDashboardWithPrecisionData();
    } catch (err) {
      first_error = err;
    }
    expect(first_error).not.toBeNull();

    // ===== Arrange (リセット & 正常データを返すようにモック再設定) =====
    fetchMock.resetMocks();
    const recovery_records = [
      {
        record_id: "recovery_001",
        measurement_date: "2024-01-16",
        ocr_precision_rate: 96.0,
        sample_count: 150,
      },
    ];
    fetchMock.mockResponseOnce(JSON.stringify({
      ocr_precision_records: recovery_records,
      ai_judgment_precision_records: [],
    }), { status: 200 });

    // ===== Act & Assert (第2回目: 復帰) =====
    const recovery_result = await initializeDashboardWithPrecisionData();
    expect(recovery_result).not.toBeNull();
    expect(recovery_result.ocr_precision_records).toEqual(recovery_records);
    expect(recovery_result.dashboard_status).toBe("initialized");
  });
});