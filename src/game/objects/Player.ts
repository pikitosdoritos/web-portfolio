import 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: { [key: string]: Phaser.Input.Keyboard.Key };
    private velocity = 450; // Snappier movement

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player_sprite');
        
        if (!scene.textures.exists('player_sprite')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            // Glow layer
            graphics.fillStyle(0x3b82f6, 0.4);
            graphics.fillCircle(16, 16, 16);
            // Core layer
            graphics.fillStyle(0x60a5fa, 1);
            graphics.fillCircle(16, 16, 12);
            // Detail
            graphics.lineStyle(1.5, 0xffffff, 1);
            graphics.strokeCircle(16, 16, 12);
            graphics.generateTexture('player_sprite', 32, 32);
        }

        this.setTexture('player_sprite');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Use a circular body for smoother navigation around obstacles
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCircle(14, 2, 2);
        
        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 0.5);
        this.setDepth(10);
        
        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.wasd = scene.input.keyboard!.addKeys('W,A,S,D') as any;
    }

    update() {
        this.setVelocity(0);
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -this.velocity;
        else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = this.velocity;

        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -this.velocity;
        else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = this.velocity;

        // Normalize speed for diagonal movement
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.setVelocity(vx, vy);

        // Subtle procedural lean animation
        if (vx !== 0) {
            this.setAngle(vx * 0.04);
        } else {
            this.setAngle(0);
        }
    }
}
