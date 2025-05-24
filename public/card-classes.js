// Card Classes
class Card {
    constructor(name, energyCost, health, damage, speed, range, ability, type, imageUrl) {
        this.name = name;
        this.energyCost = energyCost;
        this.health = health || 0;
        this.damage = damage || 0;
        this.speed = speed || 0;
        this.range = range || 0;
        this.ability = ability;
        this.type = type;
        this.imageUrl = imageUrl;
    }
    
    describe() {
        return `${this.name} [${this.type}]`;
    }
}

class UnitCard extends Card {
    constructor(name, energyCost, health, damage, speed, range, ability, type, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, type, imageUrl);
    }
    
    describe() {
        return `${this.name} [${this.type}] - Energy: ${this.energyCost}, Range: ${this.range}, Health: ${this.health}, Speed: ${this.speed}, Damage: ${this.damage}`;
    }
}

class RangedCard extends UnitCard {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Ranged", imageUrl);
    }
}

class MeleeCard extends UnitCard {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Melee", imageUrl);
    }
}

class FlyingCard extends UnitCard {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Flying", imageUrl);
    }
}

class EliteCard extends UnitCard {
    constructor(name, health, damage, speed, range, ability, tributeRequirement, imageUrl) {
        super(name, 10, health, damage, speed, range, ability, "Elite", imageUrl);
        this.tributeRequirement = tributeRequirement; // Object describing tribute requirements
    }
    
    describe() {
        return `${this.name} [${this.type}] - Energy: ${this.energyCost}, Range: ${this.range}, Health: ${this.health}, Speed: ${this.speed}, Damage: ${this.damage}\nTribute: ${this.tributeRequirement.description}`;
    }
    
    canTribute(card1, card2) {
        // Check if the two cards meet the tribute requirements
        return this.tributeRequirement.validator(card1, card2);
    }
}

class ModifierCard extends Card {
    constructor(name, energyCost, health, damage, speed, range, ability, type, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, type, imageUrl);
        this.healthChange = health;
        this.damageChange = damage;
        this.speedChange = speed;
        this.rangeChange = range;
    }
    
    describe() {
        return `${this.name} [${this.type}] - Energy: ${this.energyCost}, Modifies: Health ${this.healthChange}, Speed ${this.speedChange}, Damage ${this.damageChange}, Range ${this.rangeChange}`;
    }
}

class EquipmentCard extends ModifierCard {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Equipment", imageUrl);
    }
}

class BuffCard extends ModifierCard {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Buff", imageUrl);
    }
}

class DebuffCard extends ModifierCard {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Debuff", imageUrl);
    }
}

class BuildingCard extends Card {
    constructor(name, energyCost, health, damage, speed, range, ability, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Building", imageUrl);
    }
    
    describe() {
        return `${this.name} [${this.type}] - Energy: ${this.energyCost}, Health: ${this.health}`;
    }
}

class TerrainCard extends Card {
    constructor(name, energyCost, health, damage, speed, range, ability, dimension, imageUrl) {
        super(name, energyCost, health, damage, speed, range, ability, "Terrain", imageUrl);
        this.dimension = dimension;
    }
    
    describe() {
        return `${this.name} [${this.type}] - Energy: ${this.energyCost}, Area: ${this.dimension}`;
    }
}

