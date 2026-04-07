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
    private nebulas: Phaser.GameObjects.Image[] = [];

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('ship', 'assets/ship.png');
        this.load.image('space_assets', 'assets/space_assets.png');
        this.load.image('drone', 'assets/drone.png');
    }

    create() {
        const { width, height } = this.scale;
        const mapW = 4000, mapH = 4000;

        // BUG FIX: Remove white background from ship texture
        if (this.textures.exists('ship')) {
            const shipTexture = this.textures.get('ship');
            const source = shipTexture.getSourceImage() as HTMLImageElement;
            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(source, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imgData.data;
                const bgR = pixels[0], bgG = pixels[1], bgB = pixels[2];
                for (let i = 0; i < pixels.length; i += 4) {
                    const dist = Math.abs(pixels[i] - bgR) + Math.abs(pixels[i+1] - bgG) + Math.abs(pixels[i+2] - bgB);
                    if (dist < 40) { pixels[i+3] = 0; }
                }
                ctx.putImageData(imgData, 0, 0);
                this.textures.remove('ship');
                this.textures.addCanvas('ship', canvas);
            }
        }

        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.cameras.main.setBackgroundColor('#020617');

        // Design: Add Nebula Background Elements
        for (let i = 0; i < 6; i++) {
            const nx = Phaser.Math.Between(0, mapW);
            const ny = Phaser.Math.Between(0, mapH);
            const nebula = this.add.image(nx, ny, 'space_assets');
            nebula.setAlpha(0.4).setDepth(0).setScrollFactor(0.8);
            nebula.setBlendMode(Phaser.BlendModes.SCREEN); 
            nebula.setScale(Phaser.Math.FloatBetween(2, 4));
            nebula.setAngle(Phaser.Math.Between(0, 360));
            this.nebulas.push(nebula);
        }

        const stars = this.add.graphics();
        stars.fillStyle(0xffffff, 0.8);
        for (let i = 0; i < 800; i++) {
            stars.fillCircle(Phaser.Math.Between(0, mapW), Phaser.Math.Between(0, mapH), Phaser.Math.FloatBetween(0.5, 2));
        }

        const hubX = 2000, hubY = 2000;
        this.player = new Player(this, hubX, hubY);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        const items = [
            { title: 'Home', x: hubX , y: hubY + 300, data: { title: 'Welcome', description: 'Personal Portfolio Archive.', details: 'Building the future of agentic coding. Explore the clusters to see my stack and projects.' } },
            { title: 'Stack', x: hubX + 1100, y: hubY, data: { title: 'Skills Matrix', description: 'Full-Stack Proficiency.', details: 'Frontend: React, Next.js.\nBackend: FastAPI, Go.\nAI: RAG architectures.' } },
            { title: 'Project', x: hubX - 1100, y: hubY, data: { title: 'Project Archive', description: 'Deployments.', details: '• Agentic CRM\n• Real-time Analytics\n• IDE Extensions' } }
        ];

        items.forEach(item => {
            const obj = new InteractiveObject(this, item.x, item.y, item.data);
            this.tweens.add({ targets: obj, alpha: 0.85, scale: 1.05, duration: 1800, yoyo: true, repeat: -1 });
            this.interactiveObjects.push(obj);
        });

        // SPAWN ROAMING DRONES
        const droneData = [
            { x: hubX + 500, y: hubY - 500, data: { title: 'Drone_Alpha', description: 'System Diagnostics Log.', details: 'Status: All systems nominal. Latency: 14ms. Core Temperature: stable.' } },
            { x: hubX - 800, y: hubY + 400, data: { title: 'Drone_Beta', description: 'Development Insight #42.', details: 'Did you know? This portfolio uses Phaser 3 for high-performance 2D rendering.' } }
        ];

        droneData.forEach(d => {
            const drone = new Drone(this, d.x, d.y, d.data);
            this.interactiveObjects.push(drone);
        });

        const anomalyX = 2500, anomalyY = 1500;
        const anomaly = new InteractiveObject(this, anomalyX, anomalyY, {
            title: 'Anomaly_0',
            description: 'Unidentified Spatial Riff.',
            details: 'WARNING: Gravitational fluctuations detected. Subtle pull forces active.'
        });
        this.tweens.add({ targets: anomaly, scale: 1.5, alpha: 0.5, duration: 2500, yoyo: true, repeat: -1 });
        this.interactiveObjects.push(anomaly);

        this.physics.add.collider(this.player, this.interactiveObjects);

        // Modal System
        this.modalOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setScrollFactor(0).setVisible(false).setDepth(100).setInteractive();
        this.modalContainer = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(101).setVisible(false);
        const modalW = Math.min(width * 0.9, 640), modalH = Math.min(height * 0.8, 480);
        const bg = this.add.rectangle(0, 0, modalW, modalH, 0x0d1117, 0.98).setStrokeStyle(1.5, 0x3b82f6, 1);
        this.modalTitle = this.add.text(0, -modalH/2 + 60, '', { fontSize: '28px', fontFamily: 'Outfit, sans-serif', color: '#3b82f6', fontStyle: '800' }).setOrigin(0.5);
        this.modalDesc = this.add.text(0, -modalH/2 + 120, '', { fontSize: '18px', fontFamily: 'Inter, sans-serif', color: '#f0f6fc', wordWrap: { width: modalW - 80 } }).setOrigin(0.5);
        this.modalDetails = this.add.text(0, 30, '', { fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#94a3b8', wordWrap: { width: modalW - 80 }, lineSpacing: 10 }).setOrigin(0.5);
        const closeText = this.add.text(0, modalH/2 - 50, '[ ESC ] TO CLOSE', { fontSize: '13px', color: '#3b82f6' }).setOrigin(0.5).setInteractive();
        closeText.on('pointerdown', () => this.hideModal());
        this.modalContainer.add([bg, this.modalTitle, this.modalDesc, this.modalDetails, closeText]);

        this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.keyboard!.on('keydown-ESC', () => this.hideModal());

        // Mini-map Radar
        const miniSize = 220, padding = 30;
        const miniMap = this.cameras.add(width - miniSize - padding, padding, miniSize, miniSize).setZoom(0.05).setBackgroundColor(0x000111).setBounds(0, 0, mapW, mapH).centerOn(mapW/2, mapH/2);
        const maskGr = this.add.graphics().setVisible(false).fillStyle(0xffffff).fillCircle(width - miniSize/2 - padding, padding + miniSize/2, miniSize/2);
        miniMap.setMask(maskGr.createGeometryMask());
        const radarDecor = this.add.graphics().setScrollFactor(0).setDepth(2100);
        
        const marker = this.add.graphics().setDepth(2000);
        marker.fillStyle(0xef4444, 1).fillCircle(0, 0, 90);
        this.events.on('update', () => marker.setPosition(this.player.x, this.player.y));
        this.tweens.add({ targets: marker, alpha: 0.5, scale: 1.2, duration: 800, yoyo: true, repeat: -1 });

        const hubMarkers: Phaser.GameObjects.Graphics[] = [];
        this.interactiveObjects.forEach(obj => {
            const m = this.add.graphics({ x: obj.x, y: obj.y }).setDepth(1500).fillStyle(0x3b82f6, 1).fillCircle(0, 0, 80);
            hubMarkers.push(m);
            this.tweens.add({ targets: m, alpha: 0.7, scale: 1.1, duration: 1500, delay: Math.random() * 1000, yoyo: true, repeat: -1 });
        });

        this.cameras.main.ignore([marker, radarDecor, ...hubMarkers]);
        miniMap.ignore([this.modalOverlay, this.modalContainer, radarDecor, ...this.nebulas, ...this.interactiveObjects]);

        // Combined Resize Handler
        this.scale.on('resize', (gs: Phaser.Structs.Size) => {
            const { width: nw, height: nh } = gs;
            this.modalOverlay.setSize(nw, nh);
            this.modalContainer.setPosition(nw / 2, nh / 2);
            maskGr.clear().fillStyle(0xffffff).fillCircle(nw - miniSize/2 - padding, padding + miniSize/2, miniSize/2);
            radarDecor.clear().lineStyle(2, 0x3b82f6, 0.4).strokeCircle(nw - miniSize/2 - padding, padding + miniSize/2, miniSize/2);
            const mCam = this.cameras.getCamera('mini');
            if (mCam) mCam.setPosition(nw - miniSize - padding, padding);
            
            // Scaled zoom for main camera
            if (nw < 800) this.cameras.main.setZoom(nw / 800); else this.cameras.main.setZoom(1);
        });
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
        this.tweens.add({ targets: this.modalContainer, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    }

    public hideModal() {
        if (!this.isModalOpen) return;
        this.isModalOpen = false;
        this.tweens.add({ targets: this.modalContainer, scale: 0.9, alpha: 0, duration: 160, onComplete: () => { this.modalContainer.setVisible(false); this.modalOverlay.setVisible(false); } });
    }

    update(time: number) {
        if (this.isModalOpen) return;
        this.player.update();

        const anomalyPos = { x: 2500, y: 1500 };
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, anomalyPos.x, anomalyPos.y);
        if (dist < 600) {
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, anomalyPos.x, anomalyPos.y);
            const force = (600 - dist) * 0.15;
            this.player.setAcceleration(Math.cos(angle) * force, Math.sin(angle) * force);
            if (dist < 200) this.cameras.main.shake(100, 0.002);
        } else {
            this.player.setAcceleration(0, 0);
        }

        let nearby = null;
        for (const obj of this.interactiveObjects) {
            if (obj.checkProximity(this.player.x, this.player.y)) { nearby = obj; break; }
        }
        if (nearby && this.interactKey.isDown && time > this.lastInteractionTime + 500) {
            this.lastInteractionTime = time;
            this.showModal(nearby.interactionData);
        }
    }
}
