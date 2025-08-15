import { gh } from "./git-api";

// Hardcoded example Group data
const exampleGroup = {
    id: "group-1",
    name: "Expense Tracker",
    description: "Expense Tracker for Personal User",
    members: [
        { id: "p1", name: "You" },
    ],
    expenses: [
        {
            id: "e1",
            title: "Hotel",
            amount: 5000,
            paidBy: "p1",
            splits: [
                { participantId: "p1", amount: 2500 },
                { participantId: "p2", amount: 2500 },
            ],
            category: "accommodation",
            date: "2025-08-13",
            notes: "Two nights stay",
        },
    ],
    createdAt: new Date().toISOString(),
};

export async function createBudgetGist() {
    const res = await gh.post("/gists", {
        description: "Budget data for my app",
        public: false, // private gist
        files: {
            "budget.json": {
                content: JSON.stringify(exampleGroup, null, 2), // pretty JSON
            },
        },
    });

    return res.data; // returns the full gist object
}
