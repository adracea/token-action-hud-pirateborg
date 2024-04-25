// System Module Imports
import { Utils } from './utils.js'

export let ActionHandler = null
const getMethods = (obj) => {
    let properties = new Set()
    let currentObj = obj
    do {
        Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
    } while ((currentObj = Object.getPrototypeOf(currentObj)))
    return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}
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
            const items = this.actor.items.filter(i => i.system.actionMacroLabel === "Use" && i.type === "misc");
            for (let a in items) {
                const name = items[a].name;
                const itemEncodedValue = ["items", items[a].id].join('|');
                itemActions.push({ name: name, id: a, encodedValue: itemEncodedValue })
            }
            this.addActions(itemActions, { id: 'items', type: 'system' })
            for (let a in abilities) {
                const name = game.i18n.localize('PB.Ability' + abilities[a][0].toUpperCase() + abilities[a].slice(1));
                const attributeEncodedValue = ['ability', abilities[a]].join('|');
                abilityActions.push({ name: name, id: a, encodedValue: attributeEncodedValue });
            }
            this.addActions(abilityActions, { id: 'abilities', type: 'system' })
            if (!this.actor.type.includes("vehicle")) {
                for (let a in weapons) {
                    const name = game.i18n.localize(weapons[a].name);
                    const weaponEncodedValue = ['weapons', weapons[a].id].join('|');
                    weaponActions.push({ name: name, id: a, encodedValue: weaponEncodedValue });
                }
                const defendAction = {
                    name: "Defend",
                    encodedValue: ['weapons', 'defend'].join('|')
                };
                weaponActions.push(defendAction);

                this.addActions(weaponActions, { id: 'weapons', type: 'system' })
            }
            this.buildSpellActions('invokable');
            if (this.actor.type.includes("vehicle")) {
                this.buildBoatActions();
            }
        }

        buildBoatActions() {
            let pcactions = ["broadsides", "small-arms", "full-sail", "come-about", "repair"]
            const updateData = {
                id: 'ship',
                name: 'Ship Actions',
                type: 'custom'
            }
            this.updateGroup(updateData);
            const spellGroupData = {
                id: 'ship',
                type: 'system',
                name: 'Ship Actions'
            }
            const parentGroupData = {
                id: 'ship',
                nestId: 'ship',
                type: 'custom'
            }
            this.addGroup(spellGroupData, parentGroupData, true);
            let ability = getMethods(game.pirateborg.api.actions).filter(i => i.includes("ship"));
            if (this.actor.system.weapons.broadsides.quantity < 1) {
                ability = ability.filter(i => !i.includes("Broadsides"))
            }
            if (this.actor.system.weapons.smallArms.quantity < 1) {

                ability = ability.filter(i => !i.includes("SmallArms"))
            }
            if (this.actor.system.weapons.ram.die == '') {

                ability = ability.filter(i => !i.includes("Ram"))
            }
            ability = ability.filter(i => !i.includes("Rotate"))
            ability = ability.filter(i => !i.includes("Sink"))
            ability = ability.filter(i => !i.includes("Shant"))
            ability = ability.filter(i => !i.includes("Roll"))
            for (let i in ability) {
                const groupId = "crewaction"
                const groupName = "Crew Actions";
                const shipGroupData = {
                    id: groupId,
                    type: 'system',
                    name: groupName
                }
                const parentGroupData = {
                    id: 'ship',
                    type: 'system',
                    nestId: 'ship_ship'
                }
                this.addGroup(shipGroupData, parentGroupData, true);
                let name = ability[i].replace(/([A-Z])/g, ' $1').trim().split(" ").slice(1, -1).join(" ");
                let encName = name.toLowerCase().replaceAll(" ", "-");
                const boatEncodedValue = ["ship", encName].join('|');
                let boatAction = { name: name, id: i, encodedValue: boatEncodedValue };
                this.addActions([boatAction], { id: groupId, type: 'system' });
                if (pcactions.includes(encName)) {
                    const groupId2 = "pcaction"
                    const groupName2 = "PC Actions";
                    const shipGroupData2 = {
                        id: groupId2,
                        type: 'system',
                        name: groupName2
                    }
                    const parentGroupData2 = {
                        id: 'ship',
                        type: 'system',
                        nestId: 'ship_ship'
                    }
                    this.addGroup(shipGroupData2, parentGroupData2, true);
                    let boatAction = { name: name, id: i, encodedValue: boatEncodedValue + groupId2 };
                    this.addActions([boatAction], { id: groupId2, type: 'system' });
                }
            }
            let songs = this.actor.items.filter(i => i.type = "shanty")
            if (songs.length > 0) {
                const groupId = "shanties"
                const groupName = "Shanties";
                const shipGroupData = {
                    id: groupId,
                    type: 'system',
                    name: groupName
                }
                const parentGroupData = {
                    id: 'ship',
                    type: 'system',
                    nestId: 'ship_ship'
                }
                this.addGroup(shipGroupData, parentGroupData, true);
                for (let i in songs) {
                    let songAction = { name: songs[i].name, id: i, encodedValue: ["shanties", songs[i].id].join("|") }
                    this.addActions([songAction], { id: groupId, type: "system" })
                }
            }

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
            let spells = this.actor.items.filter(w => w.type === 'invokable');
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
