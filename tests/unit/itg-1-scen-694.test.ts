import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-694: [error] 営業データ完全性検証機能 - 保存済みの営業データから必須項目の欠落を自動検出し欠落項目を一覧表示する
  test("保存済みの営業データから必須項目の欠落を自動検出し欠落項目一覧を返す", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: "2024-01-15",
        transactionAmount: 500000,
        contractDate: "2024-01-10",
        appointmentStatus: "confirmed",
      },
      {
        recordId: "REC-002",
        customerName: null,
        contactDate: "2024-01-16",
        transactionAmount: 300000,
        contractDate: "2024-01-12",
        appointmentStatus: "pending",
      },
      {
        recordId: "REC-003",
        customerName: "株式会社B",
        contactDate: null,
        transactionAmount: null,
        contractDate: "2024-01-14",
        appointmentStatus: "confirmed",
      },
      {
        recordId: "REC-004",
        customerName: "株式会社C",
        contactDate: "2024-01-17",
        transactionAmount: 700000,
        contractDate: null,
        appointmentStatus: null,
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result).toEqual({
      isValid: false,
      incompletRecords: [
        {
          recordId: "REC-002",
          missingFields: ["customerName"],
        },
        {
          recordId: "REC-003",
          missingFields: ["contactDate", "transactionAmount"],
        },
        {
          recordId: "REC-004",
          missingFields: ["contractDate", "appointmentStatus"],
        },
      ],
      totalRecordsChecked: 4,
      totalIncompleteRecords: 3,
      completenessRate: 0.25,
    });

    expect(result.incompletRecords).toHaveLength(3);
    expect(result.incompletRecords[0].missingFields).toContain("customerName");
    expect(result.incompletRecords[1].missingFields).toContain("contactDate");
    expect(result.incompletRecords[1].missingFields).toContain(
      "transactionAmount"
    );
    expect(result.incompletRecords[2].missingFields).toContain("contractDate");
    expect(result.incompletRecords[2].missingFields).toContain(
      "appointmentStatus"
    );
    expect(result.totalRecordsChecked).toBe(4);
    expect(result.totalIncompleteRecords).toBe(3);
    expect(result.completenessRate).toBe(0.25);
  });

  test("すべての営業データが必須項目を満たしている場合は完全性検証に合格する", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: "2024-01-15",
        transactionAmount: 500000,
        contractDate: "2024-01-10",
        appointmentStatus: "confirmed",
      },
      {
        recordId: "REC-002",
        customerName: "株式会社B",
        contactDate: "2024-01-16",
        transactionAmount: 300000,
        contractDate: "2024-01-12",
        appointmentStatus: "pending",
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(true);
    expect(result.incompletRecords).toHaveLength(0);
    expect(result.totalRecordsChecked).toBe(2);
    expect(result.totalIncompleteRecords).toBe(0);
    expect(result.completenessRate).toBe(1.0);
  });

  test("空の営業データリストが渡された場合は適切に処理する", () => {
    const salesDataRecords: any[] = [];
    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(true);
    expect(result.incompletRecords).toHaveLength(0);
    expect(result.totalRecordsChecked).toBe(0);
    expect(result.totalIncompleteRecords).toBe(0);
    expect(result.completenessRate).toBe(1.0);
  });

  test("必須フィールドが空文字列の場合は欠落として検出する", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "",
        contactDate: "2024-01-15",
        transactionAmount: 500000,
        contractDate: "2024-01-10",
        appointmentStatus: "confirmed",
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(false);
    expect(result.incompletRecords).toHaveLength(1);
    expect(result.incompletRecords[0].missingFields).toContain("customerName");
  });

  test("必須フィールドが0の場合は有効な値として扱う", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: "2024-01-15",
        transactionAmount: 0,
        contractDate: "2024-01-10",
        appointmentStatus: "confirmed",
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(true);
    expect(result.incompletRecords).toHaveLength(0);
    expect(result.completenessRate).toBe(1.0);
  });

  test("必須フィールドが存在しないキーの場合は欠落として検出する", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: "2024-01-15",
        transactionAmount: 500000,
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(false);
    expect(result.incompletRecords).toHaveLength(1);
    expect(result.incompletRecords[0].missingFields).toContain("contractDate");
    expect(result.incompletRecords[0].missingFields).toContain(
      "appointmentStatus"
    );
  });

  test("必須フィールドリストが空の場合は全データが完全と判定する", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: null,
        contactDate: null,
      },
    ];

    const requiredFields: string[] = [];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(true);
    expect(result.incompletRecords).toHaveLength(0);
    expect(result.completenessRate).toBe(1.0);
  });

  test("複数の営業データから正確に欠落項目数を集計する", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: "2024-01-15",
        transactionAmount: 500000,
        contractDate: "2024-01-10",
        appointmentStatus: "confirmed",
        serviceType: "TypeA",
      },
      {
        recordId: "REC-002",
        customerName: null,
        contactDate: null,
        transactionAmount: 300000,
        contractDate: "2024-01-12",
        appointmentStatus: null,
        serviceType: null,
      },
      {
        recordId: "REC-003",
        customerName: "株式会社B",
        contactDate: "2024-01-17",
        transactionAmount: null,
        contractDate: null,
        appointmentStatus: "pending",
        serviceType: "TypeB",
      },
      {
        recordId: "REC-004",
        customerName: "株式会社C",
        contactDate: "2024-01-18",
        transactionAmount: 700000,
        contractDate: "2024-01-14",
        appointmentStatus: "confirmed",
        serviceType: "TypeC",
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
      "serviceType",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.totalRecordsChecked).toBe(4);
    expect(result.totalIncompleteRecords).toBe(2);
    expect(result.incompletRecords[0].recordId).toBe("REC-002");
    expect(result.incompletRecords[0].missingFields.length).toBe(3);
    expect(result.incompletRecords[1].recordId).toBe("REC-003");
    expect(result.incompletRecords[1].missingFields.length).toBe(2);
    expect(result.completenessRate).toBe(0.5);
  });

  test("undefined 値は欠落として検出する", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: undefined,
        transactionAmount: 500000,
        contractDate: "2024-01-10",
        appointmentStatus: "confirmed",
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(false);
    expect(result.incompletRecords).toHaveLength(1);
    expect(result.incompletRecords[0].missingFields).toContain("contactDate");
  });

  test("false 値は有効な値として扱う", () => {
    const salesDataRecords = [
      {
        recordId: "REC-001",
        customerName: "株式会社A",
        contactDate: "2024-01-15",
        transactionAmount: 500000,
        contractDate: "2024-01-10",
        appointmentStatus: false,
      },
    ];

    const requiredFields = [
      "customerName",
      "contactDate",
      "transactionAmount",
      "contractDate",
      "appointmentStatus",
    ];

    const result = validateSalesDataCompleteness(salesDataRecords, requiredFields);

    expect(result.isValid).toBe(true);
    expect(result.incompletRecords).toHaveLength(0);
  });
});