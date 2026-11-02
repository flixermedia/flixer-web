import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Skeleton from '../ui/Skeleton.vue';
const { defineProps, } = {};
const props = defineProps();
const { t } = useI18n();
const title = computed(() => t(`admin.dashboard.widgets.${props.widget}`));
const compact = computed(() => ['services', 'updates', 'requests'].includes(props.widget));
const headerWidth = computed(() => (props.widget === 'shortcuts' ? 'w-28' : 'w-36'));
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
    __VLS_withDotValue(compact, {});
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        role: "status",
        'aria-label': (__VLS_unwrap(t, {})('common.loading')),
        'aria-busy': "true",
        ...{ class: "h-full" },
    });
    /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
    if (__VLS_ctx.widget === 'stats') {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "grid h-full grid-cols-2 gap-3 lg:grid-cols-5" },
        });
        /** @type {__VLS_StyleScopedClasses['grid']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
        /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
        /** @type {__VLS_StyleScopedClasses['lg:grid-cols-5']} */ ;
        const __VLS_0 = __VLS_tryAsConstant((5));
        for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_0))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                key: (n),
                ...{ class: "admin-card min-w-0 p-3" },
            });
            /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
            /** @type {__VLS_StyleScopedClasses['min-w-0']} */ ;
            /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
            const __VLS_1 = Skeleton;
            // @ts-ignore
            const __VLS_2 = __VLS_asFunctionalComponent1(__VLS_1, new __VLS_1({
                // @ts-ignore
                ...{ class: "h-3 w-16 max-w-full" },
            }));
            const __VLS_3 = __VLS_2({
                ...{ class: "h-3 w-16 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_2));
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
            const __VLS_6 = Skeleton;
            // @ts-ignore
            const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
                // @ts-ignore
                ...{ class: "mt-3 h-7 w-20 max-w-full" },
            }));
            const __VLS_8 = __VLS_7({
                ...{ class: "mt-3 h-7 w-20 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_7));
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
            // @ts-ignore
            [t, widget,];
        }
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
            ...{ class: "admin-card h-full overflow-hidden" },
            ...{ class: (compact.value ? 'p-3' : 'p-5') },
        });
        /** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
        /** @type {__VLS_StyleScopedClasses['h-full']} */ ;
        /** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({
            ...{ class: "truncate font-semibold tracking-tight" },
            ...{ class: (compact.value ? 'text-sm' : 'text-base') },
        });
        /** @type {__VLS_StyleScopedClasses['truncate']} */ ;
        /** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
        /** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "sr-only" },
        });
        /** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
        (__VLS_unwrap(title, {}));
        const __VLS_11 = Skeleton;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent1(__VLS_11, new __VLS_11({
            // @ts-ignore
            ...{ class: (__VLS_unwrap(headerWidth, {})) }, ...{ class: "h-4 max-w-full" },
        }));
        const __VLS_13 = __VLS_12({
            ...{ class: (__VLS_unwrap(headerWidth, {})) },
            ...{ class: "h-4 max-w-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
        /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        if (['server', 'storage', 'activity'].includes(__VLS_ctx.widget)) {
            const __VLS_16 = Skeleton;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-4/5 max-w-full" },
            }));
            const __VLS_18 = __VLS_17({
                ...{ class: "mt-2 h-3 w-4/5 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        }
        if (__VLS_ctx.widget === 'server') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_21 = Skeleton;
            // @ts-ignore
            const __VLS_22 = __VLS_asFunctionalComponent1(__VLS_21, new __VLS_21({
                // @ts-ignore
                ...{ class: "h-5 w-16 rounded-full" },
            }));
            const __VLS_23 = __VLS_22({
                ...{ class: "h-5 w-16 rounded-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_22));
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            const __VLS_26 = Skeleton;
            // @ts-ignore
            const __VLS_27 = __VLS_asFunctionalComponent1(__VLS_26, new __VLS_26({
                // @ts-ignore
                ...{ class: "h-5 w-16 rounded-full" },
            }));
            const __VLS_28 = __VLS_27({
                ...{ class: "h-5 w-16 rounded-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_27));
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: (compact.value ? 'mt-2' : 'mt-4') },
        });
        if (__VLS_ctx.widget === 'server') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                ...{ class: "grid gap-y-2" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
            const __VLS_31 = __VLS_tryAsConstant((7));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_31))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n),
                    ...{ class: "flex justify-between gap-4" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                const __VLS_32 = Skeleton;
                // @ts-ignore
                const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
                    // @ts-ignore
                    ...{ class: "h-3 w-2/5" },
                }));
                const __VLS_34 = __VLS_33({
                    ...{ class: "h-3 w-2/5" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_33));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
                const __VLS_37 = Skeleton;
                // @ts-ignore
                const __VLS_38 = __VLS_asFunctionalComponent1(__VLS_37, new __VLS_37({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/3" },
                }));
                const __VLS_39 = __VLS_38({
                    ...{ class: "h-3 w-1/3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_38));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
                // @ts-ignore
                [widget, widget, widget, compact, compact, compact, title, headerWidth,];
            }
        }
        else if (__VLS_ctx.widget === 'storage') {
            const __VLS_42 = Skeleton;
            // @ts-ignore
            const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
                // @ts-ignore
                ...{ class: "h-7 w-32 max-w-full" },
            }));
            const __VLS_44 = __VLS_43({
                ...{ class: "h-7 w-32 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_43));
            /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
            const __VLS_47 = Skeleton;
            // @ts-ignore
            const __VLS_48 = __VLS_asFunctionalComponent1(__VLS_47, new __VLS_47({
                // @ts-ignore
                ...{ class: "mt-3 h-2 w-full rounded-full" },
            }));
            const __VLS_49 = __VLS_48({
                ...{ class: "mt-3 h-2 w-full rounded-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_48));
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "mt-4 grid gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_52 = __VLS_tryAsConstant((3));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_52))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n),
                    ...{ class: "flex justify-between gap-4" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                const __VLS_53 = Skeleton;
                // @ts-ignore
                const __VLS_54 = __VLS_asFunctionalComponent1(__VLS_53, new __VLS_53({
                    // @ts-ignore
                    ...{ class: "h-3 w-2/5" },
                }));
                const __VLS_55 = __VLS_54({
                    ...{ class: "h-3 w-2/5" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_54));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
                const __VLS_58 = Skeleton;
                // @ts-ignore
                const __VLS_59 = __VLS_asFunctionalComponent1(__VLS_58, new __VLS_58({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/4" },
                }));
                const __VLS_60 = __VLS_59({
                    ...{ class: "h-3 w-1/4" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_59));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/4']} */ ;
                // @ts-ignore
                [widget,];
            }
        }
        else if (__VLS_ctx.widget === 'activity') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_63 = __VLS_tryAsConstant((3));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_63))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (n),
                    ...{ class: "space-y-2" },
                });
                /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
                const __VLS_64 = Skeleton;
                // @ts-ignore
                const __VLS_65 = __VLS_asFunctionalComponent1(__VLS_64, new __VLS_64({
                    // @ts-ignore
                    ...{ class: "h-3 w-4/5 max-w-full" },
                }));
                const __VLS_66 = __VLS_65({
                    ...{ class: "h-3 w-4/5 max-w-full" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_65));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
                /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
                const __VLS_69 = Skeleton;
                // @ts-ignore
                const __VLS_70 = __VLS_asFunctionalComponent1(__VLS_69, new __VLS_69({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/3" },
                }));
                const __VLS_71 = __VLS_70({
                    ...{ class: "h-3 w-1/3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_70));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
                // @ts-ignore
                [widget,];
            }
            const __VLS_74 = Skeleton;
            // @ts-ignore
            const __VLS_75 = __VLS_asFunctionalComponent1(__VLS_74, new __VLS_74({
                // @ts-ignore
                ...{ class: "mt-1 h-3 w-24" },
            }));
            const __VLS_76 = __VLS_75({
                ...{ class: "mt-1 h-3 w-24" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_75));
            /** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
        }
        else if (__VLS_ctx.widget === 'uptime') {
            const __VLS_79 = Skeleton;
            // @ts-ignore
            const __VLS_80 = __VLS_asFunctionalComponent1(__VLS_79, new __VLS_79({
                // @ts-ignore
                ...{ class: "h-9 w-32 max-w-full" },
            }));
            const __VLS_81 = __VLS_80({
                ...{ class: "h-9 w-32 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_80));
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-32']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
            const __VLS_84 = Skeleton;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent1(__VLS_84, new __VLS_84({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-3/4 max-w-full" },
            }));
            const __VLS_86 = __VLS_85({
                ...{ class: "mt-2 h-3 w-3/4 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        }
        else if (__VLS_ctx.widget === 'transcoding') {
            const __VLS_89 = Skeleton;
            // @ts-ignore
            const __VLS_90 = __VLS_asFunctionalComponent1(__VLS_89, new __VLS_89({
                // @ts-ignore
                ...{ class: "h-9 w-20" },
            }));
            const __VLS_91 = __VLS_90({
                ...{ class: "h-9 w-20" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_90));
            /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-20']} */ ;
            const __VLS_94 = Skeleton;
            // @ts-ignore
            const __VLS_95 = __VLS_asFunctionalComponent1(__VLS_94, new __VLS_94({
                // @ts-ignore
                ...{ class: "mt-3 h-2 w-full rounded-full" },
            }));
            const __VLS_96 = __VLS_95({
                ...{ class: "mt-3 h-2 w-full rounded-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_95));
            /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            const __VLS_99 = Skeleton;
            // @ts-ignore
            const __VLS_100 = __VLS_asFunctionalComponent1(__VLS_99, new __VLS_99({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-28 max-w-full" },
            }));
            const __VLS_101 = __VLS_100({
                ...{ class: "mt-2 h-3 w-28 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_100));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-28']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        }
        else if (__VLS_ctx.widget === 'libraries') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_104 = __VLS_tryAsConstant((4));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_104))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (n),
                    ...{ class: "flex justify-between gap-3" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                const __VLS_105 = Skeleton;
                // @ts-ignore
                const __VLS_106 = __VLS_asFunctionalComponent1(__VLS_105, new __VLS_105({
                    // @ts-ignore
                    ...{ class: "h-3 w-2/5" },
                }));
                const __VLS_107 = __VLS_106({
                    ...{ class: "h-3 w-2/5" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_106));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
                const __VLS_110 = Skeleton;
                // @ts-ignore
                const __VLS_111 = __VLS_asFunctionalComponent1(__VLS_110, new __VLS_110({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/3" },
                }));
                const __VLS_112 = __VLS_111({
                    ...{ class: "h-3 w-1/3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_111));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
                // @ts-ignore
                [widget, widget, widget,];
            }
        }
        else if (__VLS_ctx.widget === 'content-mix') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_115 = __VLS_tryAsConstant((5));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_115))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (n),
                });
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex justify-between gap-4" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
                const __VLS_116 = Skeleton;
                // @ts-ignore
                const __VLS_117 = __VLS_asFunctionalComponent1(__VLS_116, new __VLS_116({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/3" },
                }));
                const __VLS_118 = __VLS_117({
                    ...{ class: "h-3 w-1/3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_117));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
                const __VLS_121 = Skeleton;
                // @ts-ignore
                const __VLS_122 = __VLS_asFunctionalComponent1(__VLS_121, new __VLS_121({
                    // @ts-ignore
                    ...{ class: "h-3 w-10" },
                }));
                const __VLS_123 = __VLS_122({
                    ...{ class: "h-3 w-10" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_122));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
                const __VLS_126 = Skeleton;
                // @ts-ignore
                const __VLS_127 = __VLS_asFunctionalComponent1(__VLS_126, new __VLS_126({
                    // @ts-ignore
                    ...{ class: "mt-2 h-2 w-full rounded-full" },
                }));
                const __VLS_128 = __VLS_127({
                    ...{ class: "mt-2 h-2 w-full rounded-full" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_127));
                /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                // @ts-ignore
                [widget,];
            }
        }
        else if (__VLS_ctx.widget === 'services') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "flex flex-wrap gap-x-4 gap-y-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-x-4']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-y-2']} */ ;
            const __VLS_131 = __VLS_tryAsConstant((2));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_131))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (n),
                    ...{ class: "flex items-center gap-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
                const __VLS_132 = Skeleton;
                // @ts-ignore
                const __VLS_133 = __VLS_asFunctionalComponent1(__VLS_132, new __VLS_132({
                    // @ts-ignore
                    ...{ class: "h-3 w-14" },
                }));
                const __VLS_134 = __VLS_133({
                    ...{ class: "h-3 w-14" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_133));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-14']} */ ;
                const __VLS_137 = Skeleton;
                // @ts-ignore
                const __VLS_138 = __VLS_asFunctionalComponent1(__VLS_137, new __VLS_137({
                    // @ts-ignore
                    ...{ class: "h-5 w-16 rounded-full" },
                }));
                const __VLS_139 = __VLS_138({
                    ...{ class: "h-5 w-16 rounded-full" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_138));
                /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                // @ts-ignore
                [widget,];
            }
        }
        else if (__VLS_ctx.widget === 'queues' || __VLS_ctx.widget === 'users') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                ...{ class: "grid grid-cols-2 gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_142 = __VLS_tryAsConstant((4));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_142))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n),
                    ...{ class: "space-y-2" },
                });
                /** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
                const __VLS_143 = Skeleton;
                // @ts-ignore
                const __VLS_144 = __VLS_asFunctionalComponent1(__VLS_143, new __VLS_143({
                    // @ts-ignore
                    ...{ class: "h-3 w-16 max-w-full" },
                }));
                const __VLS_145 = __VLS_144({
                    ...{ class: "h-3 w-16 max-w-full" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_144));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
                /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
                const __VLS_148 = Skeleton;
                // @ts-ignore
                const __VLS_149 = __VLS_asFunctionalComponent1(__VLS_148, new __VLS_148({
                    // @ts-ignore
                    ...{ class: "h-7 w-10" },
                }));
                const __VLS_150 = __VLS_149({
                    ...{ class: "h-7 w-10" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_149));
                /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-10']} */ ;
                // @ts-ignore
                [widget, widget,];
            }
        }
        else if (__VLS_ctx.widget === 'updates') {
            const __VLS_153 = Skeleton;
            // @ts-ignore
            const __VLS_154 = __VLS_asFunctionalComponent1(__VLS_153, new __VLS_153({
                // @ts-ignore
                ...{ class: "h-5 w-28 max-w-full rounded-full" },
            }));
            const __VLS_155 = __VLS_154({
                ...{ class: "h-5 w-28 max-w-full rounded-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_154));
            /** @type {__VLS_StyleScopedClasses['h-5']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-28']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
            /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
            const __VLS_158 = Skeleton;
            // @ts-ignore
            const __VLS_159 = __VLS_asFunctionalComponent1(__VLS_158, new __VLS_158({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-4/5 max-w-full" },
            }));
            const __VLS_160 = __VLS_159({
                ...{ class: "mt-2 h-3 w-4/5 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_159));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        }
        else if (__VLS_ctx.widget === 'backups') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.dl, __VLS_intrinsics.dl)({
                ...{ class: "grid gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_163 = __VLS_tryAsConstant((3));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_163))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n),
                    ...{ class: "flex justify-between gap-3" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                const __VLS_164 = Skeleton;
                // @ts-ignore
                const __VLS_165 = __VLS_asFunctionalComponent1(__VLS_164, new __VLS_164({
                    // @ts-ignore
                    ...{ class: "h-3 w-2/5" },
                }));
                const __VLS_166 = __VLS_165({
                    ...{ class: "h-3 w-2/5" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_165));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
                const __VLS_169 = Skeleton;
                // @ts-ignore
                const __VLS_170 = __VLS_asFunctionalComponent1(__VLS_169, new __VLS_169({
                    // @ts-ignore
                    ...{ class: "h-3 w-1/3" },
                }));
                const __VLS_171 = __VLS_170({
                    ...{ class: "h-3 w-1/3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_170));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
                // @ts-ignore
                [widget, widget,];
            }
        }
        else if (__VLS_ctx.widget === 'requests') {
            const __VLS_174 = Skeleton;
            // @ts-ignore
            const __VLS_175 = __VLS_asFunctionalComponent1(__VLS_174, new __VLS_174({
                // @ts-ignore
                ...{ class: "h-8 w-24" },
            }));
            const __VLS_176 = __VLS_175({
                ...{ class: "h-8 w-24" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_175));
            /** @type {__VLS_StyleScopedClasses['h-8']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
            const __VLS_179 = Skeleton;
            // @ts-ignore
            const __VLS_180 = __VLS_asFunctionalComponent1(__VLS_179, new __VLS_179({
                // @ts-ignore
                ...{ class: "mt-2 h-3 w-4/5 max-w-full" },
            }));
            const __VLS_181 = __VLS_180({
                ...{ class: "mt-2 h-3 w-4/5 max-w-full" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_180));
            /** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
            /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
            /** @type {__VLS_StyleScopedClasses['w-4/5']} */ ;
            /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
        }
        else if (__VLS_ctx.widget === 'shortcuts') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex flex-wrap gap-2" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
            const __VLS_184 = __VLS_tryAsConstant((6));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_184))) {
                const __VLS_185 = Skeleton;
                // @ts-ignore
                const __VLS_186 = __VLS_asFunctionalComponent1(__VLS_185, new __VLS_185({
                    // @ts-ignore
                    key: (n), ...{ class: "h-9 w-24 rounded" },
                }));
                const __VLS_187 = __VLS_186({
                    key: (n),
                    ...{ class: "h-9 w-24 rounded" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_186));
                /** @type {__VLS_StyleScopedClasses['h-9']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-24']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                // @ts-ignore
                [widget, widget,];
            }
        }
        else if (__VLS_ctx.widget === 'streams') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
                ...{ class: "grid gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['grid']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_190 = __VLS_tryAsConstant((3));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_190))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
                    key: (n),
                    ...{ class: "rounded border border-flixer-border bg-flixer-background/60 p-3" },
                });
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                /** @type {__VLS_StyleScopedClasses['border']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['bg-flixer-background/60']} */ ;
                /** @type {__VLS_StyleScopedClasses['p-3']} */ ;
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    ...{ class: "flex items-center justify-between gap-3" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                const __VLS_191 = Skeleton;
                // @ts-ignore
                const __VLS_192 = __VLS_asFunctionalComponent1(__VLS_191, new __VLS_191({
                    // @ts-ignore
                    ...{ class: "h-4 w-2/5" },
                }));
                const __VLS_193 = __VLS_192({
                    ...{ class: "h-4 w-2/5" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_192));
                /** @type {__VLS_StyleScopedClasses['h-4']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-2/5']} */ ;
                const __VLS_196 = Skeleton;
                // @ts-ignore
                const __VLS_197 = __VLS_asFunctionalComponent1(__VLS_196, new __VLS_196({
                    // @ts-ignore
                    ...{ class: "h-6 w-16 rounded" },
                }));
                const __VLS_198 = __VLS_197({
                    ...{ class: "h-6 w-16 rounded" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_197));
                /** @type {__VLS_StyleScopedClasses['h-6']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                const __VLS_201 = Skeleton;
                // @ts-ignore
                const __VLS_202 = __VLS_asFunctionalComponent1(__VLS_201, new __VLS_201({
                    // @ts-ignore
                    ...{ class: "mt-3 h-3 w-3/4 max-w-full" },
                }));
                const __VLS_203 = __VLS_202({
                    ...{ class: "mt-3 h-3 w-3/4 max-w-full" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_202));
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
                /** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
                const __VLS_206 = Skeleton;
                // @ts-ignore
                const __VLS_207 = __VLS_asFunctionalComponent1(__VLS_206, new __VLS_206({
                    // @ts-ignore
                    ...{ class: "mt-3 h-2 w-full rounded-full" },
                }));
                const __VLS_208 = __VLS_207({
                    ...{ class: "mt-3 h-2 w-full rounded-full" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_207));
                /** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['h-2']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-full']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
                // @ts-ignore
                [widget,];
            }
        }
        else if (__VLS_ctx.widget === 'logs') {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "space-y-3" },
            });
            /** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "flex gap-3" },
            });
            /** @type {__VLS_StyleScopedClasses['flex']} */ ;
            /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
            const __VLS_211 = __VLS_tryAsConstant((4));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_211))) {
                const __VLS_212 = Skeleton;
                // @ts-ignore
                const __VLS_213 = __VLS_asFunctionalComponent1(__VLS_212, new __VLS_212({
                    // @ts-ignore
                    key: (n), ...{ class: "h-7 flex-1 rounded" },
                }));
                const __VLS_214 = __VLS_213({
                    key: (n),
                    ...{ class: "h-7 flex-1 rounded" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_213));
                /** @type {__VLS_StyleScopedClasses['h-7']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                // @ts-ignore
                [widget,];
            }
            const __VLS_217 = __VLS_tryAsConstant((5));
            for (const [n] of __VLS_vFor(__VLS_nonNull(__VLS_217))) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                    key: (n),
                    ...{ class: "flex items-center gap-3 border-t border-flixer-border py-2" },
                });
                /** @type {__VLS_StyleScopedClasses['flex']} */ ;
                /** @type {__VLS_StyleScopedClasses['items-center']} */ ;
                /** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-t']} */ ;
                /** @type {__VLS_StyleScopedClasses['border-flixer-border']} */ ;
                /** @type {__VLS_StyleScopedClasses['py-2']} */ ;
                const __VLS_218 = Skeleton;
                // @ts-ignore
                const __VLS_219 = __VLS_asFunctionalComponent1(__VLS_218, new __VLS_218({
                    // @ts-ignore
                    ...{ class: "h-3 w-16 shrink-0" },
                }));
                const __VLS_220 = __VLS_219({
                    ...{ class: "h-3 w-16 shrink-0" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_219));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-16']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                const __VLS_223 = Skeleton;
                // @ts-ignore
                const __VLS_224 = __VLS_asFunctionalComponent1(__VLS_223, new __VLS_223({
                    // @ts-ignore
                    ...{ class: "h-3 w-14 shrink-0 rounded" },
                }));
                const __VLS_225 = __VLS_224({
                    ...{ class: "h-3 w-14 shrink-0 rounded" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_224));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['w-14']} */ ;
                /** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
                /** @type {__VLS_StyleScopedClasses['rounded']} */ ;
                const __VLS_228 = Skeleton;
                // @ts-ignore
                const __VLS_229 = __VLS_asFunctionalComponent1(__VLS_228, new __VLS_228({
                    // @ts-ignore
                    ...{ class: "h-3 flex-1" },
                }));
                const __VLS_230 = __VLS_229({
                    ...{ class: "h-3 flex-1" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_229));
                /** @type {__VLS_StyleScopedClasses['h-3']} */ ;
                /** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
                // @ts-ignore
                [];
            }
        }
    }
    // @ts-ignore
    [];
    return {};
};
void [__VLS_template];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
