class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.currentProblem = null;
        this.laser = null;
        this.isLaserAnimating = false;
        this.correctAnswer = null;
        this.answerButtons = [];
        this.cannonRotation = 0;
    }

    create() {
        this.createStarfield();
        this.setupCannon();
        this.initializeGameState();
        this.setupLaser();
        this.createEnemies();
        this.setupUI();
        this.setupAnswerButtons();
        this.generateNewProblem();
    }

    setupCannon() {
        this.cannon = this.add.text(50, 550, '🎯', { fontSize: '50px' }).setOrigin(0.5);
        this.cannon.setDepth(1);
    }

    initializeGameState() {
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.maxNumber = 5;

        this.enemyThemes = [
            { symbols: ['👻', '💀'] },      // Spooky theme
            { symbols: ['🐉', '🦄'] },      // Fantasy theme
            { symbols: ['🤖', '🛸'] },      // Tech theme
            { symbols: ['🦁', '🐯'] },      // Wild theme
            { symbols: ['🧙‍♂️', '🧚'] },    // Magic theme
            { symbols: ['🦈', '🐋'] }       // Ocean theme
        ];
    }

    setupLaser() {
        this.laser = this.add.rectangle(0, 0, 4, 20, 0xffffff);
        this.laser.visible = false;
        this.laser.setDepth(2);
    }

    createStarfield() {
        const graphics = this.add.graphics({ fillStyle: { color: 0xffffff } });
        const numberOfStars = 200;

        for (let i = 0; i < numberOfStars; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const radius = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.1, 0.8);
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, radius);
        }

        graphics.setDepth(0);
    }

    createEnemies() {
        const themeIndex = (this.level - 1) % this.enemyThemes.length;
        const currentTheme = this.enemyThemes[themeIndex];
        
        const startY = 100;
        const enemyCount = 6;

        this.enemies?.forEach(enemy => enemy.symbol.destroy());
        this.enemies = [];

        for (let i = 0; i < enemyCount; i++) {
            const x = 200 + i * 100;
            const symbolIndex = i % 2;
            
            const enemy = {
                symbol: this.add.text(x, startY, currentTheme.symbols[symbolIndex], { 
                    fontSize: '50px'
                }),
                startY: startY,
                speed: 0.1
            };
            
            this.enemies.push(enemy);
        }
    }

    setupUI() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
        this.levelText = this.add.text(650, 16, 'Level: ' + this.level, { fontSize: '32px', fill: '#fff' });

        document.getElementById('current-problem').style.display = 'block';
        document.getElementById('answer-buttons').style.display = 'flex';
    }

    setupAnswerButtons() {
        this.answerButtons = [
            document.getElementById('button1'),
            document.getElementById('button2'),
            document.getElementById('button3')
        ];

        this.answerButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (this.isLaserAnimating) return;
                const selectedAnswer = parseInt(button.textContent);
                this.checkAnswer(selectedAnswer);
            });
        });
    }

    shootLaser(targetEnemy) {
        this.isLaserAnimating = true;
        this.laser.visible = true;
        this.laser.x = this.cannon.x;
        this.laser.y = this.cannon.y - 25;

        const dx = targetEnemy.symbol.x - this.cannon.x;
        const dy = targetEnemy.symbol.y - this.cannon.y;
        const angle = Math.atan2(dy, dx);

        this.cannon.rotation = angle;

        this.tweens.add({
            targets: this.laser,
            x: targetEnemy.symbol.x,
            y: targetEnemy.symbol.y + 25,
            duration: 500,
            onComplete: () => {
                this.laser.visible = false;
                this.isLaserAnimating = false;
                
                targetEnemy.symbol.destroy();
                this.enemies = this.enemies.filter(e => e !== targetEnemy);

                this.score += 10;
                this.scoreText.setText('Score: ' + this.score);

                if (this.enemies.length === 0) {
                    this.levelUp();
                } else {
                    this.generateNewProblem();
                }

                this.cannon.rotation = 0;
            }
        });
    }

    generateNewProblem() {
        const operation = Math.random() < 0.5 ? '+' : '-';

        let num1, num2, answer, question;

        if (operation === '+') {
            num1 = Phaser.Math.Between(0, this.maxNumber);
            num2 = Phaser.Math.Between(0, this.maxNumber);
            answer = num1 + num2;
            question = `${num1} + ${num2} = ?`;
        } else {
            num1 = Phaser.Math.Between(0, this.maxNumber);
            num2 = Phaser.Math.Between(0, num1);
            answer = num1 - num2;
            question = `${num1} - ${num2} = ?`;
        }

        this.currentProblem = { question, answer };
        document.getElementById('current-problem').textContent = question;

        let wrongAnswers = new Set();
        while (wrongAnswers.size < 2) {
            let delta = Phaser.Math.Between(1, Math.max(2, Math.floor(this.maxNumber * 0.2))) || 1;
            let wrong = Math.random() < 0.5 ? answer + delta : answer - delta;
            if (wrong !== answer && wrong >= 0 && wrong <= this.maxNumber * 2) {
                wrongAnswers.add(wrong);
            }
        }

        const allAnswers = [answer, ...Array.from(wrongAnswers)];
        Phaser.Utils.Array.Shuffle(allAnswers);

        this.answerButtons.forEach((button, index) => {
            button.textContent = allAnswers[index];
            button.disabled = false;
        });

        this.correctAnswer = answer;
    }

    checkAnswer(userAnswer) {
        if (userAnswer === this.correctAnswer && this.enemies.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.enemies.length);
            const targetEnemy = this.enemies[randomIndex];
            this.shootLaser(targetEnemy);
        }
    }

    levelUp() {
        this.level++;
        this.levelText.setText('Level: ' + this.level);
        this.maxNumber = Math.floor(5 * Math.pow(1.2, this.level - 1));
        this.createEnemies();
    }

    update() {
        if (this.gameOver) return;

        for (let enemy of this.enemies) {
            enemy.symbol.y += enemy.speed;
            
            if (enemy.symbol.y > this.cannon.y - 25) {
                this.gameOver = true;
                this.add.text(400, 300, 'GAME OVER', {
                    fontSize: '64px',
                    fill: '#fff'
                }).setOrigin(0.5);
                document.getElementById('answer-buttons').style.display = 'none';
                document.getElementById('current-problem').style.display = 'none';
                break;
            }
        }
    }
}