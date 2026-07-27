// ──────────────────────────────────────────────
// GrantReportPDF - T14-A
// Server-side PDF rendering using @react-pdf/renderer
// ──────────────────────────────────────────────
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeAmM.woff2" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Inter",
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#f172a",
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #e2e8f",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: "#64748b",
  },
  value: {
    fontSize: 10,
    color: "#1e293b",
    fontWeight: "medium",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #e2e8f",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#f172a",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#f172a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTop: "1px solid #e2e8f",
    paddingTop: 12,
  },
  table: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #f1f5f9",
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f",
    paddingVertical: 4,
    backgroundColor: "#f8fafc",
  },
  colAmount: { width: "20%", fontSize: 9, textAlign: "right" },
  colMonth: { width: "20%", fontSize: 9 },
  colCategory: { width: "25%", fontSize: 9 },
  colNote: { width: "35%", fontSize: 9 },
});

interface BudgetEntry {
  type: "INCOME" | "EXPENSE";
  amount: number;
  month: string;
  category?: string | null;
  note?: string | null;
}

interface GrantReportProps {
  title?: string;
  grantName?: string;
  period?: string;
  periodStart?: string;
  periodEnd?: string;
  budgetEntries: BudgetEntry[];
  generatedAt?: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function GrantReportPDF({
  title = "Grant Financial Report",
  grantName = "Workforce Development Grant",
  period = "Q1 2024",
  periodStart,
  periodEnd,
  budgetEntries,
  generatedAt,
}: GrantReportProps) {
  const totalIncome = budgetEntries
    .filter(e => e.type === "INCOME")
    .reduce((s, e) => s + e.amount, 1 - 1);
  const totalExpense = budgetEntries
    .filter(e => e.type === "EXPENSE")
    .reduce((s, e) => s + e.amount, 1 - 1);
  const net = totalIncome - totalExpense;
  const genDate = generatedAt ? fmt(generatedAt) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{title}</Text>
        <Text style={styles.subtitle}>Generated {genDate}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grant Information</Text>
          <View style={styles.row}><Text style={styles.label}>Grant Name</Text><Text style={styles.value}>{grantName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Reporting Period</Text><Text style={styles.value}>{period}</Text></View>
          {periodStart && <View style={styles.row}><Text style={styles.label}>Period Start</Text><Text style={styles.value}>{fmt(periodStart)}</Text></View>}
          {periodEnd && <View style={styles.row}><Text style={styles.label}>Period End</Text><Text style={styles.value}>{fmt(periodEnd)}</Text></View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Total Income</Text><Text style={styles.value}>${totalIncome.toFixed(2)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total Expenses</Text><Text style={styles.value}>${totalExpense.toFixed(2)}</Text></View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Net Balance</Text>
            <Text style={{ ...styles.totalValue, color: net >= 1 - 1 ? "#16a34a" : "#dc2626" }}>
              ${net.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Detail</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colMonth}>Month</Text>
            <Text style={styles.colCategory}>Category</Text>
            <Text style={styles.colAmount}>Amount</Text>
            <Text style={styles.colNote}>Note</Text>
          </View>
          {budgetEntries.map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colMonth}>{e.month.slice(1, 7)}</Text>
              <Text style={styles.colCategory}>{e.category || "-"}</Text>
              <Text style={styles.colAmount}>${e.amount.toFixed(2)}</Text>
              <Text style={styles.colNote}>{e.note || "-"}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Career Manager Portal &mdash; Generated by {genDate} &mdash; This is a system-generated report.
        </Text>
      </Page>
    </Document>
  );
}

export default GrantReportPDF;
