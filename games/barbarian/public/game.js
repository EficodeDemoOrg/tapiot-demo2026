// Copyright (c) 2026 EficodeDemoOrg. Licensed under the MIT License.
// See LICENSE file in the project root for full license information.

// ===== BARBARIAN ARENA — Canvas Fighting Game =====
const canvas = document.getElementById('arena');
const ctx = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;

// ===== AUDIO ENGINE =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function unlockAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
}
window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', unlockAudio);

const SFX = {
    // Brutal sword slash — white noise burst with bandpass
    slash() {
        const dur = 0.15;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        const bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 1;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        src.connect(bp).connect(gain).connect(audioCtx.destination);
        src.start();
    },

    // Heavy overhead impact — low thud + crunch
    overheadHit() {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        // Distortion
        const dist = audioCtx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = (i * 2) / 256 - 1; curve[i] = (Math.PI + 10) * x / (Math.PI + 10 * Math.abs(x)); }
        dist.curve = curve;
        osc.connect(dist).connect(gain).connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);

        // Crunch noise
        const dur = 0.1;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const nSrc = audioCtx.createBufferSource(); nSrc.buffer = buf;
        const nGain = audioCtx.createGain();
        nGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        nGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        nSrc.connect(nGain).connect(audioCtx.destination);
        nSrc.start();
    },

    // Flesh impact — meaty thwack
    fleshHit() {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
        // Wet splat
        const dur = 0.08;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        const nSrc = audioCtx.createBufferSource(); nSrc.buffer = buf;
        const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
        const nGain = audioCtx.createGain(); nGain.gain.value = 0.4;
        nSrc.connect(lp).connect(nGain).connect(audioCtx.destination);
        nSrc.start();
    },

    // Metal clang on block
    block() {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        // Ring
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = 2200;
        const g2 = audioCtx.createGain();
        g2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.connect(g2).connect(audioCtx.destination);
        osc2.start(); osc2.stop(audioCtx.currentTime + 0.4);
    },

    // SPECIAL attack — screaming sword whoosh
    specialSwing() {
        const dur = 0.4;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / audioCtx.sampleRate;
            data[i] = Math.sin(t * 800 + Math.sin(t * 30) * 10) * (1 - t / dur) * 0.5
                     + (Math.random() * 2 - 1) * 0.3 * (1 - t / dur);
        }
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const gain = audioCtx.createGain(); gain.gain.value = 0.7;
        src.connect(gain).connect(audioCtx.destination);
        src.start();
    },

    // DECAPITATION — massive gore explosion
    decapitate() {
        // Deep bass boom
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(15, audioCtx.currentTime + 0.6);
        const dist = audioCtx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = (i * 2) / 256 - 1; curve[i] = Math.tanh(x * 5); }
        dist.curve = curve;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.connect(dist).connect(gain).connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);

        // Wet ripping noise
        const dur = 0.5;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            data[i] = (Math.random() * 2 - 1) * (1 - t) * Math.sin(t * 50);
        }
        const nSrc = audioCtx.createBufferSource(); nSrc.buffer = buf;
        const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000;
        const nGain = audioCtx.createGain(); nGain.gain.value = 0.8;
        nSrc.connect(lp).connect(nGain).connect(audioCtx.destination);
        nSrc.start();

        // Blood splatter noise burst
        setTimeout(() => {
            const dur2 = 0.3;
            const buf2 = audioCtx.createBuffer(1, audioCtx.sampleRate * dur2, audioCtx.sampleRate);
            const d2 = buf2.getChannelData(0);
            for (let i = 0; i < d2.length; i++) d2[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d2.length, 3);
            const s2 = audioCtx.createBufferSource(); s2.buffer = buf2;
            const lp2 = audioCtx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 800;
            const g2 = audioCtx.createGain(); g2.gain.value = 0.6;
            s2.connect(lp2).connect(g2).connect(audioCtx.destination);
            s2.start();
        }, 100);
    },

    // Head bouncing on ground
    headBounce() {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.1);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    },

    // Death scream
    deathScream() {
        const dur = 0.8;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / audioCtx.sampleRate;
            const env = Math.pow(1 - t / dur, 0.5);
            data[i] = (Math.sin(t * 600 + Math.sin(t * 7) * 200) * 0.4
                      + Math.sin(t * 300 + Math.sin(t * 5) * 100) * 0.3
                      + (Math.random() * 2 - 1) * 0.2) * env;
        }
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const gain = audioCtx.createGain(); gain.gain.value = 0.6;
        src.connect(gain).connect(audioCtx.destination);
        src.start();
    },

    // War drum — round start
    warDrum() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 0.3);
            }, i * 250);
        }
    },

    // Crowd roar on fatality
    crowdRoar() {
        const dur = 2.0;
        const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / data.length;
            const env = t < 0.1 ? t / 0.1 : (1 - (t - 0.1) / 0.9);
            data[i] = (Math.random() * 2 - 1) * env * 0.3
                     + Math.sin(i * 0.01 + Math.sin(i * 0.001) * 5) * env * 0.15;
        }
        const src = audioCtx.createBufferSource(); src.buffer = buf;
        const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
        const gain = audioCtx.createGain(); gain.gain.value = 0.5;
        src.connect(lp).connect(gain).connect(audioCtx.destination);
        src.start();
    },

    // Footstep
    step() {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    },

    // Victory gong
    victoryGong() {
        [200, 300, 400].forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine'; osc.frequency.value = freq;
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 1.5);
            }, i * 200);
        });
    }
};

