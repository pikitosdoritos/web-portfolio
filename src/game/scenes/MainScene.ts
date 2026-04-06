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

    create() {
        const { width, height } = this.scale;
        const mapW = 4000, mapH = 4000, tileSize = 200;

        this.cameras.main.setBounds(0, 0, mapW, mapH);
        this.physics.world.setBounds(0, 0, mapW, mapH);
        this.cameras.main.setBackgroundColor('#010409');

        const grid = this.add.graphics();
        grid.lineStyle(1, 0x161b22, 1);
        for (let i = 0; i <= mapW / tileSize; i++) grid.lineBetween(i * tileSize, 0, i * tileSize, mapH);
        for (let j = 0; j <= mapH / tileSize; j++) grid.lineBetween(0, j * tileSize, mapW, j * tileSize);

        const hubX = 2000, hubY = 2000;
        this.player = new Player(this, hubX, hubY);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        const items = [
            { title: 'Log_01', x: 2000, y: 2300, data: { title: 'Personal Focus', description: 'AI-First Full-Stack Developer.', details: 'Building production-grade systems using LLMs as core architectural components. Expert in Python, FastAPI, and Next.js.' } },
            { title: 'Log_02', x: 3000, y: 2000, data: { title: 'Project: Agentic CRM', description: 'Multi-agent orchestration.', details: 'Built using LangGraph and OpenAI. Handles automated lead scoring, email drafting, and calendar sync without human intervention.' } },
            { title: 'Log_03', x: 1000, y: 2000, data: { title: 'Skills Matrix', description: 'Technical Proficiencies.', details: 'Python (FastAPI), React (Next.js), PostgreSQL, Redis, Kubernetes, LLM Fine-tuning, RAG Evaluation.' } },
            { title: 'Log_04', x: 2000, y: 1000, data: { title: 'Experience', description: 'Startup Leadership.', details: 'Led engineering teams at 2 FinTech startups. Scaled APIs to 1M+ req/day. Optimized database performance by 40%.' } },
            { title: 'Log_05', x: 2000, y: 3300, data: { title: 'Contact', description: 'Available for core collaboration.', details: 'GitHub: developer-archive\nLinkedIn: profile/main\nTelegram: @dev-link' } }
        ];

        items.forEach(item => {
            const obj = new InteractiveObject(this, item.x, item.y, item.data);
            this.tweens.add({ targets: obj, alpha: 0.8, scale: 1.1, duration: 2000, yoyo: true, repeat: -1 });
            this.interactiveObjects.push(obj);
            
            // Mouse interaction for robustness
            obj.on('pointerdown', () => {
                if (obj.checkProximity(this.player.x, this.player.y)) {
                    this.showModal(obj.interactionData);
                }
            });
        });

        this.modalOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setScrollFactor(0).setVisible(false).setDepth(100).setInteractive();
        this.modalContainer = this.add.container(width / 2, height / 2).setScrollFactor(0).setDepth(101).setVisible(false);
        const bg = this.add.rectangle(0, 0, 600, 420, 0x0d1117, 0.95).setStrokeStyle(2, 0x3b82f6, 1);
        this.modalTitle = this.add.text(0, -140, '', { fontSize: '32px', fontFamily: 'Outfit, sans-serif', color: '#3b82f6', fontWeight: '800', letterSpacing: 4 }).setOrigin(0.5);
        this.modalDesc = this.add.text(0, -70, '', { fontSize: '20px', fontFamily: 'Inter, sans-serif', color: '#f0f6fc', wordWrap: { width: 500 } }).setOrigin(0.5);
        this.modalDetails = this.add.text(0, 40, '', { fontSize: '15px', fontFamily: 'Inter, sans-serif', color: '#8b949e', wordWrap: { width: 500 }, lineSpacing: 10 }).setOrigin(0.5);
        const close = this.add.text(0, 160, '[ ESC ] TO CLOSE', { fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#3b82f6', letterSpacing: 4 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        close.on('pointerdown', () => this.hideModal());
        this.modalContainer.add([bg, this.modalTitle, this.modalDesc, this.modalDetails, close]);

        this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.keyboard!.on('keydown-ESC', () => this.hideModal());
        console.log('MainScene fully initialized');
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
        this.tweens.add({ targets: this.modalContainer, scale: 1, alpha: 1, duration: 250, ease: 'Back.easeOut' });
    }

    public hideModal() {
        if (!this.isModalOpen) return;
        this.isModalOpen = false;
        this.tweens.add({ targets: this.modalContainer, scale: 0.9, alpha: 0, duration: 150, onComplete: () => { this.modalContainer.setVisible(false); this.modalOverlay.setVisible(false); } });
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
