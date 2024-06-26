export let RollHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  /**
   * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
   */
  RollHandler = class RollHandler extends coreModule.api.RollHandler {
    /**
     * Handle action event
     * Called by Token Action HUD Core when an action event is triggered
     * @override
     * @param {object} event        The event
     * @param {string} encodedValue The encoded value
     */
    async handleActionClick(event, encodedValue) {
      const payload = encodedValue.split("|");

      if (payload.length !== 2) {
        super.throwInvalidValueErr();
      }

      const actionTypeId = payload[0];
      const actionId = payload[1];

      const renderable = ["item"];

      if (renderable.includes(actionTypeId) && this.isRenderItem()) {
        return this.doRenderItem(this.actor, actionId);
      }

      const knownCharacters = ["character"];

      // If single actor is selected
      if (this.actor) {
        await this.#handleAction(
          event,
          this.actor,
          this.token,
          actionTypeId,
          actionId
        );
        return;
      }

      const controlledTokens = canvas.tokens.controlled.filter((token) =>
        knownCharacters.includes(token.actor?.type)
      );

      // If multiple actors are selected
      for (const token of controlledTokens) {
        const actor = token.actor;
        await this.#handleAction(event, actor, token, actionTypeId, actionId);
      }
    }

    /**
     * Handle action
     * @private
     * @param {object} event        The event
     * @param {object} actor        The actor
     * @param {object} token        The token
     * @param {string} actionTypeId The action type id
     * @param {string} actionId     The actionId
     */
    async #handleAction(event, actor, token, actionTypeId, actionId) {
      const options = {};
      switch (actionTypeId) {
        case "weapons":
          await this.#handleWeaponAction(event, actor, actionId);
          break;

        case "ship":
          await this.#handleShipAction(event, actor, actionId);
          break;

        case "actions":
          await this.#handleCreatureAction(event, actor, actionId);
          break;
        case "items":
          await this.#handleItemAction(event, actor, actionId);
          break;

        case "spells":
          await this.#handleSpellAction(event, actor, actionId);
          break;

        case "shanties":
          await this.#handleSongAction(event, actor, actionId);
          break;

        case "ability":
          await this.#handleAbilityAction(event, actor, actionId);
          break;

        case "utility":
          await this.#handleUtilityAction(token, actionId);
          break;
      }
    }

    /**
     * Handle weapon action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleWeaponAction(event, actor, actionId) {
      if (actor.items.get(actionId).system.loadingCount > 0) {
        await game.pirateborg.api.actions.characterReloadAction(
          actor,
          actor.items.get(actionId)
        );
      } else {
        await game.pirateborg.api.actions.characterAttackAction(
          actor,
          actor.items.get(actionId)
        );
      }
    }
    /**
     * Handle Creature action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleCreatureAction(event, actor, actionId) {
      switch (actionId) {
        case "morale":
          await game.pirateborg.api.actions.creatureMoraleAction(actor);
          break;
        case "initiative":
          await game.pirateborg.api.actions.actorInitiativeAction(actor);
          break;
        case "reaction":
          await game.pirateborg.api.actions.creatureReactionAction(actor);
          break;
        case "partyinitiative":
          await game.pirateborg.api.actions.actorPartyInitiativeAction();
          break;
        case "defend":
          await game.pirateborg.api.actions.characterDefendAction(actor);
          break;
      }
    }
    /**
     * Handle Ship action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleShipAction(event, actor, actionId) {
      let action = actionId.split("pcaction");
      let isPCAction = false;
      if (action.length > 1) {
        isPCAction = true;
      }
      switch (action[0]) {
        case "broadsides":
          await game.pirateborg.api.actions.shipBroadsidesAction(
            actor,
            isPCAction
          );
          break;
        case "small-arms":
          await game.pirateborg.api.actions.shipSmallArmsAction(
            actor,
            isPCAction
          );
          break;
        case "ram":
          await game.pirateborg.api.actions.shipRamAction(actor);
          break;
        case "full-sail":
          await game.pirateborg.api.actions.shipFullSailAction(
            actor,
            isPCAction
          );
          break;
        case "come-about":
          await game.pirateborg.api.actions.shipComeAboutAction(
            actor,
            isPCAction
          );
          break;
        case "drop-anchor":
          await game.pirateborg.api.actions.shipDropAnchorAction(actor);
          break;
        case "weigh-anchor":
          await game.pirateborg.api.actions.shipWeighAnchorAction(actor);
          break;
        case "repair":
          await game.pirateborg.api.actions.shipRepairAction(actor, isPCAction);
          break;
        case "boarding-party":
          await game.pirateborg.api.actions.shipBoardingPartyAction(actor);
          break;
      }
    }
    /**
     * Handle Item action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleItemAction(event, actor, actionId) {
      await game.pirateborg.api.macros.rollItemMacro(actor.id, actionId);
    }
    /**
     * Handle Shanties action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleSongAction(event, actor, actionId) {
      await game.pirateborg.api.actions.shipInvokeShantyAction(
        actor,
        actor.items.filter((i) => i.id == actionId)[0]
      );
    }

    /**
     * Handle spell action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleSpellAction(event, actor, actionId) {
      const options = {};
      const item = actor.items.find((i) => i.id === actionId);
      if (item.system.invokableType === "Arcane Ritual") {
        await game.pirateborg.api.actions.characterInvokeRitualAction(
          actor,
          item
        );
      } else if (item.system.invokableType === "Ancient Relic") {
        await game.pirateborg.api.actions.characterInvokeRelicAction(
          actor,
          item
        );
      } else {
        await game.pirateborg.api.actions.characterInvokeExtraResourceAction(
          actor,
          item
        );
      }
    }

    /**
     * Handle ability action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    async #handleAbilityAction(event, actor, actionId) {
      if (actor.type == "vehicle") {
        if (actionId == "agility") {
          await game.pirateborg.api.actions.shipRollAgilityAction(actor);
        } else if (actionId == "skill") {
          await game.pirateborg.api.actions.shipRollSkillAction(actor);
        } else {
          await game.pirateborg.api.actions.actorRollAbilityAction(
            actor,
            actionId
          );
        }
      } else {
        await game.pirateborg.api.actions.actorRollAbilityAction(
          actor,
          actionId
        );
      }
    }

    /**
     * Handle utility action
     * @private
     * @param {object} token    The token
     * @param {string} actionId The action id
     */
    async #handleUtilityAction(token, actionId) {
      switch (actionId) {
        case "endTurn":
          if (game.combat?.current?.tokenId === token.id) {
            await game.combat?.nextTurn();
          }
          break;
      }
    }
  };
});