// ===== CONSTANTS =====
const GROUND_Y = 460;
const GRAVITY = 0.6;
const ROUND_WIN_SCORE = 2;
const ATTACK_COOLDOWN = 400;
const SPECIAL_COOLDOWN = 1500;
const BLOCK_DAMAGE_REDUCTION = 0.8;

// ===== GAME STATE =====
let gameState = 'title'; // title, fighting, roundEnd, gameOver, fatality
let roundTimer = 60;
let timerInterval = null;
let screenShake = 0;
let bloodParticles = [];
let sparks = [];
let headObj = null; // for decapitation
let limbObjs = []; // dismembered arms

// Hitlag (impact freeze)
let hitlagFrames = 0;

// Slow-motion kill cam
let slowMoFrames = 0;
let slowMoFactor = 1; // 1 = normal, 0.2 = slow

// Combo tracking per fighter
let comboCount = { p1: 0, p2: 0 };
let comboTimer = { p1: 0, p2: 0 };
const COMBO_WINDOW = 90; // frames

// Persistent gore (survives across rounds)
let bloodPools = [];
let wallSplatters = [];
let persistentGore = []; // body parts from previous rounds

// ===== COLORS =====
const COLORS = {
    bg: '#1a0a00',
    ground: '#2a1a0a',
    blood: '#8B0000',
    bloodBright: '#CC0000',
    sky: '#0d0d1a',
    moon: '#ffe4b5',
    text: '#d4a574',
    gold: '#FFD700',
    healthP1: '#CC0000',
    healthP2: '#4169E1',
    staminaColor: '#DAA520'
};

// ===== FIGHTER CLASS =====
class Fighter {
    constructor(name, x, facing, color, controls) {
        this.name = name;
        this.x = x;
        this.y = GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.width = 50;
        this.height = 90;
        this.facing = facing; // 1 = right, -1 = left
        this.color = color;
        this.controls = controls;

        this.maxHealth = 100;
        this.health = 100;
        this.stamina = 100;
        this.wins = 0;

        this.isAttacking = false;
        this.attackType = null; // 'slash', 'overhead', 'special'
        this.attackFrame = 0;
        this.attackDuration = 0;
        this.attackHit = false;
        this.lastAttackTime = 0;
        this.lastSpecialTime = 0;

        this.isBlocking = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.isHurt = false;
        this.hurtTimer = 0;
        this.isDead = false;
        this.isDecapitated = false;
        this.bleeding = false;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.swordAngle = 0;
    }

    get centerX() { return this.x + this.width / 2; }
    get feetY() { return this.y + this.height; }

    getAttackBox() {
        const reach = this.attackType === 'special' ? 80 : 60;
        const yOff = this.attackType === 'overhead' ? -30 : 0;
        return {
            x: this.facing === 1 ? this.x + this.width : this.x - reach,
            y: this.y + 10 + yOff,
            width: reach,
            height: this.attackType === 'overhead' ? 50 : 40
        };
    }

    getHitBox() {
        const h = this.isCrouching ? this.height * 0.6 : this.height;
        const yOff = this.isCrouching ? this.height - h : 0;
        return { x: this.x, y: this.y + yOff, width: this.width, height: h };
    }

    attack(type) {
        const now = Date.now();
        if (this.isAttacking || this.isBlocking || this.isDead) return;

        if (type === 'special') {
            if (now - this.lastSpecialTime < SPECIAL_COOLDOWN || this.stamina < 30) return;
            this.lastSpecialTime = now;
            this.stamina -= 30;
            this.attackDuration = 25;
        } else {
            if (now - this.lastAttackTime < ATTACK_COOLDOWN || this.stamina < 10) return;
            this.lastAttackTime = now;
            this.stamina -= 10;
            this.attackDuration = type === 'overhead' ? 18 : 14;
        }

        this.isAttacking = true;
        this.attackType = type;
        this.attackFrame = 0;
        this.attackHit = false;

        // Sound
        if (type === 'special') SFX.specialSwing();
        else SFX.slash();
    }

    takeDamage(amount, attackerX) {
        if (this.isBlocking) {
            amount *= (1 - BLOCK_DAMAGE_REDUCTION);
            this.stamina -= 15;
            spawnSparks(this.facing === 1 ? this.x : this.x + this.width, this.y + 30, 5);
            SFX.block();
        } else {
            spawnBlood(this.centerX, this.y + 20, 8);
            screenShake = 6;
            // Hitlag — freeze frames on impact
            hitlagFrames = amount >= 25 ? 6 : (amount >= 18 ? 4 : 2);
            // Stagger — heavier knockback on big hits
            const staggerMultiplier = amount >= 25 ? 2.5 : (amount >= 18 ? 1.8 : 1);
            this.vx = (attackerX < this.x ? 4 : -4) * staggerMultiplier;
            this.hurtTimer = amount >= 18 ? 18 : 10;
            // Wall splatter if near edge
            if (this.x < 80 || this.x > canvas.width - 80) {
                spawnWallSplatter(this.x, this.y + 20, 4);
            }
            if (amount >= 18) SFX.overheadHit(); else SFX.fleshHit();
        }
        this.health -= amount;
        this.isHurt = true;
        if (!this.isBlocking) {
            // Blood trail flag when low health
            this.bleeding = this.health < 30 && this.health > 0;
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            SFX.deathScream();
            // Slow-mo kill cam
            slowMoFrames = 45;
            slowMoFactor = 0.2;
        }
    }

