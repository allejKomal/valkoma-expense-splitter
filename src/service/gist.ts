// src/lib/gist.ts

import { gh } from "./git-api";

 
type GistFiles = Record<string, { content: string }>;

export async function createGist(opts: {
    description?: string;
    files: GistFiles;
    isPublic?: boolean;
}) {
    const { description = "", files, isPublic = false } = opts;
    const res = await gh.post("/gists", {
        description,
        public: isPublic,
        files,
    });
    return res.data as { id: string; html_url: string };
}

export async function updateGist(id: string, files: GistFiles, description?: string) {
    const body: Record<string, any> = { files };
    if (description) body.description = description;
    const res = await gh.patch(`/gists/${id}`, body);
    return res.data as { id: string; html_url: string };
}

export async function getGist(id: string) {
    const res = await gh.get(`/gists/${id}`);
    return res.data;
}

export async function deleteGist(id: string) {
    await gh.delete(`/gists/${id}`);
}

export async function upsertGist(opts: {
    storageKey: string;          // where we remember the gist id
    description?: string;
    fileName: string;
    content: string;
    isPublic?: boolean;
}) {
    const { storageKey, description, fileName, content, isPublic } = opts;
    let gistId = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);

    const files: GistFiles = {
        [fileName]: { content },
    };

    if (!gistId) {
        const created = await createGist({ description, files, isPublic });
        gistId = created.id;
        localStorage.setItem(storageKey, gistId); // persist for next time
        return created;
    }

    try {
        const updated = await updateGist(gistId, files, description);
        return updated;
    } catch (err: any) {
        // If gist was deleted/revoked, recreate
        if (err?.response?.status === 404) {
            const created = await createGist({ description, files, isPublic });
            localStorage.setItem(storageKey, created.id);
            return created;
        }
        throw err;
    }
}
