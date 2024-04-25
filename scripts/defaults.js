/**
 * Default layout and groups
 */
export let DEFAULTS = null
let spellGroupName = '';



Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    DEFAULTS = {
        layout: [
            {
                nestId: 'weapons',
                id: 'weapons',
                name: coreModule.api.Utils.i18n('PB.ItemTypeWeaponPlural'),
                groups: [
                    {
                        nestId: 'weapons_weapons',
                        id: 'weapons',
                        name: coreModule.api.Utils.i18n('PB.ItemTypeWeaponPlural'),
                        type: 'system'
                    }
                ]
            },
            {
                nestId: 'items',
                id: 'items',
                name: "Items",
                groups: [
                    {
                        nestId: 'items_items',
                        id: 'items',
                        name: "Items",
                        type: 'system'
                    }
                ]
            },
            {
                nestId: 'ship',
                id: 'ship',
                name: "Ship Actions",
                settings: {
                    style: 'list'
                },
                groups: [
                ]
            },
            {
                nestId: 'spells',
                id: 'spells',
                name: coreModule.api.Utils.i18n('PB.ItemTypeInvokable'),
                settings: {
                    style: 'list'
                },
                groups: [
                ]
            },
            {
                nestId: 'abilities',
                id: 'abilities',
                name: coreModule.api.Utils.i18n('PB.Test'),
                settings: {
                    style: 'list'
                },
                groups: [
                    {
                        nestId: 'abilities_abilities',
                        id: 'abilities',
                        name: 'Abilities',
                        type: 'system',
                    }
                ]

            },
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    {
                        nestId: 'utility_utility',
                        id: 'utility',
                        name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                        type: 'system'
                    }
                ]
            },
        ],
        groups: [
            { id: 'items_items', name: "Items", type: 'system' },
            { id: 'abilities_abilities', name: coreModule.api.Utils.i18n('PB.Test'), type: 'system' },
            { id: 'weapons_weapons', name: coreModule.api.Utils.i18n('PB.ItemTypeWeaponPlural'), type: 'system' },
            { id: 'utility_utility', name: coreModule.api.Utils.i18n('tokenActionHud.utility'), type: 'system' }
        ]
    }
})