    update(keys) {
        if (this.isDead || this.isDecapitated) return;

        // Blood trail when low health
        if (this.bleeding && Math.abs(this.vx) > 1 && Math.random() < 0.3) {
            bloodParticles.push({
                x: this.centerX + (Math.random() - 0.5) * 10,
                y: this.y + this.height - 5,
                vx: 0, vy: 0.5,
                size: Math.random() * 2 + 1,
                life: 40,
                color: COLORS.blood,
                pooled: false
            });
        }

        // Stamina regen
        if (!this.isAttacking && !this.isBlocking) {
            this.stamina = Math.min(100, this.stamina + 0.3);
        }

        // Hurt recovery
        if (this.isHurt) {
            this.hurtTimer--;
            if (this.hurtTimer <= 0) this.isHurt = false;
        }

        // Movement
        if (!this.isAttacking) {
            this.vx *= 0.8;
            if (keys[this.controls.left]) { this.vx = -4; }
            if (keys[this.controls.right]) { this.vx = 4; }
            if (keys[this.controls.jump] && !this.isJumping) {
                this.vy = -12;
                this.isJumping = true;
            }
            this.isCrouching = !!keys[this.controls.crouch];
            this.isBlocking = !!keys[this.controls.block] && this.stamina > 0;
            if (this.isBlocking) this.stamina -= 0.2;
        }

        // Attack updates
        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= this.attackDuration) {
                this.isAttacking = false;
                this.attackType = null;
            }
        }

        // Physics
        this.x += this.vx;
        this.vy += GRAVITY;
        this.y += this.vy;

        if (this.y >= GROUND_Y) {
            this.y = GROUND_Y;
            this.vy = 0;
            this.isJumping = false;
        }

        // Boundaries
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));

        // Animation
        this.animTimer++;
        if (this.animTimer % 8 === 0) {
            this.animFrame = (this.animFrame + 1) % 4;
            if (Math.abs(this.vx) > 2 && !this.isJumping && this.animFrame % 2 === 0) SFX.step();
        }
    }

    draw() {
        ctx.save();
        const dx = this.isHurt ? (Math.random() - 0.5) * 4 : 0;

        // Body
        const bodyH = this.isCrouching ? this.height * 0.6 : this.height;
        const bodyY = this.isCrouching ? this.y + this.height - bodyH : this.y;

        // Skin color
        ctx.fillStyle = this.isHurt ? '#ff6666' : this.color.skin;
        // Head
        if (!this.isDecapitated) {
            ctx.beginPath();
            ctx.arc(this.centerX + dx, bodyY + 8, 14, 0, Math.PI * 2);
            ctx.fill();

            // Hair/helmet
            ctx.fillStyle = this.color.hair;
            ctx.beginPath();
            ctx.arc(this.centerX + dx, bodyY + 4, 14, Math.PI, 0);
            ctx.fill();
            // Horns
            ctx.strokeStyle = this.color.hair;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.centerX - 12 + dx, bodyY + 2);
            ctx.lineTo(this.centerX - 18 + dx, bodyY - 12);
            ctx.moveTo(this.centerX + 12 + dx, bodyY + 2);
            ctx.lineTo(this.centerX + 18 + dx, bodyY - 12);
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.centerX - 5 + dx + this.facing * 2, bodyY + 6, 3, 3);
            ctx.fillRect(this.centerX + 3 + dx + this.facing * 2, bodyY + 6, 3, 3);
            ctx.fillStyle = '#000';
            ctx.fillRect(this.centerX - 4 + dx + this.facing * 2, bodyY + 7, 2, 2);
            ctx.fillRect(this.centerX + 4 + dx + this.facing * 2, bodyY + 7, 2, 2);
        } else {
            // Blood stump
            ctx.fillStyle = COLORS.blood;
            ctx.beginPath();
            ctx.arc(this.centerX + dx, bodyY + 10, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Torso
        ctx.fillStyle = this.isHurt ? '#ff6666' : this.color.skin;
        ctx.fillRect(this.centerX - 12 + dx, bodyY + 20, 24, 30);

        // Fur loincloth / armor
        ctx.fillStyle = this.color.armor;
        ctx.fillRect(this.centerX - 14 + dx, bodyY + 18, 28, 10);
        ctx.fillRect(this.centerX - 10 + dx, bodyY + 48, 20, 12);

        // Belt
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.centerX - 13 + dx, bodyY + 46, 26, 4);

        // Legs
        ctx.fillStyle = this.color.skin;
        const legAnim = this.vx !== 0 ? Math.sin(this.animFrame * 1.5) * 6 : 0;
        ctx.fillRect(this.centerX - 10 + dx, bodyY + 58, 8, 28 + legAnim);
        ctx.fillRect(this.centerX + 2 + dx, bodyY + 58, 8, 28 - legAnim);

        // Boots
        ctx.fillStyle = '#4a2a0a';
        ctx.fillRect(this.centerX - 12 + dx, bodyY + 82 + legAnim, 12, 8);
        ctx.fillRect(this.centerX + 0 + dx, bodyY + 82 - legAnim, 12, 8);

        // Arms & Sword
        this.drawArms(dx, bodyY);

        // Block shield effect
        if (this.isBlocking) {
            ctx.strokeStyle = 'rgba(218, 165, 32, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.centerX + this.facing * 20, bodyY + 35, 25, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawArms(dx, bodyY) {
        const armX = this.centerX + this.facing * 14 + dx;
        const armY = bodyY + 24;

        // Back arm
        ctx.fillStyle = this.color.skin;
        ctx.fillRect(this.centerX - this.facing * 14 + dx, armY, 8, 24);

        if (this.isAttacking) {
            const progress = this.attackFrame / this.attackDuration;
            let swordStartX, swordStartY, swordEndX, swordEndY;

            if (this.attackType === 'slash') {
                const angle = -Math.PI / 3 + progress * Math.PI;
                swordStartX = armX;
                swordStartY = armY;
                swordEndX = armX + Math.cos(angle) * this.facing * 55;
                swordEndY = armY + Math.sin(angle) * 55;
            } else if (this.attackType === 'overhead') {
                const angle = -Math.PI / 2 + progress * Math.PI;
                swordStartX = armX;
                swordStartY = armY - 10;
                swordEndX = armX + Math.cos(angle) * this.facing * 60;
                swordEndY = armY - 10 + Math.sin(angle) * 60;
            } else { // special
                const angle = -Math.PI / 2 + progress * Math.PI * 1.5;
                swordStartX = armX;
                swordStartY = armY;
                swordEndX = armX + Math.cos(angle) * this.facing * 70;
                swordEndY = armY + Math.sin(angle) * 70;
                // Trail effect
                ctx.strokeStyle = 'rgba(255, 50, 0, 0.4)';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(swordStartX, swordStartY);
                ctx.lineTo(swordEndX, swordEndY);
                ctx.stroke();
            }

            // Sword arm
            ctx.fillStyle = this.color.skin;
            ctx.save();
            ctx.translate(armX, armY);
            ctx.rotate(Math.atan2(swordEndY - armY, (swordEndX - armX)));
            ctx.fillRect(0, -4, 20, 8);
            ctx.restore();

            // Sword blade
            ctx.strokeStyle = '#C0C0C0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(swordStartX, swordStartY);
            ctx.lineTo(swordEndX, swordEndY);
            ctx.stroke();
            // Sword edge glow
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(swordStartX, swordStartY);
            ctx.lineTo(swordEndX, swordEndY);
            ctx.stroke();
            // Hilt
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(swordStartX - 6, swordStartY - 2, 12, 4);
        } else {
            // Idle sword arm + sword
            ctx.fillStyle = this.color.skin;
            ctx.fillRect(armX - 4, armY, 8, 24);
            // Sword hanging
            ctx.strokeStyle = '#A0A0A0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(armX, armY + 22);
            ctx.lineTo(armX + this.facing * 5, armY + 65);
            ctx.stroke();
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(armX - 5, armY + 20, 10, 4);
        }
    }
}

