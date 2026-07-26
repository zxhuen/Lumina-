import { getCurrentUser } from "./auth.js"; // Adjust import path if needed
import { supabaseClient } from "./supabase.js";

document.addEventListener('DOMContentLoaded', async() => {
    const avatarImg = document.getElementById('user-avatar');
    const avatarPlaceholder = document.getElementById('user-avatar-placeholder');
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const planEl = document.getElementById('user-plan');
    const changePlanBtn = document.getElementById('change-plan-btn');
    const logoutBtn = document.getElementById('logout-btn');

    try {
        // Fetch current user from your FastAPI /User/get-current-user endpoint
        const user = await getCurrentUser();

        // If no user/session was found, getCurrentUser handles the redirect
        if (!user) return;

        // 1. Populate User Details from Backend Response
        const displayName = user.display_name || 'User Account';
        const email = user.email || 'No email associated';
        const avatarUrl = user.avatar_url;

        // Extract plan name from nested premium_type object or fall back to 'FREE'
        const planName = (user.premium_type && user.premium_type.name) || 'FREE';

        nameEl.textContent = displayName;
        emailEl.textContent = email;
        planEl.textContent = planName.toUpperCase();

        // 2. Render Avatar or Initials Fallback
        if (avatarUrl) {
            avatarImg.src = avatarUrl;
            avatarImg.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            const initials = displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

            avatarPlaceholder.textContent = initials || 'U';
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'inline-block';
        }

    } catch (err) {
        console.error('Error rendering profile page:', err);
        if (typeof toast !== 'undefined') {
            toast.show('Failed to load profile details.', 'error');
        }
    }

    // 3. Change Plan Event Listener
    if (changePlanBtn) {
        changePlanBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toast.show('Subscription upgrade flow coming soon!', 'info');
        });
    }

    // 4. Logout Event Listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async(e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = '/project/login.html';
        });
    }
});