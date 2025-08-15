import type { Group } from "@/context/budget-context";
import { getBudgetGist } from "./get-gist";
import { updateBudgetGist } from "./udpate-gist";
import { createBudgetGist } from "./creat-gist";


/**
 * Create or update a budget gist.
 * @param gistId - Existing gist ID if known, or null to create new
 * @param groupData - Group data to save
 * @returns The gist object from GitHub
 */
export async function upsertBudgetGist(
    gistId: string | null,
    groupData: Group
) {
    try {
        if (gistId) {
            // Try to fetch the gist
            await getBudgetGist(gistId);
            // If found, update
            return await updateBudgetGist(gistId, groupData);
        } else {
            // No ID given → create new gist
            return await createBudgetGist(groupData);
        }
    } catch (err: any) {
        // If fetching failed because gist doesn't exist → create it
        if (gistId && err?.response?.status === 404) {
            return await createBudgetGist(groupData);
        }
        throw err; // Other errors bubble up
    }
}