// ===== PARTICLES =====
function spawnBlood(x, y, count) {
    for (let i = 0; i < count; i++) {
        bloodParticles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 6 - 2,
            size: Math.random() * 4 + 2,
            life: 60 + Math.random() * 30,
            color: Math.random() > 0.5 ? COLORS.blood : COLORS.bloodBright,
            pooled: false
        });
    }
}

// Wall blood splatter
function spawnWallSplatter(x, y, count) {
    const wallX = x < 100 ? 0 : (x > canvas.width - 100 ? canvas.width : null);
    if (wallX === null) return;
    for (let i = 0; i < count; i++) {
        wallSplatters.push({
            x: wallX,
            y: y + (Math.random() - 0.5) * 60,
            size: Math.random() * 8 + 3,
            dripY: 0,
            dripSpeed: Math.random() * 0.3 + 0.1,
            color: Math.random() > 0.5 ? COLORS.blood : COLORS.bloodBright,
            alpha: 0.8
        });
    }
}

// Spawn dismembered arm
function spawnLimb(fighter) {
    limbObjs.push({
        x: fighter.centerX + fighter.facing * 15,
        y: fighter.y + 24,
        vx: fighter.facing * -2 + (Math.random() - 0.5) * 5,
        vy: -6 - Math.random() * 4,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        color: fighter.color,
        landed: false,
        length: 24
    });
    spawnBlood(fighter.centerX + fighter.facing * 15, fighter.y + 24, 15);
}

function spawnSparks(x, y, count) {
    for (let i = 0; i < count; i++) {
        sparks.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: -Math.random() * 5 - 2,
            size: Math.random() * 3 + 1,
            life: 20 + Math.random() * 15
        });
    }
}

