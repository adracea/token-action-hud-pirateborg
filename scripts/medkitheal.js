const createHealOutcome = async ({ actor, formula = "", target }) =>
    game.pirateborg.api.utils.asyncPipe(
        game.pirateborg.api.outcomes.rollOutcome({ type: "heal", formula }),
        game.pirateborg.api.outcomes.withAsyncProps({
            title: (outcome) => `${game.i18n.localize("PB.Heal")} ${outcome.roll.total} ${game.i18n.localize("PB.HP")}`,
            heal: (outcome) => outcome.roll.total,
        }),
        game.pirateborg.api.outcomes.withTarget({ actor: target ? target.document.actor : actor, ...target ? { target: target } : null }),
        game.pirateborg.api.outcomes.withAutomations("damage-heal",
            game.pirateborg.api.outcomeAnimations.ANIMATION_TYPE.HEAL,
            game.pirateborg.api.advancedAnimations.ADVANCED_ANIMATION_TYPE.HEAL)
    )();
[target] = game.user.targets;
hasMedkit = await actor.items.find(i => i.name === 'Medical kit')
let burnedakit = false;
if (hasMedkit) {
    if (hasMedkit.system.quantity > 0) {
        if (hasMedkit.system.uses) { await hasMedkit.updateData("uses", Math.max(0, hasMedkit.system.uses - 1)) }
        else {
            await hasMedkit.updateData("uses", actor.system.abilities.presence.value + 4);
            await hasMedkit.updateData("uses", Math.max(0, hasMedkit.system.uses - 1));
        }
        if (hasMedkit.system.uses == 0) {
            await hasMedkit.setQuantity(Math.max(0, hasMedkit.system.quantity - 1));
            if (hasMedkit.system.quantity > 0) {
                await hasMedkit.updateData("uses", actor.system.abilities.presence.value + 4)
                burnedakit = true;
            }
        }
        desc = ""
        if (burnedakit) {
            desc = "<b> 1 Medical kit depleted</b><br>Used Medical kit <br> Uses remaining: <b>" + hasMedkit.system.uses + "</b>"
        } else { desc = "Used Medical kit <br> Uses remaining: <b>" + hasMedkit.system.uses + "</b>" }
        return game.pirateborg.api.showGenericCard({
            actor,
            title: "Medical kit",
            description: desc,
            outcomes: [await createHealOutcome({ actor: actor, formula: "d6", ...target ? { target: target } : null })],
            ...target ? { target: target } : null
        });
    } else { return ui.notifications.error("Medical Kit depleted") }
}
else { return ui.notifications.error("Medical Kits not present in the inventory.") }