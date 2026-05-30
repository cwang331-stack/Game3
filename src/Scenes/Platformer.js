class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 200;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -470;
        this.PARTICLE_VELOCITY = 30;
        this.SCALE = 3.0;
    }

    create() {
        // set up player avatar
        my.sprite.player = this.physics.add.sprite(3*18, 15*18, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 20);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.backsheet = this.map.addTilesetImage("tilemap_backgrounds", "tilemap_backgrounds");
        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.backLayer = this.map.createLayer("back", this.backsheet, 0, 0);
        this.backLayer.setDepth(-1);
        this.backLayer.ScrollFactorX = 2;
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

         // Simple camera to follow player
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        //platform
        this.platform = this.map.createFromObjects("platform", {
            name: "platform",
            key: "tilemap_sheet",
            frame: 146
        });
        
        this.physics.world.enable(this.platform, Phaser.Physics.Arcade.DYNAMIC_BODY);
        this.movingPlatforms = this.add.group(this.platform);

        this.platform.forEach(plat => {
            plat.body.setImmovable(true);
            plat.body.setAllowGravity(false);
            this.tweens.add({
                targets: plat,
                y: plat.y - 18*plat.height,
                duration: 25*18*plat.height,
                yoyo: true,
                repeat: -1,
                ease: 'Linear'
            });
        });
        // this.movingPlatforms.bodymoves = false;
        //the player can stand on the platform
        this.physics.add.collider(my.sprite.player, this.movingPlatforms);
        //platform to move up aand down
        
        // Create coins from Objects layer in tilemap
        this.coins = this.map.createFromObjects("coins", {
            name: "coins",
            key: "tilemap_sheet",
            frame: 151
        });

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // TODO: create coin collect particle effect here
        // Important: make sure it's not running
        my.vfx.coin = this.add.particles(0, 0, "kenny-particles", {
            frame: ['spark_06.png', 'spark_06.png'],
            scale: {start: 0.07, end: 0.1},
            lifespan: 1000,
            alpha: {start: 1, end: 0.1}, 
        });
        my.vfx.coin.stop();
        this.coinCounter = 0;
        this.coinCounts = this.add.text(
            this.cameras.main.centerX-(this.cameras.main.displayWidth/2),
            this.cameras.main.centerY-(this.cameras.main.displayHeight/2),
            "COINS: "+String(this.coinCounter),
            {
                fontSize: '16px',
                fill: '#ffffff',
                align: 'left',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        this.coinCounts.setVisible(true);
        this.coinCounts.setScrollFactor(0, 0); 

        //Coin collision handler
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            ////////////////////
            // TODO: start the coin collect particle effect here
            ////////////////////
            my.vfx.coin.emitParticleAt(obj2.x, obj2.y);
            this.coinCounter ++;
            this.coinCounts.setText("coins: "+String(this.coinCounter));
        });

        // Create cutter and key from Objects layer in tilemap
        this.keyGroup = this.add.group();
        this.cutterGroup = this.add.group();
        this.keyslayer = this.map.getObjectLayer("keys");
        this.keyslayer.objects.forEach(key => {
            let frame = 0;
            for (let p of key.properties) {
                if (p.name == "frame") {
                    frame = p.value;
                    break;
                }
            }
            let k = this.physics.add.sprite(
                key.x,
                key.y,
                "tilemap_sheet",
                frame
            );
            k.setOrigin(0, 1);
            k.name = key.name;
            k.body.setImmovable(true);
            k.body.setAllowGravity(false);
            if(k.name == "keys"){
                this.keyGroup.add(k);
            }
            else{
                this.cutterGroup.add(k);
            }
        });
        
        //tresure
        this.treasure = this.map.createFromObjects("treasure", {
            name: "treasure",
            key: "tilemap_sheet",
            frame: 28
        });
            this.physics.world.enable(this.treasure, Phaser.Physics.Arcade.STATIC_BODY);

        this.treasureCollider = this.physics.add.collider(my.sprite.player, this.treasure);
        

        //bushes
        this.bushesGroup = this.add.group();
        this.bushesCollider = this.physics.add.collider(my.sprite.player, this.bushesGroup);

        this.busheslayer = this.map.getObjectLayer("bushes");
        this.busheslayer.objects.forEach(bush =>{
            let frame = 0;
            for(let i of bush.properties){
                if(i.name == "frame"){
                    frame = i.value;
                    break;
                }
            }
            let b = this.physics.add.sprite(
                bush.x,
                bush.y,
                "tilemap_sheet",
                frame
            );
            b.setOrigin(0, 1);
            b.name = bush.name;
            b.body.setImmovable(true);
            b.body.setAllowGravity(false);
            this.bushesGroup.add(b);
        });

        //flag for checking if hte player get the cutter and key
        this.haveKey = false;
        this.haveCutter = false;
        //change the flag when the player collected the key/cutter
        this.physics.add.overlap(my.sprite.player, this.keyGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.haveKey = true;
            this.treasureCollider.destroy();
            console.log("keyevent");
            console.log(this.treasure);
            this.physics.add.overlap(my.sprite.player, this.treasure, (obj1, obj2) => {
                console.log(obj2);
                obj2.destroy();
                this.coinCounter = this.coinCounter + 30;
                this.coinCounts.setText("coins: "+String(this.coinCounter));
            });
                
        });

        this.physics.add.overlap(my.sprite.player, this.cutterGroup, (obj1, obj2) => {
            obj2.destroy();
            if(this.haveCutter == false){
                this.haveCutter = true;
                this.bushesCollider.destroy();
                this.physics.add.overlap(my.sprite.player, this.bushesGroup, (obj1, obj2) => {
                    obj2.destroy();
                });
            }
        });
        //Find water tiles
        this.waterTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.water == true;
        });

        ////////////////////
        // TODO: put water bubble particle effect here
        // It's OK to have it start running
        ////////////////////
        this.waterTiles.forEach(tile => {
            if( tile.y == 19){
                let set = 19;
                let count = 1;
                while(this.map.getTileAt(tile.x, set-1)!= null && this.map.getTileAt(tile.x, set-1).properties.water == true){
                    count ++;
                    set --;
                }
                this.add.particles(0, 0, "kenny-particles", {
                    frame: ['circle_02.png', 'circle_03.png'],
                    emitZone: {
                        type: 'random',
                        source: new Phaser.Geom.Rectangle(tile.x*18, 19*18, 1*18, 1*18)
                    },
                    scale: {start: 0.02, end: 0.04},
                    lifespan: 170*count,
                    frequency: 600,
                    alpha: {start: 1, end: 0.1}, 
                    speedY: { min: -10, max: -50 },
                });
            }
            
        });
        this.flagTiles = this.groundLayer.filterTiles(tile => {
            return tile.properties.flag == true;
        });


        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        this.gameOver = false;
        this.deadText = this.add.text(
            0,
            0,
            "YOU ARE DEAD \n PRESS R TO RESTART",
            {
                fontSize: '25px',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        this.deadText.setOrigin(0.5);
        this.deadText.setVisible(false);

        this.gameEnd = false;
        this.endText = this.add.text(
            0,
            0,
            "YOU'VE REACH THE END \nWITH COLLECTIING "+String(this.coinCounter)+" COINS!\n PRESS R TO RESTART",
            {
                fontSize: '25px',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        this.endText.setOrigin(0.5);
        this.endText.setVisible(false);
    }

    update() {
        
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        //show the dead text when the player touched the water tiled
        let waterTile = this.groundLayer.getTileAtWorldXY(
            my.sprite.player.x,
            my.sprite.player.y
        );
        if(this.gameOver) {
            if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart();
            }
            return;
        }
        if(waterTile && waterTile.properties.water && !this.gameOver) {
            this.gameOver = true;

            //player stop moving, and show the text
            my.sprite.player.setVelocity(0, 0);
            my.sprite.player.body.enable = false;
            this.deadText.x = this.cameras.main.worldView.centerX;
            this.deadText.y = this.cameras.main.worldView.centerY;
            this.deadText.setVisible(true);
        }
        //show the ending text when the player touched the flag tile
        let flagTile = this.groundLayer.getTileAtWorldXY(
            my.sprite.player.x,
            my.sprite.player.y
        );
        if(this.gameEnd){
            if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.scene.restart();
            }
            return;
        }
        if(flagTile && flagTile.properties.flag && !this.gameEnd){
            //player stop moving, and show the text
            my.sprite.player.setVelocity(0, 0);
            my.sprite.player.body.enable = false;
            this.endText.x = this.cameras.main.worldView.centerX;
            this.endText.y = this.cameras.main.worldView.centerY;
            this.endText.setText("YOU'VE REACH THE END \nWITH COLLECTIING "+String(this.coinCounter)+" COINS!\n PRESS R TO RESTART");
            this.endText.setVisible(true);
        }


    }
}