import { supabaseClient } from "./supabase.js";

export async function authFetch(url, options = {}) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "/project/login.html";
        return;
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${session.access_token}`,
        },
    });
}