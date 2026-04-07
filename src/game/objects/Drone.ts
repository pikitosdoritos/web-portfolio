import 'phaser';
import { InteractiveObject, InteractionData } from './InteractiveObject';

export class Drone extends InteractiveObject {

    constructor(scene: Phaser.Scene, x: number, y: number, data: InteractionData) {
        super(scene, x, y, data, false); // Dynamic
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(20);
        body.setOffset(-20, -20);
        body.setCollideWorldBounds(true);
        body.setBounce(1);

        // Customize appearance for drone
        if (scene.textures.exists('drone')) {
            const droneSprite = scene.add.sprite(0, 0, 'drone');
            // Remove the default terminal icon if we want to replace it
            this.list.forEach((item, index) => {
                if (item instanceof Phaser.GameObjects.Sprite) {
                    this.remove(item, true);
                    this.addAt(droneSprite, index);
                }
            });
            droneSprite.setScale(0.8);
        }

        this.startPatrol(scene);
    }

    private startPatrol(scene: Phaser.Scene) {
        const radius = 300;
        const duration = 4000;
        
        scene.tweens.add({
            targets: this,
            x: this.x + (Math.random() > 0.5 ? radius : -radius),
            y: this.y + (Math.random() > 0.5 ? radius : -radius),
            duration: duration + Math.random() * 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            onUpdate: () => {
                // Keep label and prompt upright
            }
        });

        // Pulsing glow for drone
        scene.tweens.add({
            targets: this,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
}
