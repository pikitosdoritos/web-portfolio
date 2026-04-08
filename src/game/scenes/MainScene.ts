import 'phaser';
import { Player } from '../objects/Player';
import { InteractiveObject, InteractionData } from '../objects/InteractiveObject';
import { Drone } from '../objects/Drone';

export class MainScene extends Phaser.Scene {
    private player!: Player;
    private interactiveObjects: InteractiveObject[] = [];
    private interactKey!: Phaser.Input.Keyboard.Key;
    
    private modalContainer!: Phaser.GameObjects.Container;
    private modalTitle!: Phaser.GameObjects.Text;
    private modalDesc!: Phaser.GameObjects.Text;
    private modalDetails!: Phaser.GameObjects.Text;
    private modalOverlay!: Phaser.GameObjects.Rectangle;
    private isModalOpen: boolean = false;
    private lastInteractionTime: number = 0;
    private escKey!: Phaser.Input.Keyboard.Key;
    private nebulas: Phaser.GameObjects.Image[] = [];
    private asteroids!: Phaser.Physics.Arcade.Group;
    private bullets!: Phaser.Physics.Arcade.Group;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('ship', 'assets/ship.png');
        this.load.image('space_assets', 'assets/space_assets.png');
        this.load.image('drone', 'assets/drone.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('asteroid', 'assets/asteroid.png');
        this.load.audio('music', 'assets/music.mp3');
        this.load.audio('laser_sfx', 'assets/laser_sfx.mp3');
        this.load.audio('explosion_sfx', 'assets/explosion_sfx.mp3');
    }

    create() {
        const { width, height } = this.scale;
        const mapW = 4000, mapH = 4000;

        // Assets Transparency Pipeline
        ['ship', 'drone', 'structures', 'laser', 'asteroid'].forEach(key => {
            if (this.textures.exists(key)) {
                const tex = this.textures.get(key);
                const source = tex.getSourceImage() as HTMLImageElement;
                const canvas = document.createElement('canvas');
                canvas.width = source.width; canvas.height = source.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(source, 0, 0);
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const pix = imgData.data;
                    const w = canvas.width, h = canvas.height;
                    
                    const br = pix[0], bg = pix[1], bb = pix[2];
                    const isBg = (idx: number) => {
                        const d = Math.abs(pix[idx]-br) + Math.abs(pix[idx+1]-bg) + Math.abs(pix[idx+2]-bb);
                        return d < 50;
                    };

                    if (key === 'asteroid') {
                        const outside = new Uint8Array(w * h);
                        const queue: number[] = [];
                        for (let x = 0; x < w; x++) { queue.push(x, (h - 1) * w + x); }
                        for (let y = 1; y < h - 1; y++) { queue.push(y * w, y * w + (w - 1)); }
                        
                        while (queue.length > 0) {
                            const idx = queue.pop()!;
                            if (!outside[idx] && isBg(idx * 4)) {
                                outside[idx] = 1;
                                const x = idx % w, y = Math.floor(idx / w);
                                if (x > 0) queue.push(idx - 1);
                                if (x < w - 1) queue.push(idx + 1);
                                if (y > 0) queue.push(idx - w);
                                if (y < h - 1) queue.push(idx + w);
                            }
                        }

                        for (let i = 0; i < pix.length; i += 4) {
                            if (outside[i/4]) pix[i+3] = 0;
                            else if (isBg(i)) { pix[i]=0; pix[i+1]=0; pix[i+2]=0; pix[i+3]=255; }
                        }
                    } else {
                        for (let i = 0; i < pix.length; i += 4) { if (isBg(i)) pix[i+3] = 0; }
                    }

                    // Automatic Cropping (Trim padding)
                    let minX = w, maxX = 0, minY = h, maxY = 0, hasContent = false;
                    for (let y = 0; y < h; y++) {
                        for (let x = 0; x < w; x++) {
                            if (pix[(y * w + x) * 4 + 3] > 0) {
                                if (x < minX) minX = x; if (x > maxX) maxX = x;
                                if (y < minY) minY = y; if (y > maxY) maxY = y;
                                hasContent = true;
                            }
                        }
                    }

                    if (hasContent) {
                        const cropW = maxX - minX + 1, cropH = maxY - minY + 1;
                        const croppedCanvas = document.createElement('canvas');
                        croppedCanvas.width = cropW; croppedCanvas.height = cropH;
                        const croppedCtx = croppedCanvas.getContext('2d')!;
                        ctx.putImageData(imgData, 0, 0);
                        croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
                        this.textures.remove(key);
                        this.textures.addCanvas(key, croppedCanvas);
                    } else {
                        ctx.putImageData(imgData, 0, 0);
                        this.textures.remove(key);
                        this.textures.addCanvas(key, canvas);
                    }
                }
            }
        });