// Card Database
const allCards = [
    // Ranged Cards
    new RangedCard("Sharp Shooter", 4, 5, 4, 2, 3, "Uses full movement to make an extra attack", "images/Sharpshooter.png"),
    new RangedCard("Longbowman", 5, 6, 3, 3, 4, "This unit does +1 damage for every tile between this unit and its target", "images/Longbowman.png"),
    new RangedCard("Venomtip Archer", 4, 4, 2, 3, 3, "On hit: Poison for 2 turns (2 dmg a turn)", "images/Venomtip Archer.png"),
    new RangedCard("Huntess", 4, 3, 4, 2, 3, "Once per turn, flip a coin, if heads gain 1 energy", "images/Huntress.png"),
    new RangedCard("Frostbite Marksman", 5, 5, 4, 3, 4, "This unit is unaffected by terrain", "images/Frostbite Marksman.png"), 
    new RangedCard("Death Homer", 4, 4, 5, 2, 3, "This unit cannot miss its target", "images/Death Homer.png"),
    new RangedCard("High-Hill Sharpshot", 7, 8, 4, 2, 4, 'This unit does +2 dmg if on "High Ground" terrain. This unit does +2 dmg against "Flying" enemies', "images/High-Hill Sharpshot.png"),
    new RangedCard("Archer", 3, 3, 3, 2, 3, "No Ability", "images/Archer.png"),
    new RangedCard("Nullshot", 6, 6, 5, 3, 3, "When this unit deals damage to an enemy, their ability is disabled until the end of your opponents next turn", ""),
    new RangedCard("Steelbark Archer", 7, 13, 5, 1, 3, "At the start of your turn, this unit gains 1 hp", ""),
    new RangedCard("Eldrich Abomination", 5, 7, 0, 3, 3, "On hit: curse enemy. Once per turn, remove the curse from all enemies, each enemy takes 1 dmg for every cursed target", ""),
    new RangedCard("Bomber #57", 5, 7, 5, 4, 3, "On hit: flip a coin, if heads all enemy units ajacent to the target take 2 dmg", ""),
    new RangedCard("Ballista", 7, 10, 4, 1, 4, "On hit: flip a coin, if heads pierce enemy (Hits unit directly behind target)", ""), 

    // Melee Cards
    new MeleeCard("Warrior", 3, 9, 5, 3, 1, "", ""),
    new MeleeCard("Ironbound Warrior", 5, 5, 3, 3, 1,"'This units gains +1 hp and +1 dmg for every piece of equipment attached to this unit. Ignore Equipment limit for this card", ""),
    new MeleeCard("Bladeclash Soldier", 4, 10, 5, 4, 1, "If this troop has been damaged +3 dmg", ""),
    new MeleeCard("Static Warden", 5, 3, 2, 3, 1, "At the start of your turn, this unit gains +1 hp and +1 dmg for every 1 energy/mana used last turn, and +1 speed for every 3 energy/mana used last turn.", ""),
    new MeleeCard("Goldsnare Infantry", 4, 9, 5, 3, 1, "If this soldier gets a kill gain 2 energy", ""),
    new MeleeCard("Mudscale brawler", 4, 7, 5, 4, 1, "Immune to terrain and gain +1 speed while on terrain", ""),
    new MeleeCard("Crimson Heart", 4, 7, 3, 4, 1, "On summon, all your melee troops gain +1 hp. You may sacrifice this card, all allied units gain +1 hp and +1 dmg", ""),
    new MeleeCard("Siegebreaker", 5, 10, 2, 5, 1, "Can one tap all enemy buildings", ""),
    new MeleeCard("Fleshstringed Goblin", 7, 1, 2, 4, 4, "At the start on your turn, this card gains +1 hp for every unit in either players graveyard", ""),
    new MeleeCard("Combat Medic", 6, 8, 5, 3, 1, "Once per turn, heal all ajacent units 2 hp. On hit: this unit heals all ajacent units 1hp", ""),
    new MeleeCard("Twilight Stalker", 6, 8, 1, 4, 1, "once per turn, consume attack and gain +1 Dmg. Abilitys only ativate once secound round starts", ""),
    new MeleeCard("Wisperwraith", 7, 7, 8, 3, 1, "Once per turn, this unit can teleport anywhere on the map and take 5 dmg", ""),
    //new MeleeCard("", , , , , , "", "")

    // Flying Cards
    new FlyingCard("Baby Dragon", 4, 2, 3, 6, 1, "Every 3 rounds gain +1 hp and +1 dmg", ""),
    new FlyingCard("Winged Phantom", 5, 1, 7, 6, 1, "If this unit would take damagefrom enemy unit attack, flip a coin, if heads enemy unit misses this target", ""),
    new FlyingCard("Twilight Screecher", 7, 8, 0, 6, 1, "On Attack stun all enemies within a 5-5 square for one round (half's movement and dmg)", ""),
    new FlyingCard("Wyvern", 8, 9, 6, 7, 1, "Applies poison for 2 rounds (2 Dmg per round)", ""),
    new FlyingCard("Haulfang", 6, 7, 5, 6, 1, "All air cards take 1 less energy to deploy", ""),
    new FlyingCard("Golden Gale", 8, 14, 0, 4, 1, "At the start of your turn, if this unit did not move last turn, gain +2 Energy/Mana", ""),
    new FlyingCard("Lifebreath Serpent", 9, 11, 5, 5, 1, "On summon, target 1 flying unit in your graveyard with cost 6 or less, ressurect that target. After attacking, heal 2 hp", ""),
    new FlyingCard("Wise Fang", 10, 11, 8, 5, 1, "Once per turn, target 1 allied flying unit, copy targeted units ability until the start of your next turn. (cant be an elite)", ""),
    new FlyingCard("Storm Talon", 7, 11, 9, 6, 1, "After Attacking an enemy troop deal 5 Dmg to all other ajacent enemy units", ""),
    new FlyingCard("Blightwinged Archer", 6, 1, 4, 6, 4, "On hit: Blight for 2 turns (Unit takes 1 more dmg from all attacks). This unit is immune to any (Blight Debuff cards)", ""),
    new FlyingCard("Pheonix", 7, 10, 7, 5, 1, "Upon Death revive this card at half hp (works once)", ""),
    //new FlyingCard("", , , , , , "", ""),
    //new FlyingCard("", , , , , , "", ""),
    //new FlyingCard("", , , , , , "", ""),


    // Equipment Cards
    new EquipmentCard("Purity Ember", 2, 0, 0, 0, 0, "Cleanses all negative afects on 1 troop", ""),
    new EquipmentCard("Gilded Bastion", 4, 1, 0, 0, 0, "When hit by a ranged attack, flip a coin, in heads the attack misses this unit, gain +1 HP. This card can only be equipped by ground units", ""),
    new EquipmentCard("Electric tipped arrows", 2, 0, 0, 0, 0, "All ranged attacks made by this unit apply the stun effect for 1 turn (Half dmg and movement). This card can only be equipped by ranged units.", ""),
    new EquipmentCard("Spiked Armor", 5, 1, 0, 0, 0, "This this unit takes dmg from an enemy units attacks, the attacking unit takes 1 dmg, gain +1 HP. This card can only be equipped by melee units.", ""),
    new EquipmentCard("Deaths Toll", 5, 0, 0, 0, 0, "This unit gains +1 hp and +1 dmg for every unit in your enemies graveyard", ""),
    new EquipmentCard("Glass Protection", 4, 0, 0, 0, 0, "The next time this unit would take dmg, it takes 0 dmg instead, works once.", ""),
    new EquipmentCard("Light Weight Body armor", 5, 1, 0, 1, 0, "Gain +1 HP and +1 Spd", ""),
    new EquipmentCard("Full Plate armor", 6, 0, 0, 1, 0, "Sets and locks this units Dmg and Spd at 14 hp and 8 dmg, gain +1 spd", ""),
    new EquipmentCard("Health Potion", 1, 0, 0, 0, 0, "Restore 2 HP", ""),


    
    // Buff Cards
    new BuffCard("Fleshstichted totem","X", 0, 0, 0, 0, "Can bring back one dicarded troop with cost X-2 (Cant be an elite)", ""),
    new BuffCard("Rally", 2, 0, 1, 1, 0, "Boosts allied units in a 2x2 area", ""),
    new BuffCard("Healing Aura", 3, 3, 0, 0, 0, "Restores health to nearby friendly units", ""),
    new BuffCard("Battle Cry", 2, 0, 2, 0, 0, "All friendly units gain +2 damage for 2 turns", ""),
    new BuffCard("Swift Wind", 2, 0, 0, 2, 0, "Increases speed of all friendly units for 1 turn", ""),
    new BuffCard("Arcane Intellect", 4, 0, 0, 0, 0, "Draw 2 additional cards", ""),
    
    // Debuff Cards
    new DebuffCard("Poison Cloud", 3, -2, 0, 0, 0, "Damages enemy units over time", ""),
    new DebuffCard("Entangle", 3, 0, 0, -2, 0, "Reduces enemy movement speed", ""),
    new DebuffCard("Weaken", 2, 0, -2, 0, 0, "Reduces enemy damage output", ""),
    new DebuffCard("Blind", 4, 0, -1, 0, -2, "Reduces enemy range and accuracy", ""),
    new DebuffCard("Curse", 5, -1, -1, -1, -1, "Weakens all enemy stats", ""),
    
    // Building Cards
    new BuildingCard("Watchtower", 4, 6, 2, 0, 3, "Provides vision and attacks nearby enemies", ""),
    new BuildingCard("Barracks", 5, 8, 0, 0, 0, "Generates a Warrior unit every 3 turns", ""),
    new BuildingCard("Treasury", 3, 5, 0, 0, 0, "Provides +1 energy per turn", ""),
    new BuildingCard("Wall", 2, 10, 0, 0, 0, "Blocks enemy movement", ""),
    new BuildingCard("Healing Shrine", 4, 6, 0, 0, 0, "Heals all adjacent friendly units by 1 each turn", ""),
    
    // Terrain Cards
    new TerrainCard("Forest", 2, 0, 0, 0, 0, "Provides cover for units within", "3x3", ""),
    new TerrainCard("Swamp", 3, 0, 0, -1, 0, "Slows enemy movement through the area", "2x2", ""),
    new TerrainCard("Mountain", 4, 0, 1, 0, 1, "Provides height advantage for ranged attacks", "2x2", ""),
    new TerrainCard("Lava Field", 5, -1, 0, 0, 0, "Damages all units that enter or remain in the area", "3x3", ""),
    new TerrainCard("Holy Ground", 4, 1, 0, 0, 0, "Heals friendly units and damages enemy undead units", "2x2", ""),

    // Elite Cards
    new EliteCard("Ghostwing Archer", 9, 9, 3, 4, "Reset this troops turn on elimination (can move and attack again)", {
        description: "2 Ranged cards with cost ≥ 5 each",
        validator: (card1, card2) => card1.type === "Ranged" && card2.type === "Ranged" && card1.energyCost >= 5 && card2.energyCost >= 5
    }, "")
];