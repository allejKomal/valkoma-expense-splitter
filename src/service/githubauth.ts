// src/lib/githubAuth.ts
export function getRedirectUri() {
    const path = import.meta.env.VITE_GITHUB_REDIRECT_PATH || "/auth/";
    return `${window.location.origin}${path}`;
}

export function startGithubOauth() {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
    const redirectUri = getRedirectUri();
    const state = crypto.randomUUID();

    sessionStorage.setItem("gh_oauth_state", state);

    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scope", "gist"); // only what you need
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    // Optional: force re-consent if you want: url.searchParams.set("prompt", "consent");

    window.location.href = url.toString();
}
