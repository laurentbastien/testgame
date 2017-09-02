// This example uses the Phaser 2.2.2 framework

// Copyright © 2014 John Watson
// Licensed under the terms of the MIT License

var GameState = function(game) {
};

// Load images and sounds
GameState.prototype.preload = function() {
    this.game.load.image('bullet', 'gfx/crab.png');
    this.game.load.image('cloud', 'gfx/ball.png');
    this.game.load.image('ground', 'gfx/beach.png');
    this.game.load.image('mountains-back', 'gfx/mountains-back.png');
    this.game.load.image('mountains-mid1', 'gfx/mountains-mid1.png');
    this.game.load.image('mountains-mid2', 'gfx/mountains-mid2.png');
    this.game.load.spritesheet('cyclops', 'gfx/octopus.png', 28, 37);
    this.game.load.spritesheet('explosion', 'gfx/explosion.png', 128, 128);
 

};

// Setup the example
GameState.prototype.create = function() {
    // Set stage background color
    this.game.stage.backgroundColor = 0x4488cc
 
    
    this.SHOT_DELAY = 1500; // milliseconds (10 bullets/3 seconds)
    this.BULLET_SPEED = 7000; // pixels/second
    this.NUMBER_OF_BULLETS = 20;
    this.GRAVITY = 980; // pixels/second/second
    this.MAX_SPEED = 500; 

    this.gun = this.game.add.sprite(390, this.game.height - 294, 'bullet');
    this.gun.anchor.setTo(0.5, 0.5);
    // Create a group to hold the missile
    this.missileGroup = this.game.add.group();

    
    this.bulletPool = this.game.add.group();
    for(var i = 0; i < this.NUMBER_OF_BULLETS; i++) {
        // Create each bullet and add it to the group.
        var bullet = this.game.add.sprite(0, 0, 'bullet');
        this.bulletPool.add(bullet);

        // Set its pivot point to the center of the bullet
        bullet.anchor.setTo(0.5, 0.5);

        // Enable physics on the bullet
        this.game.physics.enable(bullet, Phaser.Physics.ARCADE);

        // Set its initial state to "dead".
        bullet.kill();
    }


    // Let's make some clouds
    for(var x = -100; x < this.game.width; x += 105) {
        var cloud = this.game.add.image(x, -90, 'cloud');
        cloud.scale.setTo(5, 7); // Make the clouds big
        cloud.tint = 0x2739bc; // Make the clouds dark
        cloud.smoothed = false; // Keeps the sprite pixelated
    }
    

    // Create some ground
    
    this.ground = this.game.add.group();
    for(var x = 0; x < this.game.width; x += 32) {
        // Add the ground blocks, enable physics on each, make them immovable
        var groundBlock = this.game.add.sprite(x, this.game.height - 32, 'ground');
        this.game.physics.enable(groundBlock, Phaser.Physics.ARCADE);
        groundBlock.body.immovable = true;
        groundBlock.body.allowGravity = false;
        this.ground.add(groundBlock);
    }
    
    this.explosionGroup = this.game.add.group();
    
    // Simulate a pointer click/tap input at the center of the stage
    // when the example begins running.
    this.game.input.activePointer.x = this.game.width/2;
    this.game.input.activePointer.y = this.game.height/2 - 100;


    // Create a pool of cyclopes
    var MONSTERS = 20;
    this.monsterGroup = this.game.add.group();
    this.monsterGroup.enableBody = true;
    this.monsterGroup.physicsBodyType = Phaser.Physics.ARCADE;
    this.monsterGroup.createMultiple(MONSTERS, 'cyclops');
    
    // Create a timer for spawning a new monster
    this.monsterTimer = 0;

};
GameState.prototype.update = function() {
    this.skyback.tilePosition.x -= 0.01; 
};
                                         

