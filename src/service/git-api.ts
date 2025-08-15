// src/lib/ghApi.ts
import axios from "axios";

export const gh = axios.create({
    baseURL: "https://api.github.com",
});

gh.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("gh_token");
    if (token) {
        // Use `set` method to add headers to the AxiosHeaders instance
        config.headers.set('Authorization', `Bearer ${token}`);
        config.headers.set('Accept', 'application/vnd.github+json');
        config.headers.set('X-GitHub-Api-Version', '2022-11-28');
    }
    return config;
});
