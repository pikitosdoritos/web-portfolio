import 'phaser';

export interface InteractionData {
    title: string;
    description: string;
    techStack?: string[];
    links?: { label: string, url: string }[];
    details?: string;
}

export class InteractiveObject extends Phaser.GameObjects.Container {
    private icon: Phaser.GameObjects.Sprite;
    private label: Phaser.GameObjects.Text;
    private interactionRange: number = 220; // Slightly more range for comfortable triggering
    private isInRange: boolean = false;
    private prompt: Phaser.GameObjects.Text;
    
    public interactionData: InteractionData;

    constructor(scene: Phaser.Scene, x: number, y: number, interactionData: InteractionData, isStatic: boolean = true) {
        super(scene, x, y);
        this.interactionData = interactionData;

        // Ensure texture exists
        if (!scene.textures.exists('terminal_icon')) {
            const structuresExist = scene.textures.exists('structures');
            if (structuresExist) {
                // Use the structures texture if available
                this.icon = scene.add.sprite(0, 0, 'structures');
                this.icon.setScale(0.4); // Scale down the 256x256 assets to hub size
            } else {
                const graphics = scene.make.graphics({ x: 0, y: 0 });
                graphics.lineStyle(1.5, 0x3b82f6, 0.4);
                graphics.strokeCircle(32, 32, 30);
                graphics.lineStyle(2, 0x60a5fa, 1);
                graphics.strokeCircle(32, 32, 22);
                graphics.fillStyle(0x3b82f6, 0.2);
                graphics.fillCircle(32, 32, 16);
                graphics.generateTexture('terminal_icon', 64, 64);
                this.icon = scene.add.sprite(0, 0, 'terminal_icon');
            }
        } else {
            this.icon = scene.add.sprite(0, 0, 'terminal_icon');
        }
        this.icon.setInteractive({ useHandCursor: true });

        this.label = scene.add.text(0, -60, interactionData.title.toUpperCase(), {
            fontSize: '18px',
            fontFamily: 'Outfit, sans-serif',
            color: '#3b82f6',
            fontStyle: '800',
            letterSpacing: 3
        }).setOrigin(0.5);

        this.prompt = scene.add.text(0, 60, '[ E ] TO EXPLORE', {
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            color: '#cbd5e1',
            letterSpacing: 2
        }).setOrigin(0.5).setVisible(false);

        this.add([this.icon, this.label, this.prompt]);
        scene.add.existing(this);

        // Physics setup: Add a static body for character collisions
        scene.physics.add.existing(this, true);
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setCircle(24);
        body.setOffset(-24, -24); // Centering the circle offset on the container origin (0,0)
    }

    checkProximity(playerX: number, playerY: number): boolean {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        const nextState = dist < this.interactionRange;

        if (nextState !== this.isInRange) {
            this.isInRange = nextState;
            this.prompt.setVisible(this.isInRange);
            if (this.isInRange) {
                this.label.setColor('#ffffff');
                this.icon.setTint(0x93c5fd);
            } else {
                this.label.setColor('#3b82f6');
                this.icon.clearTint();
            }
        }
        return this.isInRange;
    }
}
