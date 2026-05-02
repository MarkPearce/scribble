import { ScribbleHandler, Scribble } from "./module.js";

export const MODULE_ID = "scribble";


Hooks.once('init', async function () {

    new ScribbleHandler();

    game.settings.register(MODULE_ID, "linethicc", {
        name: "Line Thickness",
        hint: "Thickness of the line in pixels",
        scope: "world",
        config: true,
        type: Number,
        range: {
          min: 1,
          max: 30,
          step: 1,
        },
        default: 10,
      });

      game.settings.register(MODULE_ID, "pollrate", {
        name: "Polling Rate",
        hint: "Smaller numbers make the line more precise",
        scope: "world",
        config: true,
        type: Number,
        range: {
          min: 10,
          max: 100,
          step: 1,
        },
        default: 50,
      });

      game.settings.register(MODULE_ID, "fadeoutDelay", {
        name: "Fadeout Delay",
        hint: "Time in milliseconds before a Scribble fades out",
        scope: "world",
        config: true,
        type: Number,
        default: 10000,
      });

        game.keybindings.register(MODULE_ID, "hotkey", {
          name: "Scribble",
          editable: [
            {key: "KeyQ"},
          ],
          onDown: (e) => {
            if(game.ScribbleHandler.current || e.event.target.localName !== "body") return;
            game.ScribbleHandler.current = new Scribble();
            game.ScribbleHandler.current.start();
          },
          onUp: (e) => {
              game.ScribbleHandler.current?.end();
              game.ScribbleHandler.current = null;
          },
      });


});