        this.cameras.main.setBounds(0, 0, mapW, mapH).setBackgroundColor('#020617');
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.physics.world.setFPS(120); // High-precision physics for fast bullets

        // Decor
        for (let i = 0; i < 6; i++) {
            this.add.image(Phaser.Math.Between(0, mapW), Phaser.Math.Between(0, mapH), 'space_assets')
                .setAlpha(0.3).setScrollFactor(0.8).setBlendMode('SCREEN')
                .setScale(Phaser.Math.FloatBetween(2, 5)).setAngle(Phaser.Math.Between(0, 360));
        }
        const stars = this.add.graphics().fillStyle(0xffffff, 0.7);
        for (let i = 0; i < 1000; i++) stars.fillCircle(Phaser.Math.Between(0, mapW), Phaser.Math.Between(0, mapH), Phaser.Math.FloatBetween(0.5, 2));

        const hubX = 2000, hubY = 2000;
        this.player = new Player(this, hubX, hubY);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // UI
        this.modalOverlay = this.add.rectangle(0,0,width,height,0,0.7).setOrigin(0).setScrollFactor(0).setVisible(false).setDepth(200).setInteractive();
        this.modalContainer = this.add.container(width/2, height/2).setScrollFactor(0).setDepth(201).setVisible(false);
        const mBg = this.add.rectangle(0,0,600,400,0x0d1117,0.95).setStrokeStyle(2,0x3b82f6);
        this.modalTitle = this.add.text(0,-140,'',{fontSize:'28px',color:'#3b82f6'}).setOrigin(0.5);
        this.modalDesc = this.add.text(0,-80,'',{color:'#f0f6fc',wordWrap:{width:500}}).setOrigin(0.5);
        this.modalDetails = this.add.text(0,40,'',{color:'#94a3b8',wordWrap:{width:500}}).setOrigin(0.5);
        this.modalContainer.add([mBg, this.modalTitle, this.modalDesc, this.modalDetails]);
        this.interactKey = this.input.keyboard!.addKey('E');
        this.escKey = this.input.keyboard!.addKey('ESC');

        // Hubs
        const hubsData = [
            {x:2000, y:2350, d:{title:'Welcome', description:'Personal Portfolio Archive.', details:'Explore the clusters to see my stack and projects.'}},
            {x:3100, y:2000, d:{title:'Skills', description:'Full-Stack Proficiency.', details:'Frontend: React, Next.js. Backend: FastAPI, Go.'}},
            {x:900, y:2000, d:{title:'Projects', description:'Deployments.', details:'• Agentic CRM\n• Real-time Analytics'}}
        ];
        hubsData.forEach(h => {
            const obj = new InteractiveObject(this, h.x, h.y, h.d);
            this.interactiveObjects.push(obj);
        });

        const drones = [{x:3500,y:1200},{x:200,y:3200}];
        drones.forEach(d => {
            const dr = new Drone(this, d.x, d.y, {title:'Drone', description:'Data Log.', details:'Status: Nominal.'});
            dr.setScale(0.4);
            this.interactiveObjects.push(dr);
        });

        // Combined Combat & Physics
        this.bullets = this.physics.add.group();
        this.asteroids = this.physics.add.group();
        
        for(let i=0; i<60; i++){
            let ax: number = 0, ay: number = 0, overlapping: boolean = false;
            let attempts = 0;
            const radius = 180; // Safety radius for spawning
            do {
                ax = Phaser.Math.Between(100, mapW-100);
                ay = Phaser.Math.Between(100, mapH-100);
                overlapping = false;
                
                if(Phaser.Math.Distance.Between(ax,ay,hubX,hubY)<1000) overlapping = true;
                
                if (!overlapping) {
                    this.asteroids.getChildren().forEach((a: any) => {
                        if (Phaser.Math.Distance.Between(ax, ay, a.x, a.y) < radius) overlapping = true;
                    });
                }
                
                if (!overlapping) {
                    this.interactiveObjects.forEach(obj => {
                        if (Phaser.Math.Distance.Between(ax, ay, obj.x, obj.y) < 400) overlapping = true;
                    });
                }
                attempts++;
            } while (overlapping && attempts < 100);

            if (!overlapping) {
                const ast = this.add.sprite(ax, ay, 'asteroid').setScale(Phaser.Math.FloatBetween(0.1, 0.25));
                this.physics.add.existing(ast);
                ast.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
                (ast.body as any).setCircle(ast.displayWidth * 0.45).setBounce(1).setVelocity(Phaser.Math.Between(-30,30));
                this.asteroids.add(ast);
            }
        }

