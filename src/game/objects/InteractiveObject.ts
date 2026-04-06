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
    private interactionRange: number = 180; // Increased for better UX
    private isInRange: boolean = false;
    private prompt: Phaser.GameObjects.Text;

    // Renamed clearly to avoid shadowing
    public interactionData: InteractionData;

    constructor(scene: Phaser.Scene, x: number, y: number, interactionData: InteractionData) {
        super(scene, x, y);
        this.interactionData = interactionData;

        // Use procedural texture 'terminal_icon'
        if (!scene.textures.exists('terminal_icon')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            // Outer Ring
            graphics.lineStyle(2, 0x3b82f6, 1);
            graphics.strokeCircle(32, 32, 28);
            // Inner Circle
            graphics.fillStyle(0x60a5fa, 0.2);
            graphics.fillCircle(32, 32, 20);
            // Core
            graphics.fillStyle(0x3b82f6, 1);
            graphics.fillCircle(32, 32, 10);
            graphics.generateTexture('terminal_icon', 64, 64);
        }
        
        this.icon = scene.add.sprite(0, 0, 'terminal_icon');
        this.icon.setInteractive({ useHandCursor: true });

        this.label = scene.add.text(0, -50, interactionData.title.toUpperCase(), {
            fontSize: '18px',
            fontFamily: 'Outfit, sans-serif',
            color: '#3b82f6',
            fontWeight: '800',
            letterSpacing: 2
        }).setOrigin(0.5);

        this.prompt = scene.add.text(0, 50, '[ E ] TO INTERACT', {
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            color: '#f8fafc',
            letterSpacing: 2
        }).setOrigin(0.5).setVisible(false);

        this.add([this.icon, this.label, this.prompt]);
        scene.add.existing(this);
    }

    checkProximity(playerX: number, playerY: number): boolean {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        const nextState = dist < this.interactionRange;

        if (nextState !== this.isInRange) {
            this.isInRange = nextState;
            this.prompt.setVisible(this.isInRange);
            if (this.isInRange) {
                this.label.setColor('#ffffff');
                this.icon.setTint(0x60a5fa);
            } else {
                this.label.setColor('#3b82f6');
                this.icon.clearTint();
            }
        }
        return this.isInRange;
    }
}