function updateParticles() {
    bloodParticles = bloodParticles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.life--;
        // Create blood pools on ground
        if (p.y >= GROUND_Y + 80 && !p.pooled) {
            p.vy = 0; p.vx = 0;
            p.pooled = true;
            bloodPools.push({
                x: p.x, y: GROUND_Y + 82,
                radius: Math.random() * 3 + 2,
                maxRadius: Math.random() * 12 + 5,
                color: p.color,
                alpha: 0.7
            });
        }
        // Wall splatter
        if ((p.x <= 2 || p.x >= canvas.width - 2) && p.life > 10) {
            wallSplatters.push({
                x: p.x <= 2 ? 0 : canvas.width,
                y: p.y, size: p.size + 2,
                dripY: 0, dripSpeed: Math.random() * 0.3 + 0.1,
                color: p.color, alpha: 0.7
            });
            p.life = 0;
        }
        return p.life > 0;
    });
    sparks = sparks.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        return p.life > 0;
    });
    // Expand blood pools
    bloodPools.forEach(pool => {
        if (pool.radius < pool.maxRadius) pool.radius += 0.05;
    });
    // Wall drips
    wallSplatters.forEach(s => {
        if (s.dripY < 40) s.dripY += s.dripSpeed;
        s.alpha = Math.max(0.3, s.alpha - 0.0005);
    });
    // Limb physics
    limbObjs.forEach(limb => {
        if (!limb.landed) {
            limb.x += limb.vx;
            limb.y += limb.vy;
            limb.vy += GRAVITY;
            limb.rotation += limb.rotSpeed;
            if (limb.y >= GROUND_Y + 70) {
                limb.y = GROUND_Y + 70;
                limb.landed = true;
                limb.vx = 0;
                spawnBlood(limb.x, limb.y, 5);
            }
        }
    });
    // Combo timers decay
    if (comboTimer.p1 > 0) { comboTimer.p1--; if (comboTimer.p1 <= 0) comboCount.p1 = 0; }
    if (comboTimer.p2 > 0) { comboTimer.p2--; if (comboTimer.p2 <= 0) comboCount.p2 = 0; }
}

