import 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: { [key: string]: Phaser.Input.Keyboard.Key };
    private velocity = 450; // Snappier movement

    constructor(scene: Phaser.Scene, x: number, y: number) {
        const textureKey = scene.textures.exists('ship') ? 'ship' : 'player_sprite';
        super(scene, x, y, textureKey);
        
        if (!scene.textures.exists('player_sprite')) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0x3b82f6, 0.4);
            graphics.fillCircle(16, 16, 16);
            graphics.fillStyle(0x60a5fa, 1);
            graphics.fillCircle(16, 16, 12);
            graphics.lineStyle(1.5, 0xffffff, 1);
            graphics.strokeCircle(16, 16, 12);
            graphics.generateTexture('player_sprite', 32, 32);
        }

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (textureKey === 'ship') {
            this.setDisplaySize(64, 64);
            body.setCircle(24, 8, 8); // Adjusted for 64x64
        } else {
            body.setCircle(14, 2, 2);
        }
        
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

        // Rotation logic: Point towards movement direction
        if (vx !== 0 || vy !== 0) {
            const angle = Math.atan2(vy, vx);
            // The ship asset is facing LEFT by default, so we add PI (180 deg) 
            // to make it face RIGHT when the angle is 0.
            this.setRotation(angle + Math.PI);
        }
    }
}
