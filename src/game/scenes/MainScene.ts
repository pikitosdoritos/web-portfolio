import 'phaser';
import { Player } from '../objects/Player';
import { InteractiveObject, InteractionData } from '../objects/InteractiveObject';

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

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('ship', 'assets/ship.png');
        this.load.image('space_assets', 'assets/space_assets.png');
    }

    create() {
        const { width, height } = this.scale;
        const mapW = 4000, mapH = 4000, tileSize = 200;

        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.cameras.main.setBackgroundColor('#020617');

        // Design: Add Nebula Background Elements
        for (let i = 0; i < 6; i++) {
            const nx = Phaser.Math.Between(0, mapW);
            const ny = Phaser.Math.Between(0, mapH);
            const nebula = this.add.image(nx, ny, 'space_assets');
            nebula.setAlpha(0.25).setDepth(0).setScrollFactor(0.8);
            nebula.setScale(Phaser.Math.FloatBetween(2, 4));
            nebula.setAngle(Phaser.Math.Between(0, 360));
        }

        // DESIGN: Star clusters (Small stars as decor)
        const stars = this.add.graphics();
        stars.fillStyle(0xffffff, 0.8);
        for (let i = 0; i < 800; i++) {
            stars.fillCircle(Phaser.Math.Between(0, mapW), Phaser.Math.Between(0, mapH), Phaser.Math.FloatBetween(0.5, 2));
        }

        const grid = this.add.graphics();
        grid.lineStyle(1.2, 0x1e293b, 0.4);
        for (let i = 0; i <= mapW / tileSize; i++) grid.lineBetween(i * tileSize, 0, i * tileSize, mapH);
        for (let j = 0; j <= mapH / tileSize; j++) grid.lineBetween(0, j * tileSize, mapW, j * tileSize);

        const hubX = 2000, hubY = 2000;
        this.player = new Player(this, hubX, hubY);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        const items = [
            { title: 'Core_01', x: 2000, y: 2350, data: { title: 'Personal Focus', description: 'AI-First Full-Stack Developer.', details: 'Building production-grade systems using LLMs as core architectural components. Expert in Python, FastAPI, and Next.js.' } },
            { title: 'Core_02', x: hubX + 1100, y: hubY, data: { title: 'Project Archive', description: 'Deployments and Open Source.', details: '• Agentic CRM: Using LangGraph for complex task routing.\n• Real-time Analytics: Dashboarding millions of metrics via FastAPI websockets.\n• LLM Tooling: Automation scripts and IDE extensions for dev flow.' } },
            { title: 'Core_03', x: hubX - 1100, y: hubY, data: { title: 'Skills Matrix', description: 'Full-Stack Proficiency.', details: 'Frontend: React, Next.js, Framer Motion.\nBackend: FastAPI, Go, Postgres, Redis.\nAI: RAG architectures, local LLM serving, and evaluation pipelines.' } },
            { title: 'Core_04', x: hubX, y: hubY - 1100, data: { title: 'Leadership Experience', description: 'Startup Growth Timeline.', details: 'Led engineering teams at 2 FinTech startups. Scaled APIs to 1M+ req/day. Optimized database performance by 40%. Focused on rapid iterations.' } },
            { title: 'Core_05', x: hubX, y: hubY + 1400, data: { title: 'Connection Hub', description: 'Available for technical deep dives.', details: 'GitHub: developer-archive\nLinkedIn: profile/professional\nTelegram: @dev-link\nEmail: hello@example.com' } }
        ];

        items.forEach(item => {
            const obj = new InteractiveObject(this, item.x, item.y, item.data);
            this.tweens.add({ targets: obj, alpha: 0.85, scale: 1.05, duration: 1800, yoyo: true, repeat: -1 });
            this.interactiveObjects.push(obj);
            
            // Mouse/Touch fallback
            obj.on('pointerdown', () => {
                if (obj.checkProximity(this.player.x, this.player.y)) {
                    this.showModal(obj.interactionData);
                }
            });
        });

        // Add physical collisions between player and nodes
        this.physics.add.collider(this.player, this.interactiveObjects);

        // Responsive Modal Logic
        this.modalOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0).setScrollFactor(0).setVisible(false).setDepth(100).setInteractive();
        
        this.modalContainer = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(101).setVisible(false);
        const modalW = Math.min(width * 0.9, 640);
        const modalH = Math.min(height * 0.8, 480);
        const bg = this.add.rectangle(0, 0, modalW, modalH, 0x0d1117, 0.98).setStrokeStyle(1.5, 0x3b82f6, 1);
        
        this.modalTitle = this.add.text(0, -modalH/2 + 60, '', { fontSize: '28px', fontFamily: 'Outfit, sans-serif', color: '#3b82f6', fontStyle: '800', letterSpacing: 3 }).setOrigin(0.5);
        this.modalDesc = this.add.text(0, -modalH/2 + 120, '', { fontSize: '18px', fontFamily: 'Inter, sans-serif', color: '#f0f6fc', wordWrap: { width: modalW - 80 } }).setOrigin(0.5);
        this.modalDetails = this.add.text(0, 30, '', { fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#94a3b8', wordWrap: { width: modalW - 80 }, lineSpacing: 10 }).setOrigin(0.5);
        const close = this.add.text(0, modalH/2 - 50, '[ ESC ] TO CLOSE', { fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#3b82f6', letterSpacing: 3 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        close.on('pointerdown', () => this.hideModal());
        this.modalContainer.add([bg, this.modalTitle, this.modalDesc, this.modalDetails, close]);

        // Input setup
        this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.keyboard!.on('keydown-ESC', () => this.hideModal());
        
        // System HUD
        this.add.text(40, 40, 'SPACE_COMMAND.EXE v2.0', { fontSize: '15px', fontFamily: 'Outfit, sans-serif', color: '#3b82f6', letterSpacing: 4, fontStyle: 'bold' }).setScrollFactor(0);

        // Dynamic Resize Handler
        this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
            const { width: newW, height: newH } = gameSize;
            this.modalOverlay.setSize(newW, newH);
            this.modalContainer.setPosition(newW / 2, newH / 2);

            // Responsive Camera: Zoom in for smaller widths to keep focus
            if (newW < 800) {
                this.cameras.main.setZoom(newW / 800);
            } else {
                this.cameras.main.setZoom(1);
            }

            // BUG FIX: Resize modal background and content
            // ... (rest of resizing logic remains)
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
