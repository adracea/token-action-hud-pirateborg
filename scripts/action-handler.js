// System Module Imports
import { Utils } from "./utils.js";

export let ActionHandler = null;
const getMethods = (obj) => {
  let properties = new Set();
  let currentObj = obj;
  do {
    Object.getOwnPropertyNames(currentObj).map((item) => properties.add(item));
  } while ((currentObj = Object.getPrototypeOf(currentObj)));
  return [...properties.keys()].filter(
    (item) => typeof obj[item] === "function"
  );
};
Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
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
      this.updateGroup({
        id: "abilities",
        settings: { style: "list", showTitle: false },
      });
      this.updateGroup({
        id: "abilities_abilities",
        settings: { style: "list" },
      });

      if (this.actor) {
        if (this.actor.type == "creature") {
          this.buildCreatureActions();
        } else {
          this.buildCharacterActions();
        }
      } else if (!this.actor) {
        this.buildMultipleTokenActions();
      }
      this.buildUtilityActions();
    }

    /**
     * Build multiple tokens actions
     * @private
     */
    buildMultipleTokenActions() {}

    /**
     * Build creature actions
     * @private
     */
    buildCreatureActions() {
      const actions = [
        {
          name: "Reaction",
          img: "systems/pirateborg/icons/misc/surprised.png",
          id: 1,
          encodedValue: "actions|reaction",
        },
        {
          name: "Morale",
          img: "systems/pirateborg/icons/misc/ailment.png",
          id: 2,
          encodedValue: "actions|morale",
        },
        {
          name: "Initiative",
          img: "systems/pirateborg/icons/misc/awareness.png",
          id: 3,
          encodedValue: "actions|initiative",
        },
      ];

      this.addActions(actions, { id: "actions", type: "system" });
    }
    /**
     * Build character actions
     * @private
     */
    buildCharacterActions() {
      // Abilities
      const abilities = Object.keys(this.actor.system.abilities);
      const weapons = this.actor.items.filter((w) => w.type === "weapon");
      const abilityActions = [];
      const weaponActions = [];
      const itemActions = [];

      const items = this.actor.items.filter(
        (i) => i.system.actionMacroLabel === "Use" && i.type === "misc"
      );
      for (let a in items) {
        const name = items[a].name;
        const itemEncodedValue = ["items", items[a].id].join("|");
        itemActions.push({
          name: name,
          img: items[a].img,
          info1: {
            text:
              "(" +
              items[a].system.quantity +
              ")" +
              (items[a].system.uses ? " Uses: " + items[a].system.uses : ""),
          },
          id: a,
          encodedValue: itemEncodedValue,
        });
      }
      this.addActions(itemActions, { id: "items", type: "system" });
      for (let a in abilities) {
        const name = game.i18n.localize(
          "PB.Ability" + abilities[a][0].toUpperCase() + abilities[a].slice(1)
        );
        const attributeEncodedValue = ["ability", abilities[a]].join("|");
        abilityActions.push({
          name: name,
          img: "icons/svg/d20-highlight.svg",
          id: a,
          encodedValue: attributeEncodedValue,
        });
      }
      this.addActions(abilityActions, { id: "abilities", type: "system" });
      if (!this.actor.type.includes("vehicle")) {
        for (let a in weapons) {
          let name = game.i18n.localize(weapons[a].name);
          if (weapons[a].system.loadingCount > 0) {
            name =
              "Reload " +
              name +
              " (" +
              (weapons[a].system.reloadTime - weapons[a].system.loadingCount) +
              "/" +
              weapons[a].system.reloadTime +
              ")";
          }
          let info2 = "";
          if (weapons[a].system.ammoId) {
            let countAmmo = 0;
            this.actor.items
              .filter(
                (i) =>
                  i.name ==
                  this.actor.items.filter(
                    (j) => j.id == weapons[a].system.ammoId
                  )[0].name
              )
              .forEach((k) => (countAmmo += k.system.quantity));
            info2 = { text: "Shots Remainig: " + countAmmo };
          }
          const weaponEncodedValue = ["weapons", weapons[a].id].join("|");
          weaponActions.push({
            name: name,
            img: weapons[a].img,
            id: a,
            info2: info2,
            encodedValue: weaponEncodedValue,
          });
        }

        this.addActions(weaponActions, { id: "weapons", type: "system" });
      }
      this.buildSpellActions("invokable");
      if (this.actor.type.includes("vehicle")) {
        this.buildBoatActions();
      } else {
        const defendAction = {
          name: "Defend",
          img: "icons/svg/shield.svg",
          id: 1,
          encodedValue: ["actions", "defend"].join("|"),
        };
        const initiativeAction = {
          name: "Initiative",
          id: 2,
          img: "systems/pirateborg/icons/misc/awareness.png",
          encodedValue: ["actions", "initiative"].join("|"),
        };
        const partyInitiativeAction = {
          name: "Party Initiative",
          id: 3,
          img: "systems/pirateborg/icons/misc/minions.png",
          encodedValue: ["actions", "partyinitiative"].join("|"),
        };
        this.addActions(
          [defendAction, initiativeAction, partyInitiativeAction],
          { id: "actions", type: "system" }
        );
      }
    }

    buildBoatActions() {
      let iconlist = {
        broadsides: "systems/pirateborg/icons/misc/broadside.png",
        "small-arms": "systems/pirateborg/icons/misc/small-arm.png",
        repair: "systems/pirateborg/icons/misc/repair.png",
        ram: "systems/pirateborg/icons/misc/ram.png",
        "full-sail": "systems/pirateborg/icons/misc/full-sail.png",
        "come-about": "systems/pirateborg/icons/misc/come-about.png",
        "drop-anchor": "systems/pirateborg/icons/misc/anchor.png",
        "weigh-anchor": "systems/pirateborg/icons/misc/anchor.png",
        "boarding-party": "systems/pirateborg/icons/misc/boarding-party.png",
      };
      let pcactions = [
        "broadsides",
        "small-arms",
        "full-sail",
        "come-about",
        "repair",
      ];
      const updateData = {
        id: "ship",
        name: "Ship Actions",
        type: "custom",
      };
      this.updateGroup(updateData);
      const spellGroupData = {
        id: "ship",
        type: "system",
        name: "Ship Actions",
      };
      const parentGroupData = {
        id: "ship",
        nestId: "ship",
        type: "custom",
      };
      this.addGroup(spellGroupData, parentGroupData, true);
      let ability = getMethods(game.pirateborg.api.actions).filter((i) =>
        i.includes("ship")
      );
      if (this.actor.system.weapons.broadsides.quantity < 1) {
        ability = ability.filter((i) => !i.includes("Broadsides"));
      }
      if (this.actor.system.weapons.smallArms.quantity < 1) {
        ability = ability.filter((i) => !i.includes("SmallArms"));
      }
      if (this.actor.system.weapons.ram.die == "") {
        ability = ability.filter((i) => !i.includes("Ram"));
      }
      ability = ability.filter((i) => !i.includes("Rotate"));
      ability = ability.filter((i) => !i.includes("Sink"));
      ability = ability.filter((i) => !i.includes("Shant"));
      ability = ability.filter((i) => !i.includes("Roll"));
      for (let i in ability) {
        const groupId = "crewaction";
        const groupName = "Crew Actions";
        const shipGroupData = {
          id: groupId,
          type: "system",
          name: groupName,
        };
        const parentGroupData = {
          id: "ship",
          type: "system",
          nestId: "ship_ship",
        };
        this.addGroup(shipGroupData, parentGroupData, true);
        let name = ability[i]
          .replace(/([A-Z])/g, " $1")
          .trim()
          .split(" ")
          .slice(1, -1)
          .join(" ");
        let encName = name.toLowerCase().replaceAll(" ", "-");
        const boatEncodedValue = ["ship", encName].join("|");
        let boatAction = {
          name: name,
          img: iconlist[encName],
          id: i,
          encodedValue: boatEncodedValue,
        };
        this.addActions([boatAction], { id: groupId, type: "system" });
        if (pcactions.includes(encName)) {
          const groupId2 = "pcaction";
          const groupName2 = "PC Actions";
          const shipGroupData2 = {
            id: groupId2,
            type: "system",
            name: groupName2,
          };
          const parentGroupData2 = {
            id: "ship",
            type: "system",
            nestId: "ship_ship",
          };
          this.addGroup(shipGroupData2, parentGroupData2, true);
          let boatAction = {
            name: name,
            id: i,
            img: iconlist[encName],
            encodedValue: boatEncodedValue + groupId2,
          };
          this.addActions([boatAction], { id: groupId2, type: "system" });
        }
      }
      let songs = this.actor.items.filter((i) => (i.type = "shanty"));
      if (songs.length > 0) {
        const groupId = "shanties";
        const groupName = "Shanties";
        const shipGroupData = {
          id: groupId,
          type: "system",
          name: groupName,
        };
        const parentGroupData = {
          id: "ship",
          type: "system",
          nestId: "ship_ship",
        };
        this.addGroup(shipGroupData, parentGroupData, true);
        for (let i in songs) {
          let songAction = {
            name: songs[i].name,
            img: songs[i].img,
            info1: {
              text:
                this.actor.system.attributes.shanties.value +
                "/" +
                this.actor.system.attributes.shanties.max,
            },
            id: i,
            encodedValue: ["shanties", songs[i].id].join("|"),
          };
          this.addActions([songAction], { id: groupId, type: "system" });
        }
      }
    }
    buildSpellActions(spellType) {
      const updateData = {
        id: "spells",
        name: spellType,
        type: "custom",
      };
      this.updateGroup(updateData);
      const spellGroupData = {
        id: "spells",
        type: "system",
        name: spellType,
      };
      const parentGroupData = {
        id: "spells",
        nestId: "spells",
        type: "custom",
      };
      this.addGroup(spellGroupData, parentGroupData, true);
      let spells = this.actor.items.filter((w) => w.type === "invokable");
      for (let a in spells) {
        const groupId = spells[a].system.invokableType;
        const groupName = spells[a].system.invokableType;
        let info2 = {};
        if (spells[a].isExtraResource) {
          info2 = {
            text:
              "(" +
              this.actor.system.attributes.extraResource.value +
              "/" +
              this.actor.system.attributes.extraResource.max +
              ")",
          };
        } else if (spells[a].isArcaneRitual) {
          info2 = {
            text:
              "(" +
              this.actor.system.attributes.rituals.value +
              "/" +
              this.actor.system.attributes.rituals.max +
              ")",
          };
        }
        const spellGroupData = {
          id: groupId,
          type: "system",
          name: groupName,
        };
        const parentGroupData = {
          id: "spells",
          type: "system",
          nestId: "spells_spells",
        };
        this.addGroup(spellGroupData, parentGroupData, true);
        const name = spells[a].name;
        const id = spells[a].id;
        let spellEncodedValue = ["spells", id].join("|");
        let spellAction = {
          name: name,
          img: spells[a].img,
          info2: info2,
          id: a,
          encodedValue: spellEncodedValue,
        };
        this.addActions([spellAction], { id: groupId, type: "system" });
      }
    }

    buildUtilityActions() {
      const utilityActions = [];
      const endTurnAction = {
        name: "End Turn",
        encodedValue: ["utility", "endTurn"].join("|"),
      };
      utilityActions.push(endTurnAction);
      this.addActions(utilityActions, { id: "utility", type: "system" });
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions() {}
  };
});
