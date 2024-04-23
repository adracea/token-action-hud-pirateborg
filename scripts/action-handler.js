// System Module Imports
import { Utils } from './utils.js'

export let ActionHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */

    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */
        async buildSystemActions(groupIds) {
            this.updateGroup({ id: 'abilities', settings: { style: 'list', showTitle: false } })
            this.updateGroup({ id: 'abilities_abilities', settings: { style: 'list' } })

            if (this.actor) {
                this.buildCharacterActions();
            } else if (!this.actor) {
                this.buildMultipleTokenActions();
            }
            this.buildUtilityActions();
        }

        buildMultipleTokenActions() {

        }

        /**
         * Build character actions
         * @private
         */
        buildCharacterActions() {
            // Abilities
            const abilities = Object.keys(this.actor.system.abilities);
            const weapons = this.actor.items.filter(w => w.type === 'weapon');
            const abilityActions = [];
            const weaponActions = [];
            const itemActions = [];
            const items = this.actor.items.filter(i=>i.system.actionMacroLabel==="Use"&&i.type==="misc");
            for (let a in items){
                const name = items[a].name;
                const itemEncodedValue=["items",items[a].id].join('|');
                itemActions.push({name:name,id: a,encodedValue:itemEncodedValue})
            }
            this.addActions(itemActions, { id: 'items', type: 'system' })
            for (let a in abilities) {
                const name = game.i18n.localize('PB.Ability'+abilities[a][0].toUpperCase()+abilities[a].slice(1));
                const attributeEncodedValue = ['ability', abilities[a]].join('|');
                abilityActions.push({ name: name, id: a, encodedValue: attributeEncodedValue });
            }
            this.addActions(abilityActions, { id: 'abilities', type: 'system' })

            for (let a in weapons) {
                const name = game.i18n.localize(weapons[a].name);
                const weaponEncodedValue = ['weapons', weapons[a].id].join('|');
                weaponActions.push({ name: name, id: a, encodedValue: weaponEncodedValue });
            }
            const defendAction = {
                name: "Defend",
                encodedValue: ['weapons','defend'].join('|')
            };
            weaponActions.push(defendAction);

            this.addActions(weaponActions, { id: 'weapons', type: 'system' })
            this.buildSpellActions('invokable');
        }

        buildSpellActions(spellType) {
            const updateData = {
                id: 'spells',
                name: spellType,
                type: 'custom'
            }
            this.updateGroup(updateData);
            const spellGroupData = {
                id: 'spells',
                type: 'system',
                name: spellType
            }
            const parentGroupData = {
                id: 'spells',
                nestId: 'spells',
                type: 'custom'
            }
            this.addGroup(spellGroupData, parentGroupData, true);
            const spells = this.actor.items.filter(w => w.type === 'invokable');
            for (let a in spells) {
                const groupId = spells[a].system.invokableType;
                const groupName = spells[a].system.invokableType;
                const spellGroupData = {
                    id: groupId,
                    type: 'system',
                    name: groupName
                }
                const parentGroupData = {
                    id: 'spells',
                    type: 'system',
                    nestId: 'spells_spells'
                }
                this.addGroup(spellGroupData, parentGroupData, true);
                const name = spells[a].name;
                const id = spells[a].id;
                let spellEncodedValue = ['spells', id].join('|');
                let spellAction = { name: name, id: a, encodedValue: spellEncodedValue };
                this.addActions([spellAction], { id: groupId, type: 'system' });
            }

        }

        buildUtilityActions() {
            const utilityActions = [];
            const endTurnAction = {
                name: "End Turn",
                encodedValue: ['utility', 'endTurn'].join('|')
            }
            utilityActions.push(endTurnAction);
            this.addActions(utilityActions, { id: 'utility', type: 'system' })
        }

        /**
         * Build multiple token actions
         * @private
         * @returns {object}
         */
        #buildMultipleTokenActions() {
        }
    }
})
