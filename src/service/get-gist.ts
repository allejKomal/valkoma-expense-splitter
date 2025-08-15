import type { Group } from "@/context/budget-context";
import { gh } from "./git-api";


export async function getBudgetGist(gistId: string): Promise<Group> {
    const res = await gh.get(`/gists/${gistId}`);

    const file = res.data.files?.["budget.json"];
    if (!file || !file.content) {
        throw new Error("budget.json not found in gist");
    }

    try {
        const group: Group = JSON.parse(file.content);
        return group;
    } catch {
        throw new Error("Invalid JSON in budget.json");
    }
}
