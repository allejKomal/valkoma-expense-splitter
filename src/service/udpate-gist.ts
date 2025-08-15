import type { Group } from "@/context/budget-context";
import { gh } from "./git-api";


export async function updateBudgetGist(gistId: string, groupData: Group) {
    const res = await gh.patch(`/gists/${gistId}`, {
        files: {
            "budget.json": {
                content: JSON.stringify(groupData, null, 2), // pretty JSON
            },
        },
    });

    return res.data; // returns updated gist object
}