function drawParticles() {
    // Blood pools on ground (persistent)
    bloodPools.forEach(pool => {
        ctx.globalAlpha = pool.alpha;
        ctx.fillStyle = pool.color;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.radius, pool.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Wall splatters
    wallSplatters.forEach(s => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        // Drip
        ctx.fillRect(s.x - 1, s.y, 2, s.dripY);
    });
    ctx.globalAlpha = 1;

    // Blood particles
    bloodParticles.forEach(p => {
        ctx.globalAlpha = p.life / 60;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    sparks.forEach(p => {
        ctx.globalAlpha = p.life / 20;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Dismembered limbs
    limbObjs.forEach(limb => {
        ctx.save();
        ctx.translate(limb.x, limb.y);
        ctx.rotate(limb.rotation);
        ctx.fillStyle = limb.color.skin;
        ctx.fillRect(-4, 0, 8, limb.length);
        // Blood at stump
        ctx.fillStyle = COLORS.blood;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        // Hand
        ctx.fillStyle = limb.color.skin;
        ctx.beginPath();
        ctx.arc(0, limb.length, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Persistent gore from previous rounds
    persistentGore.forEach(g => {
        if (g.type === 'pool') {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, g.radius, g.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

// ===== DECAPITATED HEAD =====
function spawnHead(fighter) {
    headObj = {
        x: fighter.centerX,
        y: fighter.y + 8,
        vx: fighter.facing * -3 + (Math.random() - 0.5) * 4,
        vy: -8,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        color: fighter.color,
        landed: false
    };
    spawnBlood(fighter.centerX, fighter.y + 10, 25);
}

function updateHead() {
    if (!headObj) return;
    if (!headObj.landed) {
        headObj.x += headObj.vx;
        headObj.y += headObj.vy;
        headObj.vy += GRAVITY;
        headObj.rotation += headObj.rotSpeed;
        if (headObj.y >= GROUND_Y + 70) {
            headObj.y = GROUND_Y + 70;
            headObj.landed = true;
            headObj.vx = 0;
            spawnBlood(headObj.x, headObj.y, 10);
            SFX.headBounce();
        }
    }
}

function drawHead() {
    if (!headObj) return;
    ctx.save();
    ctx.translate(headObj.x, headObj.y);
    ctx.rotate(headObj.rotation);
    // Head
    ctx.fillStyle = headObj.color.skin;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = headObj.color.hair;
    ctx.beginPath();
    ctx.arc(0, -4, 14, Math.PI, 0);
    ctx.fill();
    // Horns
    ctx.strokeStyle = headObj.color.hair;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-18, -16);
    ctx.moveTo(12, -2);
    ctx.lineTo(18, -16);
    ctx.stroke();
    // X eyes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, -1); ctx.lineTo(-2, 3);
    ctx.moveTo(-2, -1); ctx.lineTo(-6, 3);
    ctx.moveTo(2, -1); ctx.lineTo(6, 3);
    ctx.moveTo(6, -1); ctx.lineTo(2, 3);
    ctx.stroke();
    // Blood drip from neck
    ctx.fillStyle = COLORS.blood;
    ctx.beginPath();
    ctx.arc(0, 13, 8, 0, Math.PI);
    ctx.fill();
    ctx.restore();
}

// ===== FIGHTERS =====
const player1 = new Fighter('KORGOTH', 150, 1, {
    skin: '#D2691E', hair: '#8B8B83', armor: '#654321'
}, { left: 'a', right: 'd', jump: 'w', crouch: 's', slash: 'f', overhead: 'g', special: 'h', block: 'r' });

const player2 = new Fighter('THULSA', 800, -1, {
    skin: '#C19A6B', hair: '#2F4F4F', armor: '#3B2F2F'
}, { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', crouch: 'ArrowDown', slash: 'Numpad1', overhead: 'Numpad2', special: 'Numpad3', block: 'Numpad0' });

// Alternative P2 controls for keyboards without numpads
const p2AltControls = { slash: 'j', overhead: 'k', special: 'l', block: 'u' };

// ===== INPUT =====
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (gameState === 'title' && e.key === 'Enter') startRound();
    if (gameState === 'roundEnd' && e.key === 'Enter') startRound();
    if (gameState === 'gameOver' && e.key === 'Enter') resetGame();

    // Attacks
    if (gameState === 'fighting') {
        if (e.key === player1.controls.slash) player1.attack('slash');
        if (e.key === player1.controls.overhead) player1.attack('overhead');
        if (e.key === player1.controls.special) player1.attack('special');
        if (e.key === player2.controls.slash || e.key === p2AltControls.slash) player2.attack('slash');
        if (e.key === player2.controls.overhead || e.key === p2AltControls.overhead) player2.attack('overhead');
        if (e.key === player2.controls.special || e.key === p2AltControls.special) player2.attack('special');
    }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Also handle alt P2 block
function isP2Blocking() {
    return keys[player2.controls.block] || keys[p2AltControls.block];
}

// ===== COLLISION =====
function boxOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function checkAttack(attacker, defender) {
    if (!attacker.isAttacking || attacker.attackHit) return;
    // Only hit during the active frames
    const progress = attacker.attackFrame / attacker.attackDuration;
    if (progress < 0.3 || progress > 0.8) return;

    const atkBox = attacker.getAttackBox();
    const defBox = defender.getHitBox();

    if (boxOverlap(atkBox, defBox)) {
        attacker.attackHit = true;
        let damage;
        if (attacker.attackType === 'slash') damage = 12;
        else if (attacker.attackType === 'overhead') damage = 18;
        else damage = 30; // special

        // Combo tracking & gore scaling
        const comboKey = attacker === player1 ? 'p1' : 'p2';
        comboCount[comboKey]++;
        comboTimer[comboKey] = COMBO_WINDOW;
        const goreMultiplier = Math.min(comboCount[comboKey], 5);
        spawnBlood(defender.centerX, defender.y + 20, 3 * goreMultiplier);
        screenShake = Math.min(6 + comboCount[comboKey] * 2, 20);

        // Check if defender is blocking
        if (attacker === player1) {
            defender.isBlocking = isP2Blocking();
        }

        defender.takeDamage(damage, attacker.x);

        if (defender.isDead) {
            onFighterDeath(attacker, defender);
        }
    }
}

// ===== ROUND MANAGEMENT =====
function onFighterDeath(winner, loser) {
    winner.wins++;
    spawnBlood(loser.centerX, loser.y + 20, 20);
    screenShake = 15;

    // Fatality variations based on kill type
    const killType = winner.attackType;
    if (winner.wins >= ROUND_WIN_SCORE || killType === 'special' || killType === 'overhead') {
        if (killType === 'overhead') {
            // OVERHEAD KILL: dismember arm + decapitate
            loser.isDecapitated = true;
            spawnHead(loser);
            spawnLimb(loser);
            SFX.decapitate();
            spawnBlood(loser.centerX, loser.y + 30, 30);
        } else if (killType === 'slash') {
            // SLASH KILL: disembowel — extra blood fountain
            loser.isDecapitated = true;
            spawnHead(loser);
            SFX.decapitate();
            for (let i = 0; i < 3; i++) {
                setTimeout(() => spawnBlood(loser.centerX, loser.y + 40, 15), i * 100);
            }
        } else {
            // SPECIAL KILL: classic decapitation
            loser.isDecapitated = true;
            spawnHead(loser);
            SFX.decapitate();
        }
        setTimeout(() => SFX.crowdRoar(), 500);
        gameState = 'fatality';
        setTimeout(() => {
            if (winner.wins >= ROUND_WIN_SCORE) {
                gameState = 'gameOver';
                SFX.victoryGong();
            } else {
                gameState = 'roundEnd';
            }
        }, 3000);
    } else {
        gameState = 'roundEnd';
    }

    clearInterval(timerInterval);
}

function startRound() {
    gameState = 'fighting';
    roundTimer = 60;
    // Persist blood pools and wall splatters across rounds
    bloodPools.forEach(pool => {
        persistentGore.push({ type: 'pool', x: pool.x, y: pool.y, radius: pool.radius, color: pool.color });
    });
    bloodParticles = [];
    sparks = [];
    headObj = null;
    limbObjs = [];
    bloodPools = [];
    // Keep wall splatters — they stay forever
    comboCount = { p1: 0, p2: 0 };
    comboTimer = { p1: 0, p2: 0 };
    hitlagFrames = 0;
    slowMoFrames = 0;
    slowMoFactor = 1;
    SFX.warDrum();

    player1.x = 150; player1.y = GROUND_Y; player1.health = 100; player1.stamina = 100;
    player1.isDead = false; player1.isDecapitated = false; player1.isAttacking = false;
    player1.vx = 0; player1.vy = 0;

    player2.x = 800; player2.y = GROUND_Y; player2.health = 100; player2.stamina = 100;
    player2.isDead = false; player2.isDecapitated = false; player2.isAttacking = false;
    player2.vx = 0; player2.vy = 0;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameState !== 'fighting') return;
        roundTimer--;
        if (roundTimer <= 0) {
            clearInterval(timerInterval);
            // Whoever has more health wins
            if (player1.health >= player2.health) {
                player2.isDead = true;
                onFighterDeath(player1, player2);
            } else {
                player1.isDead = true;
                onFighterDeath(player2, player1);
            }
        }
    }, 1000);
}

function resetGame() {
    player1.wins = 0;
    player2.wins = 0;
    bloodParticles = [];
    sparks = [];
    headObj = null;
    limbObjs = [];
    bloodPools = [];
    wallSplatters = [];
    persistentGore = [];
    comboCount = { p1: 0, p2: 0 };
    comboTimer = { p1: 0, p2: 0 };
    gameState = 'title';
}

// ===== BACKGROUND =====
function drawBackground() {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#0d0d2b');
    skyGrad.addColorStop(1, '#1a0a00');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, GROUND_Y + 10);

    // Moon
    ctx.fillStyle = 'rgba(255, 228, 181, 0.3)';
    ctx.beginPath();
    ctx.arc(800, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 228, 181, 0.6)';
    ctx.beginPath();
    ctx.arc(800, 80, 30, 0, Math.PI * 2);
    ctx.fill();

    // Distant mountains
    ctx.fillStyle = '#0d0d1a';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= canvas.width; x += 80) {
        ctx.lineTo(x, GROUND_Y - 40 - Math.sin(x * 0.01) * 60 - Math.cos(x * 0.007) * 30);
    }
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.fill();

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GROUND_Y + 10, canvas.width, canvas.height - GROUND_Y);

    // Ground texture
    ctx.fillStyle = '#1a0f05';
    for (let x = 0; x < canvas.width; x += 30) {
        ctx.fillRect(x + Math.sin(x) * 5, GROUND_Y + 12, 15, 2);
    }

    // Skulls on ground (decoration)
    ctx.fillStyle = '#d4c4a0';
    drawSkull(100, GROUND_Y + 30);
    drawSkull(700, GROUND_Y + 25);
    drawSkull(500, GROUND_Y + 35);

    // Torches
    drawTorch(50, GROUND_Y - 60);
    drawTorch(canvas.width - 50, GROUND_Y - 60);
}

function drawSkull(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(x - 3, y, 2, 2);
    ctx.fillRect(x + 1, y, 2, 2);
    ctx.fillStyle = '#d4c4a0';
}

function drawTorch(x, y) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(x - 3, y, 6, 70);
    // Flame
    const flicker = Math.sin(Date.now() * 0.01) * 3;
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(x, y - 5 + flicker, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(x, y - 7 + flicker, 5, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    ctx.fillStyle = 'rgba(255, 100, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();
}

// ===== HUD =====
function drawHUD() {
    // P1 health
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 300, 20);
    ctx.fillStyle = COLORS.healthP1;
    ctx.fillRect(20, 20, 300 * (player1.health / player1.maxHealth), 20);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(20, 20, 300, 20);

    // P1 stamina
    ctx.fillStyle = '#222';
    ctx.fillRect(20, 44, 200, 8);
    ctx.fillStyle = COLORS.staminaColor;
    ctx.fillRect(20, 44, 200 * (player1.stamina / 100), 8);

    // P2 health
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width - 320, 20, 300, 20);
    ctx.fillStyle = COLORS.healthP2;
    const p2HealthWidth = 300 * (player2.health / player2.maxHealth);
    ctx.fillRect(canvas.width - 20 - p2HealthWidth, 20, p2HealthWidth, 20);
    ctx.strokeStyle = '#888';
    ctx.strokeRect(canvas.width - 320, 20, 300, 20);

    // P2 stamina
    ctx.fillStyle = '#222';
    ctx.fillRect(canvas.width - 220, 44, 200, 8);
    ctx.fillStyle = COLORS.staminaColor;
    const p2StamWidth = 200 * (player2.stamina / 100);
    ctx.fillRect(canvas.width - 20 - p2StamWidth, 44, p2StamWidth, 8);

    // Names
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(player1.name, 22, 16);
    ctx.textAlign = 'right';
    ctx.fillText(player2.name, canvas.width - 22, 16);

    // Win markers
    ctx.textAlign = 'left';
    for (let i = 0; i < player1.wins; i++) {
        ctx.fillStyle = COLORS.gold;
        ctx.fillText('💀', 22 + i * 22, 68);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i < player2.wins; i++) {
        ctx.fillStyle = COLORS.gold;
        ctx.fillText('💀', canvas.width - 22 - i * 22, 68);
    }

    // Timer
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = roundTimer <= 10 ? '#CC0000' : COLORS.gold;
    ctx.fillText(roundTimer, canvas.width / 2, 40);
}

// ===== SCREENS =====
function drawTitleScreen() {
    drawBackground();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.blood;
    ctx.font = 'bold 64px serif';
    ctx.fillText('BARBARIAN', canvas.width / 2, 180);
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText('A R E N A', canvas.width / 2, 230);

    ctx.font = '16px monospace';
    ctx.fillStyle = COLORS.text;
    ctx.fillText('⚔️ DECAPITATE YOUR ENEMY ⚔️', canvas.width / 2, 290);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('PLAYER 1: WASD move | F slash | G overhead | H special | R block', canvas.width / 2, 350);
    ctx.fillText('PLAYER 2: Arrows move | J slash | K overhead | L special | U block', canvas.width / 2, 375);
    ctx.fillText(`First to ${ROUND_WIN_SCORE} wins. Kill with SPECIAL for instant FATALITY.`, canvas.width / 2, 410);

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 20px monospace';
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) ctx.fillText('PRESS ENTER TO FIGHT', canvas.width / 2, 480);
}

function drawRoundEnd() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = COLORS.blood;
    const winner = player1.isDead ? player2.name : player1.name;
    ctx.fillText(`${winner} WINS`, canvas.width / 2, 250);
    ctx.font = '18px monospace';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`${player1.name}: ${player1.wins}  |  ${player2.name}: ${player2.wins}`, canvas.width / 2, 300);
    ctx.fillStyle = COLORS.gold;
    ctx.font = '16px monospace';
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) ctx.fillText('PRESS ENTER FOR NEXT ROUND', canvas.width / 2, 360);
}

function drawFatality() {
    ctx.fillStyle = 'rgba(139,0,0,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px serif';
    ctx.fillStyle = COLORS.bloodBright;
    const shake = Math.sin(Date.now() * 0.02) * 3;
    ctx.fillText('☠ FATALITY ☠', canvas.width / 2 + shake, 280);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px serif';
    ctx.fillStyle = COLORS.gold;
    const winner = player1.wins >= ROUND_WIN_SCORE ? player1.name : player2.name;
    ctx.fillText(`${winner}`, canvas.width / 2, 220);
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = COLORS.blood;
    ctx.fillText('CHAMPION OF THE ARENA', canvas.width / 2, 275);
    ctx.font = '20px monospace';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Final Score: ${player1.name} ${player1.wins} - ${player2.wins} ${player2.name}`, canvas.width / 2, 330);
    ctx.fillStyle = COLORS.gold;
    ctx.font = '16px monospace';
    const blink = Math.sin(Date.now() * 0.005) > 0;
    if (blink) ctx.fillText('PRESS ENTER TO PLAY AGAIN', canvas.width / 2, 400);
}

// ===== GAME LOOP =====
function update() {
    // Hitlag freeze
    if (hitlagFrames > 0) {
        hitlagFrames--;
        return;
    }

    // Slow-motion kill cam
    if (slowMoFrames > 0) {
        slowMoFrames--;
        if (slowMoFrames <= 0) slowMoFactor = 1;
    }

    if (gameState === 'fighting') {
        // Handle P2 alt block
        player2.isBlocking = isP2Blocking() && player2.stamina > 0;
        if (player2.isBlocking) player2.stamina -= 0.2;

        player1.update(keys);
        player2.update(keys);

        // Face each other
        if (player1.centerX < player2.centerX) {
            player1.facing = 1; player2.facing = -1;
        } else {
            player1.facing = -1; player2.facing = 1;
        }

        // Push apart if overlapping
        const dist = Math.abs(player1.centerX - player2.centerX);
        if (dist < 40 && !player1.isDead && !player2.isDead) {
            const push = (40 - dist) / 2;
            if (player1.centerX < player2.centerX) {
                player1.x -= push; player2.x += push;
            } else {
                player1.x += push; player2.x -= push;
            }
        }

        checkAttack(player1, player2);
        checkAttack(player2, player1);
    }

    updateParticles();
    updateHead();

    if (screenShake > 0) screenShake--;
}

function draw() {
    ctx.save();
    if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake * 2, (Math.random() - 0.5) * screenShake * 2);
    }

    if (gameState === 'title') {
        drawTitleScreen();
    } else {
        drawBackground();
        drawParticles();
        drawHead();
        player1.draw();
        player2.draw();
        drawHUD();

        if (gameState === 'fatality') drawFatality();
        if (gameState === 'roundEnd') drawRoundEnd();
        if (gameState === 'gameOver') drawGameOver();
    }

    ctx.restore();
}

let lastTime = 0;
const FRAME_TIME = 1000 / 60;

function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    const effectiveFrameTime = FRAME_TIME / slowMoFactor;
    if (delta >= effectiveFrameTime || slowMoFactor >= 1) {
        lastTime = timestamp;
        update();
        draw();
        // Slow-mo tint overlay
        if (slowMoFactor < 1) {
            ctx.fillStyle = 'rgba(139, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    requestAnimationFrame(gameLoop);
}

gameLoop(0);
