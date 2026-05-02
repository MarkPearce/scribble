import { Socket } from "./lib/socket.js";
import { MODULE_ID } from "./main.js";

export class Scribble {
    constructor(data) {
        this.points = data?.points || [];
        this.canceled = false;
        this.debounce = false;
        this.pollRate = game.settings.get(MODULE_ID, "pollrate");
        this.fadeoutTimer = game.settings.get(MODULE_ID, "fadeoutDelay") || data?.fadeOutTimer || 1000;
        this.color = data?.color || game?.user?.color?.css?.replace("#", "0x") || 0xffffff;
        this.width = data?.width || game.settings.get(MODULE_ID, "linethicc") || 2;
        this.preview = new PIXI.Graphics();
        canvas.controls.debug.addChild(this.preview);
        this.id = data?.id || foundry.utils.randomID();
    }

    start() {
        document.addEventListener("mousemove", this._onMouseMove);
    }

    end() {
        document.removeEventListener("mousemove", this._onMouseMove);
        canvas.controls.debug.removeChild(this.preview);
        this.preview.destroy();
        game.ScribbleHandler.previews[this.id]?.clear();
        if (this.canceled) return;
        Socket.draw({
            points: this.points,
            color: this.color,
            width: this.width,
            id: this.id,
            fadeoutTimer: this.fadeoutTimer,
        });
    }

    draw() {
        const points = this.points;
        if (points.length < 2) return;
        const line = new PIXI.Graphics();
        Scribble._strokePath(line, points, this.width, this.color);

        const container = new PIXI.Container();
        container.addChild(line);

        const fadeOut = () => {
            container.alpha -= 0.05;
            if (container.alpha <= 0) {
                canvas.app.ticker.remove(fadeOut);
                container.destroy({ children: true });
            }
        };
        setTimeout(() => {
            canvas.app.ticker.add(fadeOut);
        }, this.fadeoutTimer);

        canvas.controls.debug.addChild(container);
        game.ScribbleHandler.previews[this.id]?.clear();
    }

    _onMouseMove = (e) => {
        if (!this.debounce) {
            this.debounce = true;
            setTimeout(() => {
                this.debounce = false;
            }, this.pollRate);
            const [x, y] = [e.clientX, e.clientY];
            const t = canvas.stage.worldTransform;
            const cX = (x - t.tx) / canvas.stage.scale.x;
            const cy = (y - t.ty) / canvas.stage.scale.y;
            this.points.push(cX, cy);
            Socket.drawPreview({
                points: this.points,
                color: this.color,
                width: this.width,
                id: this.id,
            });
        }
    };

    drawPreview() {
        this.preview.clear();
        Scribble._strokePath(this.preview, this.points, this.width, this.color);
    }

    static _strokePath(graphics, points, width, color) {
        if (points.length < 2) return;
        graphics.moveTo(points[0], points[1]);
        for (let i = 2; i < points.length; i += 2) {
            graphics.lineTo(points[i], points[i + 1]);
        }
        // PIXI v8 (Foundry V13+) commits the current path with stroke({...}).
        // Fall back to lineStyle for PIXI v7 environments.
        if (typeof graphics.stroke === "function") {
            graphics.stroke({ width, color, alpha: 1 });
        } else {
            graphics.lineStyle(width, color, 1);
        }
    }
}

export class ScribbleHandler {
    constructor() {
        Socket.register("draw", ScribbleHandler.socketScribble);
        Socket.register("drawPreview", ScribbleHandler.socketScribblePreview);
        globalThis.game.ScribbleHandler = this;
        this.current = null;
        this.hotkey = null;
        this.previews = {};
    }

    static socketScribble(data) {
        new Scribble(data).draw();
    }

    static socketScribblePreview(data) {
        const handler = game.ScribbleHandler;
        handler.previews[data.id]?.clear();
        if (!handler.previews[data.id]) {
            handler.previews[data.id] = new PIXI.Graphics();
            canvas.controls.debug.addChild(handler.previews[data.id]);
        }
        Scribble._strokePath(handler.previews[data.id], data.points, data.width, data.color);
    }
}
