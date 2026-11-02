/** Every step the wizard can show. Flows pick from this list; a step has no idea which flow it is in. */
export const STEPS = {
    welcome: { id: 'welcome', titleKey: 'setup.steps.welcome', component: () => import('./steps/WelcomeStep.vue') },
    database: { id: 'database', titleKey: 'setup.steps.database', component: () => import('./steps/DatabaseStep.vue') },
    admin: { id: 'admin', titleKey: 'setup.steps.admin', component: () => import('./steps/AdminStep.vue') },
    urls: { id: 'urls', titleKey: 'setup.steps.urls', component: () => import('./steps/UrlsStep.vue') },
    redis: { id: 'redis', titleKey: 'setup.steps.redis', component: () => import('./steps/RedisStep.vue') },
    services: { id: 'services', titleKey: 'setup.steps.services', component: () => import('./steps/ServicesStep.vue') },
    secrets: { id: 'secrets', titleKey: 'setup.steps.secrets', component: () => import('./steps/SecretsStep.vue') },
    recovered: { id: 'recovered', titleKey: 'setup.steps.recovered', component: () => import('./steps/RecoveredStep.vue') },
    finish: { id: 'finish', titleKey: 'setup.steps.finish', component: () => import('./steps/FinishStep.vue') },
};
/** The administrator is created right after the database so every later call is made by a signed-in administrator. */
export const FLOWS = {
    quick: ['welcome', 'database', 'admin', 'urls', 'finish'],
    recovery: ['database', 'recovered'],
    advanced: ['welcome', 'database', 'admin', 'urls', 'redis', 'services', 'secrets', 'finish'],
};
export function stepsFor(flow) {
    return FLOWS[flow].map((id) => STEPS[id]).filter((step) => step !== undefined);
}
/** Flows that are ready to offer. */
export const AVAILABLE_FLOWS = ['quick', 'advanced'];
