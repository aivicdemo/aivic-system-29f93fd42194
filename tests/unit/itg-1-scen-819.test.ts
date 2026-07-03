import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  recordConsultationWithTimestamp,
  retrieveConsultationHistory,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-819: [edge] 代表への相談受領・履歴管理機能 - 複数の相談が同一タイムスタンプで到達した場合も個別にタイムスタンプが付与されて記録される
  test("複数の相談が同一タイムスタンプで到達した場合、各相談に一意で異なるタイムスタンプが付与され、順序が保持される", () => {
    // 初期化
    const systemBaseTimestamp = new Date("2024-01-15T11:00:00.000Z");
    const consultationSubmitTimestamp = "2024-01-15T11:00:00.000Z";

    // 複数の相談データ（3件以上）を同じタイムスタンプ値で作成
    const consultation1 = {
      consultationId: "CONS-001",
      customerId: "CUST-101",
      consultationContent: "請求額に関する質問",
      submittedAt: consultationSubmitTimestamp,
      status: "pending",
    };

    const consultation2 = {
      consultationId: "CONS-002",
      customerId: "CUST-101",
      consultationContent: "納期変更について相談",
      submittedAt: consultationSubmitTimestamp,
      status: "pending",
    };

    const consultation3 = {
      consultationId: "CONS-003",
      customerId: "CUST-102",
      consultationContent: "契約条件の確認",
      submittedAt: consultationSubmitTimestamp,
      status: "pending",
    };

    // 複数の相談データを同時に相談受領APIに送信
    const result1 = recordConsultationWithTimestamp(consultation1);
    const result2 = recordConsultationWithTimestamp(consultation2);
    const result3 = recordConsultationWithTimestamp(consultation3);

    // 各相談レコードに付与されたタイムスタンプを確認
    expect(result1).toHaveProperty("recordedAt");
    expect(result2).toHaveProperty("recordedAt");
    expect(result3).toHaveProperty("recordedAt");

    const timestamp1 = new Date(result1.recordedAt);
    const timestamp2 = new Date(result2.recordedAt);
    const timestamp3 = new Date(result3.recordedAt);

    // 各相談レコードのタイムスタンプが互いに異なる値であることを検証
    expect(timestamp1.getTime()).not.toBe(timestamp2.getTime());
    expect(timestamp2.getTime()).not.toBe(timestamp3.getTime());
    expect(timestamp1.getTime()).not.toBe(timestamp3.getTime());

    // 各タイムスタンプがシステム基準時刻以降であることを確認
    expect(timestamp1.getTime()).toBeGreaterThanOrEqual(systemBaseTimestamp.getTime());
    expect(timestamp2.getTime()).toBeGreaterThanOrEqual(systemBaseTimestamp.getTime());
    expect(timestamp3.getTime()).toBeGreaterThanOrEqual(systemBaseTimestamp.getTime());

    // タイムスタンプの順序が相談受領の順序と一致していることを検証
    expect(timestamp1.getTime()).toBeLessThan(timestamp2.getTime());
    expect(timestamp2.getTime()).toBeLessThan(timestamp3.getTime());

    // 相談履歴取得
    const history = retrieveConsultationHistory({
      customerId: "CUST-101",
      startDate: "2024-01-15",
      endDate: "2024-01-15",
    });

    // 相談履歴表示画面で複数の相談が個別に表示されていることを確認
    expect(history).toHaveLength(2);

    const historyItem1 = history.find((h) => h.consultationId === "CONS-001");
    const historyItem2 = history.find((h) => h.consultationId === "CONS-002");

    expect(historyItem1).toBeDefined();
    expect(historyItem2).toBeDefined();

    // 履歴内のタイムスタンプも個別に記録されていることを確認
    const historyTimestamp1 = new Date(historyItem1!.recordedAt);
    const historyTimestamp2 = new Date(historyItem2!.recordedAt);

    expect(historyTimestamp1.getTime()).not.toBe(historyTimestamp2.getTime());
    expect(historyTimestamp1.getTime()).toBeLessThan(historyTimestamp2.getTime());

    // 全相談が一意のタイムスタンプを持つことを最終検証
    const allTimestamps = [result1.recordedAt, result2.recordedAt, result3.recordedAt];
    const uniqueTimestamps = new Set(allTimestamps);
    expect(uniqueTimestamps.size).toBe(3);
  });
});