GameState.prototype.shootBullet = function() {
    // Enforce a short delay between shots by recording
    // the time that each bullet is shot and testing if
    // the amount of time since the last shot is more than
    // the required delay.
    if (this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
    if (this.game.time.now - this.lastBulletShotAt < this.SHOT_DELAY) return;
    this.lastBulletShotAt = this.game.time.now;

    // Get a dead bullet from the pool
    var bullet = this.bulletPool.getFirstDead();

    // If there aren't any bullets available then don't shoot
    if (bullet === null || bullet === undefined) return;

    // Revive the bullet
    // This makes the bullet "alive"
    bullet.revive();

    // Bullets should kill themselves when they leave the world.
    // Phaser takes care of this for me by setting this flag
    // but you can do it yourself by killing the bullet if
    // its x,y coordinates are outside of the world.
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;

    // Set the bullet position to the gun position.
    bullet.reset(this.gun.x, this.gun.y);
    bullet.rotation = this.gun.rotation;

    // Shoot it in the right direction
    bullet.body.velocity.x = Math.cos(bullet.rotation) * this.BULLET_SPEED;
    bullet.body.velocity.y = Math.sin(bullet.rotation) * this.BULLET_SPEED;
    
    //kill monsters
    
    this.monsterGroup.forEachAlive(function(monster) {
    if (this.game.math.distance(
            this.game.input.activePointer.x, this.game.input.activePointer.y,
            monster.x, monster.y) < 65) {
    
        // monster.frame = 1; // Show the "dead" texture
        monster.body.velocity.y = this.game.rnd.integerInRange(-600, -1200);
        monster.body.velocity.x = this.game.rnd.integerInRange(-500, 500);
        monster.body.acceleration.y = 4000;
        function getRandomInt(min,max){
            min = Math.ceil(min)
            max = Math.floor(max)
            return Math.floor(Math.random() * (max - min)) + min;
        }
        monster.angle = getRandomInt(110,350);

        // Create an explosion
        this.getExplosion(monster.x, monster.y);
    }
}, this);
    
};


// The update() method is called every frame
GameState.prototype.update = function() {
    this.game.physics.arcade.collide(this.bulletPool, this.ground, function(bullet, ground) {
        // Create an explosion
        this.getExplosion(bullet.x, bullet.y);

        // Kill the bullet
        bullet.kill();
    }, null, this);

    // Rotate all living bullets to match their trajectory
    this.bulletPool.forEachAlive(function(bullet) {
        bullet.rotation = Math.atan2(bullet.body.velocity.y, bullet.body.velocity.x);
    }, this);

    // Aim the gun at the pointer.
    // All this function does is calculate the angle using
    // Math.atan2(yPointer-yGun, xPointer-xGun)
    this.gun.rotation = this.game.physics.arcade.angleToPointer(this.gun);

    // Shoot a bullet
    if (this.game.input.activePointer.isDown) {
        this.shootBullet();
    }    
    this.monsterTimer -= this.game.time.elapsed;
    if (this.monsterTimer <= 0) {
        this.monsterTimer = this.game.rnd.integerInRange(150, 500);
        this.createNewMonster();
    }

    // Kill monsters when they go off screen
    this.monsterGroup.forEachAlive(function(monster) {
        if (monster.x < -64 || monster.y > this.game.height) {
            monster.kill();
        }
    }, this);
    

};

GameState.prototype.createNewMonster = function() {
    var monster = this.monsterGroup.getFirstDead(); // Recycle a dead monster
    if (monster) {
        monster.reset(this.game.width + 100, this.game.height - 48); // Position on ground
        monster.revive(); // Set "alive"
        monster.body.velocity.setTo(0, 0); // Stop moving
        monster.body.acceleration.setTo(0, 0); // Stop accelerating
        monster.body.velocity.x = -100; // Move left
        monster.rotation = 0; // Reset rotation
        // monster.frame = 0; // Set animation frame to 0
        monster.anchor.setTo(0.5, 0.5); // Center texture
    }
};

GameState.prototype.getExplosion = function(x, y) {
    // Get the first dead explosion from the explosionGroup
    var explosion = this.explosionGroup.getFirstDead();

    // If there aren't any available, create a new one
    if (explosion === null) {
        explosion = this.game.add.sprite(0, 0, 'explosion');
        explosion.anchor.setTo(0.5, 0.5);

        // Add an animation for the explosion that kills the sprite when the
        // animation is complete
        var animation = explosion.animations.add('boom', [0,1,2,3], 60, false);
        animation.killOnComplete = true;

        // Add the explosion sprite to the group
        this.explosionGroup.add(explosion);
    }

    // Revive the explosion (set it's alive property to true)
    // You can also define a onRevived event handler in your explosion objects
    // to do stuff when they are revived.
    explosion.revive();

    // Move the explosion to the given coordinates
    explosion.x = x;
    explosion.y = y;

    // Set rotation of the explosion at random for a little variety
    explosion.angle = this.game.rnd.integerInRange(0, 360);

    // Play the animation
    explosion.animations.play('boom');

    // Return the explosion itself in case we want to do anything else with it
    return explosion;

};


// Setup game
var game = new Phaser.Game(848, 450, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);