        // Particle System: PRE-CREATED Emitters to avoid memory freeze
        const laserEmitter = this.add.particles(0, 0, 'laser', {
            scale: { start: 0.15, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            emitting: false,
            rotate: { min: 0, max: 360 }
        });

        const explosionEmitter = this.add.particles(0, 0, 'asteroid', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.1, end: 0 },
            lifespan: 500,
            emitting: false
        });

        this.player.on('fire', (x: number, y: number, angle: number) => {
            const bx = x + Math.cos(angle)*40, by = y + Math.sin(angle)*40;
            // Slightly larger scale for visibility, cropping keeps it clean
            const bullet = this.add.sprite(bx, by, 'laser').setScale(0.25).setRotation(angle+Math.PI/2);
            this.physics.add.existing(bullet);
            const body = bullet.body as Phaser.Physics.Arcade.Body;
            // Larger hitbox for better collision detection at high speeds
            body.setCircle(20, -5, -5).setVelocity(Math.cos(angle)*1900, Math.sin(angle)*1900);
            body.setCollideWorldBounds(true);
            body.onWorldBounds = true;
            this.bullets.add(bullet);
            
            // SFX
            this.sound.play('laser_sfx', { volume: 0.15 });
            
            const trailTimer = this.time.addEvent({
                delay: 12, // Faster trail for better continuity
                loop: true,
                callback: () => {
                    if (bullet.active) {
                        laserEmitter.emitParticleAt(bullet.x, bullet.y, 1);
                    } else {
                        trailTimer.remove();
                    }
                }
            });
            
            this.time.delayedCall(5000, () => { 
                if(bullet.active) bullet.destroy(); 
            });
        });

        this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
            if (body.gameObject && this.bullets.contains(body.gameObject)) {
                laserEmitter.emitting = false;
                body.gameObject.destroy();
            }
        });

        this.physics.add.overlap(this.bullets, this.asteroids, (bullet, asteroid) => {
            const ast = asteroid as Phaser.GameObjects.Sprite;
            explosionEmitter.emitParticleAt(ast.x, ast.y, 15);
            this.sound.play('explosion_sfx', { volume: 0.3 });
            this.cameras.main.shake(150, 0.006);
            bullet.destroy();
            ast.destroy();
        });

        this.physics.add.collider(this.player, this.asteroids);
        this.physics.add.collider(this.asteroids, this.asteroids);
        this.physics.add.collider(this.player, this.interactiveObjects);

        this.sound.play('music', { loop: true, volume: 0.3 });

        // Radar
        const miniSize = 200, padding = 40;
        const mini = this.cameras.add(width-miniSize-padding, padding, miniSize, miniSize).setZoom(0.05).setBackgroundColor(0x000111).centerOn(mapW/2, mapH/2);
        mini.ignore([this.modalOverlay, this.modalContainer, ...this.nebulas]);
    }

    public showModal(data: InteractionData) {
        if (this.isModalOpen) return;
        this.isModalOpen = true;
        this.modalTitle.setText(data.title.toUpperCase());
        this.modalDesc.setText(data.description);
        this.modalDetails.setText(data.details || '');
        this.modalOverlay.setVisible(true);
        this.modalContainer.setVisible(true);
        this.modalContainer.setScale(0.9); this.modalContainer.alpha = 0;
        this.tweens.add({ targets: this.modalContainer, scale: 1, alpha: 1, duration: 200 });
    }

    public hideModal() {
        if (!this.isModalOpen) return;
        this.isModalOpen = false;
        this.modalContainer.setVisible(false);
        this.modalOverlay.setVisible(false);
    }

    update(time: number) {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.hideModal();
        }
        if (this.isModalOpen) return;
        this.player.update(time);
        
        let near = null;
        for (const obj of this.interactiveObjects) {
            if (obj.checkProximity(this.player.x, this.player.y)) { near = obj; break; }
        }
        if (near && this.interactKey.isDown && time > this.lastInteractionTime + 500) {
            this.lastInteractionTime = time;
            this.showModal(near.interactionData);
        }
    }
}
