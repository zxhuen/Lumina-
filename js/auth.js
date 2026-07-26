import { supabaseClient } from "./supabase.js";

export async function getCurrentUser() {
    console.log("1. getCurrentUser started");

    const {
        data: { session },
    } = await supabaseClient.auth.getSession();

    console.log("2. Session:", session);

    if (!session) {
        console.log("3. No session");
        window.location.href = "/project/login.html";
        return null;
    }

    console.log("4. Calling backend");

    const response = await fetch("http://127.0.0.1:8000/User/get-current-user", {
        headers: {
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    console.log("5. Backend responded", response.status);

    const user = await response.json();

    console.log("6. User:", user);

    return user;
}