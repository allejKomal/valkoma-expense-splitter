import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useBudget } from "@/context/budget-context";
import { Button } from "valkoma-package/primitive";
import { Download } from "lucide-react";
export default function ExpensesTab() {
    const { group, filterExpenses, optimizeDebts } = useBudget();
    const filteredExpenses = filterExpenses();
    const exportPDF = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
        });

        doc.setFontSize(18);
        doc.text("Expenses Report", 40, 40);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

        // Fixed columns
        const fixedColumns = [
            { header: "Title", dataKey: "title" },
            { header: "Amount", dataKey: "amount" },
            { header: "Category", dataKey: "category" },
            { header: "Paid By", dataKey: "paidBy" },
            { header: "Date", dataKey: "date" },
            { header: "Notes", dataKey: "notes" },
        ];

        // Dynamic member columns (strict single-line headers)
        const memberColumns = group.members.map(m => ({
            header: m.name.length > 12 ? m.name.slice(0, 9) + "…" : m.name,
            dataKey: m.id,
        }));

        // Combine all columns
        const columns = [...fixedColumns, ...memberColumns];

        // Prepare rows for autoTable
        const rows = filteredExpenses.map(expense => {
            const paidByMember = group.members.find(m => m.id === expense.paidBy);
            // Map participantId to amount owed (number only, no $)
            const splitsMap: Record<string, number> = {};
            expense.splits.forEach(s => {
                splitsMap[s.participantId] = s.amount;
            });

            return {
                title: expense.title,
                amount: expense.amount.toFixed(2), // number as string, single line
                category: expense.category,
                paidBy: paidByMember ? paidByMember.name : "Unknown",
                date: new Date(expense.date).toLocaleDateString(),
                notes: expense.notes || "-",
                ...group.members.reduce((acc, m) => {
                    acc[m.id] = splitsMap[m.id]?.toFixed(2) || "0";
                    return acc;
                }, {} as Record<string, string>),
            };
        });

        autoTable(doc, {
            columns,
            body: rows,
            startY: 80,
            styles: {
                fontSize: 8,
                cellPadding: 4,
                overflow: "ellipsize", // truncate long text with ellipsis
                valign: "middle",
                halign: "center",
                minCellHeight: 18,
                cellWidth: "wrap",
                lineWidth: 0.1,
                lineColor: [200, 200, 200],
            },
            headStyles: {
                fillColor: [30, 144, 255],
                textColor: 255,
                fontStyle: "bold",
                valign: "middle",
                halign: "center",
                cellPadding: 4,
            },
            columnStyles: {
                title: { cellWidth: 100, halign: "left" },
                amount: { cellWidth: 50, halign: "right" },
                category: { cellWidth: 70 },
                paidBy: { cellWidth: 80 },
                date: { cellWidth: 60 },
                notes: { cellWidth: 90, halign: "left" },
                // member columns: narrower, centered
                ...group.members.reduce((acc, m) => {
                    acc[m.id] = { cellWidth: 40 };
                    return acc;
                }, {} as Record<string, any>),
            },
            tableLineWidth: 0.2,
        });

        // Add summary section below the table
        const finalY = (doc as any).lastAutoTable.finalY + 30;

        doc.setFontSize(14);
        doc.text("Summary: Net Balances and Settlements", 40, finalY);

        const balances = group.members.reduce<Record<string, number>>((acc, m) => {
            acc[m.id] = 0;
            return acc;
        }, {});

        filteredExpenses.forEach(expense => {
            balances[expense.paidBy] += expense.amount;
            expense.splits.forEach(split => {
                balances[split.participantId] -= split.amount;
            });
        });

        const optimizedDebts = optimizeDebts();

        doc.setFontSize(10);
        let summaryY = finalY + 20;

        doc.text("Net Balances:", 40, summaryY);
        summaryY += 16;

        group.members.forEach(m => {
            const balance = balances[m.id];
            doc.text(`${m.name}: $${balance.toFixed(2)}`, 60, summaryY);
            summaryY += 14;
        });

        summaryY += 10;
        doc.text("Settlements Needed:", 40, summaryY);
        summaryY += 16;

        if (optimizedDebts.length === 0) {
            doc.text("No settlements needed. All balances are settled.", 60, summaryY);
        } else {
            optimizedDebts.forEach(({ from, to, amount }) => {
                const fromMember = group.members.find(m => m.id === from);
                const toMember = group.members.find(m => m.id === to);
                const line = `${fromMember?.name || "Unknown"} owes ${toMember?.name || "Unknown"} $${amount.toFixed(2)}`;
                doc.text(line, 60, summaryY);
                summaryY += 14;
            });
        }

        doc.save("expenses_report.pdf");
    };


    return (
        <Button onClick={exportPDF} className="mb-4">
            <Download />
            Export to PDF
        </Button>
    );
}
