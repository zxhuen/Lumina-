import { supabaseClient } from "./supabase.js";

export async function authFetch(url, options = {}) {
    const {
        data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return null;
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    if (response.status === 401) {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return null;
    }

    return response;
}