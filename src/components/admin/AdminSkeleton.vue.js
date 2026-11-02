import { useI18n } from 'vue-i18n';
import Skeleton from '../ui/Skeleton.vue';
const { defineProps, withDefaults, } = {};
const __VLS_props = withDefaults(defineProps(), { rows: 2 });
const { t } = useI18n();
const rowClass = 'rounded border border-flixer-border bg-flixer-background/60';
const __VLS_defaults = { rows: 2 };
void __VLS_defaults;
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
void __VLS_ctx, __VLS_components, __VLS_intrinsics, __VLS_directives;
const __VLS_template = () => {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        role: "status",
        'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        'aria-busy': "true",
    });
    if (__VLS_ctx.variant === 'cards') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex flex-col gap-3" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        const __VLS_0 = __VLS_tryAsConstant((__VLS_ctx.rows));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (n),
                ...{ class: ([__VLS_unwrap(rowClass, {}), 'p-4']) },
            });
            /** @type {__VLS_StyleScopedClasses['p-4']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex min-w-0 flex-1 items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_1 = Skeleton;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                ...{ class: "h-4 w-40" },
            }));
            const __VLS_3 = __VLS_2({
                ...{ class: "h-4 w-40" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
            const __VLS_6 = Skeleton;
            // @ts-ignore
            const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
                // @ts-ignore
                ...{ class: "h-6 w-16 rounded" },
            }));
            const __VLS_8 = __VLS_7({
                ...{ class: "h-6 w-16 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_7));
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_11 = Skeleton;
            // @ts-ignore
            const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
                // @ts-ignore
                ...{ class: "h-7 w-24 rounded" },
            }));
            const __VLS_13 = __VLS_12({
                ...{ class: "h-7 w-24 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_12));
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_16 = Skeleton;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
                // @ts-ignore
                ...{ class: "h-7 w-20 rounded" },
            }));
            const __VLS_18 = __VLS_17({
                ...{ class: "h-7 w-20 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_21 = Skeleton;
            // @ts-ignore
            const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
                // @ts-ignore
                ...{ class: "h-7 w-16 rounded" },
            }));
            const __VLS_23 = __VLS_22({
                ...{ class: "h-7 w-16 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_22));
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_26 = Skeleton;
            // @ts-ignore
            const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
                // @ts-ignore
                ...{ class: "mt-3 h-3 w-2/5" },
            }));
            const __VLS_28 = __VLS_27({
                ...{ class: "mt-3 h-3 w-2/5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_27));
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
            // @ts-ignore
            [t, variant, rows, rowClass,];
        }
    }
    else if (__VLS_ctx.variant === 'tasks') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "flex flex-col gap-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
        const __VLS_31 = __VLS_tryAsConstant((__VLS_ctx.rows));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_31))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (n),
                ...{ class: ([__VLS_unwrap(rowClass, {}), 'p-3']) },
            });
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap items-start justify-between gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-start']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "min-w-0 flex-1" },
            });
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            const __VLS_32 = Skeleton;
            // @ts-ignore
            const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
                // @ts-ignore
                ...{ class: "h-3 w-3/5" },
            }));
            const __VLS_34 = __VLS_33({
                ...{ class: "h-3 w-3/5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_33));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3/5']} */ ;
            const __VLS_37 = Skeleton;
            // @ts-ignore
            const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-1/3" },
            }));
            const __VLS_39 = __VLS_38({
                ...{ class: "mt-2 h-3 w-1/3" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_38));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
            const __VLS_42 = Skeleton;
            // @ts-ignore
            const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
                // @ts-ignore
                ...{ class: "h-6 w-14 rounded" },
            }));
            const __VLS_44 = __VLS_43({
                ...{ class: "h-6 w-14 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_43));
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-14']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            // @ts-ignore
            [variant, rows, rowClass,];
        }
    }
    else if (__VLS_ctx.variant === 'table') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "overflow-x-auto" },
        });
        /** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex gap-4 pb-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
        const __VLS_47 = __VLS_tryAsConstant((5));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_47))) {
            const __VLS_48 = Skeleton;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                // @ts-ignore
                key: (n), ...{ class: "h-3 flex-1" },
            }));
            const __VLS_50 = __VLS_49({
                key: (n),
                ...{ class: "h-3 flex-1" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            // @ts-ignore
            [variant,];
        }
        const __VLS_53 = __VLS_tryAsConstant((__VLS_ctx.rows));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_53))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "flex items-center gap-4 border-t border-flixer-border py-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-1 items-center gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_54 = Skeleton;
            // @ts-ignore
            const __VLS_55 = __VLS_asFunctionalComponent1(__VLS_54, new __VLS_54({
                // @ts-ignore
                ...{ class: "size-8 shrink-0 rounded" },
            }));
            const __VLS_56 = __VLS_55({
                ...{ class: "size-8 shrink-0 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_55));
            /** @type {__VLS_StyleScopedClasses['size-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex-1 space-y-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
            const __VLS_59 = Skeleton;
            // @ts-ignore
            const __VLS_60 = __VLS_asFunctionalComponent1(__VLS_59, new __VLS_59({
                // @ts-ignore
                ...{ class: "h-3.5 w-28" },
            }));
            const __VLS_61 = __VLS_60({
                ...{ class: "h-3.5 w-28" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_60));
            /** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-28']} */ ;
            const __VLS_64 = Skeleton;
            // @ts-ignore
            const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
                // @ts-ignore
                ...{ class: "h-3 w-40" },
            }));
            const __VLS_66 = __VLS_65({
                ...{ class: "h-3 w-40" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_65));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-40']} */ ;
            const __VLS_69 = Skeleton;
            // @ts-ignore
            const __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
                // @ts-ignore
                ...{ class: "h-6 w-16 flex-1 rounded" },
            }));
            const __VLS_71 = __VLS_70({
                ...{ class: "h-6 w-16 flex-1 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_70));
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_74 = Skeleton;
            // @ts-ignore
            const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
                // @ts-ignore
                ...{ class: "h-6 w-16 flex-1 rounded" },
            }));
            const __VLS_76 = __VLS_75({
                ...{ class: "h-6 w-16 flex-1 rounded" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_75));
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            const __VLS_79 = Skeleton;
            // @ts-ignore
            const __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
                // @ts-ignore
                ...{ class: "h-3 flex-1" },
            }));
            const __VLS_81 = __VLS_80({
                ...{ class: "h-3 flex-1" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_80));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            const __VLS_84 = Skeleton;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
                // @ts-ignore
                ...{ class: "h-3 flex-1" },
            }));
            const __VLS_86 = __VLS_85({
                ...{ class: "h-3 flex-1" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
            // @ts-ignore
            [rows,];
        }
    }
    else if (__VLS_ctx.variant === 'stats') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-6" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid grid-cols-2 gap-3 lg:grid-cols-5" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:grid-cols-5']} */ ;
        const __VLS_89 = __VLS_tryAsConstant((5));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_89))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "rounded border border-flixer-border bg-flixer-surface/50 p-5" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
            const __VLS_90 = Skeleton;
            // @ts-ignore
            const __VLS_91 = __VLS_asFunctionalComponent1(__VLS_90, new __VLS_90({
                // @ts-ignore
                ...{ class: "h-3 w-16" },
            }));
            const __VLS_92 = __VLS_91({
                ...{ class: "h-3 w-16" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_91));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            const __VLS_95 = Skeleton;
            // @ts-ignore
            const __VLS_96 = __VLS_asFunctionalComponent1(__VLS_95, new __VLS_95({
                // @ts-ignore
                ...{ class: "mt-3 h-8 w-20" },
            }));
            const __VLS_97 = __VLS_96({
                ...{ class: "mt-3 h-8 w-20" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_96));
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
            // @ts-ignore
            [variant,];
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-6 lg:grid-cols-3" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
        const __VLS_100 = __VLS_tryAsConstant((3));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_100))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "rounded border border-flixer-border bg-flixer-surface/50 p-5" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-flixer-surface/50']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-5']} */ ;
            const __VLS_101 = Skeleton;
            // @ts-ignore
            const __VLS_102 = __VLS_asFunctionalComponent1(__VLS_101, new __VLS_101({
                // @ts-ignore
                ...{ class: "h-5 w-1/2" },
            }));
            const __VLS_103 = __VLS_102({
                ...{ class: "h-5 w-1/2" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_102));
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-1/2']} */ ;
            const __VLS_106 = Skeleton;
            // @ts-ignore
            const __VLS_107 = __VLS_asFunctionalComponent1(__VLS_106, new __VLS_106({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-4/5" },
            }));
            const __VLS_108 = __VLS_107({
                ...{ class: "mt-2 h-3 w-4/5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_107));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-5 space-y-3" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            const __VLS_111 = __VLS_tryAsConstant((4));
            for (const [m] of __VLS_vFor(__VLS_nonNull(__VLS_111))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (m),
                    ...{ class: "flex justify-between gap-4" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                const __VLS_112 = Skeleton;
                // @ts-ignore
                const __VLS_113 = __VLS_asFunctionalComponent1(__VLS_112, new __VLS_112({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/3" },
                }));
                const __VLS_114 = __VLS_113({
                    ...{ class: "h-3 w-1/3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_113));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
                const __VLS_117 = Skeleton;
                // @ts-ignore
                const __VLS_118 = __VLS_asFunctionalComponent1(__VLS_117, new __VLS_117({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/4" },
                }));
                const __VLS_119 = __VLS_118({
                    ...{ class: "h-3 w-1/4" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_118));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/4']} */ ;
                // @ts-ignore
                [];
            }
            // @ts-ignore
            [];
        }
    }
    else if (__VLS_ctx.variant === 'fields') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid gap-4 md:grid-cols-3" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
        const __VLS_122 = __VLS_tryAsConstant((__VLS_ctx.rows));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_122))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "space-y-2" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
            const __VLS_123 = Skeleton;
            // @ts-ignore
            const __VLS_124 = __VLS_asFunctionalComponent1(__VLS_123, new __VLS_123({
                // @ts-ignore
                ...{ class: "h-3 w-24" },
            }));
            const __VLS_125 = __VLS_124({
                ...{ class: "h-3 w-24" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_124));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
            const __VLS_128 = Skeleton;
            // @ts-ignore
            const __VLS_129 = __VLS_asFunctionalComponent1(__VLS_128, new __VLS_128({
                // @ts-ignore
                ...{ class: "h-9 w-full" },
            }));
            const __VLS_130 = __VLS_129({
                ...{ class: "h-9 w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_129));
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            // @ts-ignore
            [variant, rows,];
        }
    }
    else if (__VLS_ctx.variant === 'toggles') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex flex-col gap-4" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex items-center justify-between gap-4 py-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex']} */ ;
        /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
        /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "flex-1 space-y-2" },
        });
        /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
        /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
        const __VLS_133 = Skeleton;
        // @ts-ignore
        const __VLS_134 = __VLS_asFunctionalComponent1(__VLS_133, new __VLS_133({
            // @ts-ignore
            ...{ class: "h-4 w-1/3" },
        }));
        const __VLS_135 = __VLS_134({
            ...{ class: "h-4 w-1/3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_134));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
        const __VLS_138 = Skeleton;
        // @ts-ignore
        const __VLS_139 = __VLS_asFunctionalComponent1(__VLS_138, new __VLS_138({
            // @ts-ignore
            ...{ class: "h-3 w-3/5" },
        }));
        const __VLS_140 = __VLS_139({
            ...{ class: "h-3 w-3/5" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_139));
        /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-3/5']} */ ;
        const __VLS_143 = Skeleton;
        // @ts-ignore
        const __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
            // @ts-ignore
            ...{ class: "h-6 w-11 shrink-0 rounded-full" },
        }));
        const __VLS_145 = __VLS_144({
            ...{ class: "h-6 w-11 shrink-0 rounded-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_144));
        /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
        /** @type {__VLS_StyleScopedClasses['w-11']} */ ;
        /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
        /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        const __VLS_148 = __VLS_tryAsConstant((__VLS_ctx.rows));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_148))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "rounded border border-flixer-border p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['border']} */ ;
            /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex items-center justify-between gap-4 py-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
            const __VLS_149 = Skeleton;
            // @ts-ignore
            const __VLS_150 = __VLS_asFunctionalComponent1(__VLS_149, new __VLS_149({
                // @ts-ignore
                ...{ class: "h-4 w-1/3" },
            }));
            const __VLS_151 = __VLS_150({
                ...{ class: "h-4 w-1/3" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_150));
            /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
            const __VLS_154 = Skeleton;
            // @ts-ignore
            const __VLS_155 = __VLS_asFunctionalComponent1(__VLS_154, new __VLS_154({
                // @ts-ignore
                ...{ class: "h-6 w-11 shrink-0 rounded-full" },
            }));
            const __VLS_156 = __VLS_155({
                ...{ class: "h-6 w-11 shrink-0 rounded-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_155));
            /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-11']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            const __VLS_159 = Skeleton;
            // @ts-ignore
            const __VLS_160 = __VLS_asFunctionalComponent1(__VLS_159, new __VLS_159({
                // @ts-ignore
                ...{ class: "mt-1 h-3 w-24" },
            }));
            const __VLS_161 = __VLS_160({
                ...{ class: "mt-1 h-3 w-24" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_160));
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
            const __VLS_164 = Skeleton;
            // @ts-ignore
            const __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164({
                // @ts-ignore
                ...{ class: "mt-2 h-9 w-full" },
            }));
            const __VLS_166 = __VLS_165({
                ...{ class: "mt-2 h-9 w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_165));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            // @ts-ignore
            [variant, rows,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
            ...{ class: "grid gap-1" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
        const __VLS_169 = __VLS_tryAsConstant((__VLS_ctx.rows));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_169))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                key: (n),
                ...{ class: "flex items-center justify-between gap-3 rounded bg-white/5 px-3 py-1.5" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
            /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
            /** @type {__VLS_StyleScopedClasses['bg-white/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['px-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
            const __VLS_170 = Skeleton;
            // @ts-ignore
            const __VLS_171 = __VLS_asFunctionalComponent1(__VLS_170, new __VLS_170({
                // @ts-ignore
                ...{ class: "h-3 w-3/5" },
            }));
            const __VLS_172 = __VLS_171({
                ...{ class: "h-3 w-3/5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_171));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3/5']} */ ;
            const __VLS_175 = Skeleton;
            // @ts-ignore
            const __VLS_176 = __VLS_asFunctionalComponent1(__VLS_175, new __VLS_175({
                // @ts-ignore
                ...{ class: "h-3 w-12 shrink-0" },
            }));
            const __VLS_177 = __VLS_176({
                ...{ class: "h-3 w-12 shrink-0" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_176));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-12']} */ ;
            /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
            // @ts-ignore
            [rows,];
        }
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __defaults: __VLS_defaults,
    __typeProps: {},
});
export default {};
