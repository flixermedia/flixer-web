import { createRouter, createWebHistory } from "vue-router";
import { clearAccessToken, getAccessToken } from "../api";
import { useProfile } from "../composables/useProfile";

declare module "vue-router" {
	interface RouteMeta {
		requiresAuth?: boolean;
		requiresAdmin?: boolean;
	}
}

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	scrollBehavior(_to, _from, savedPosition) {
		if (savedPosition) return savedPosition;
		return { top: 0, behavior: "smooth" };
	},
	routes: [
		{
			path: "/",
			name: "home",
			redirect: () => {
				const token = getAccessToken();
				return token ? "/admin/invites" : "/login";
			},
		},
		{
			path: "/login",
			name: "login",
			component: () => import("./views/InvitesLoginView.vue"),
		},
		{
			path: "/invite/:code",
			name: "invite",
			component: () => import("../views/InviteView.vue"),
		},
		{
			path: "/invites/:code",
			name: "invite-alias",
			redirect: (to) => `/invite/${to.params.code}`,
		},
		{
			path: "/verify-email",
			name: "verify-email",
			component: () => import("../views/VerifyEmailView.vue"),
		},
		{
			path: "/admin",
			name: "admin",
			redirect: "/admin/invites",
		},
		{
			path: "/admin/invites",
			name: "admin-invites",
			component: () => import("./views/InvitesAdminLayout.vue"),
			meta: { requiresAuth: true, requiresAdmin: true },
		},
		{
			path: "/admin/users",
			name: "admin-users",
			component: () => import("./views/InvitesAdminLayout.vue"),
			meta: { requiresAuth: true, requiresAdmin: true },
		},
		{
			path: "/admin/email",
			name: "admin-email",
			component: () => import("./views/InvitesAdminLayout.vue"),
			meta: { requiresAuth: true, requiresAdmin: true },
		},
		{
			path: "/admin/payments",
			name: "admin-payments",
			component: () => import("./views/InvitesAdminLayout.vue"),
			meta: { requiresAuth: true, requiresAdmin: true },
		},
		{
			path: "/:pathMatch(.*)*",
			redirect: "/",
		},
	],
});

router.beforeEach(async (to) => {
	const token = getAccessToken();
	const { profile, load: loadProfile } = useProfile();

	if (to.meta.requiresAuth) {
		if (!token) {
			return { path: "/login", query: { redirect: to.fullPath } };
		}
		if (!profile.value) {
			await loadProfile(true);
		}
		if (to.meta.requiresAdmin && profile.value?.role !== "admin") {
			clearAccessToken(true);
			return { path: "/login", query: { redirect: to.fullPath } };
		}
	} else if (to.path === "/login" && token) {
		if (!profile.value) {
			await loadProfile();
		}
		if (profile.value?.role === "admin") {
			return { path: "/admin/invites" };
		}
	}
});

export default router;
