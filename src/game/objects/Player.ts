import 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: { [key: string]: Phaser.Input.Keyboard.Key };
    private velocity = 400;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Use a procedural texture 'player_sprite'
        super(scene, x, y, 'player_sprite');
        
        if (!scene.textures.exists('player_sprite')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            // Outer Glow
            graphics.fillStyle(0x3b82f6, 0.3);
            graphics.fillCircle(16, 16, 16);
            // Inner Core
            graphics.fillStyle(0x60a5fa, 1);
            graphics.fillCircle(16, 16, 10);
            // Border
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.strokeCircle(16, 16, 10);
            graphics.generateTexture('player_sprite', 32, 32);
        }

        this.setTexture('player_sprite');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
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

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.setVelocity(vx, vy);
        if (vx !== 0) this.setAngle(vx * 0.05); else this.setAngle(0);
    }
}
