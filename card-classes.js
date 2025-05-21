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
    new RangedCard("Sharp Shooter", 3, 5, 4, 2, 3, "Uses full movement to make an extra attack", ""),
    new RangedCard("Longbowman", 5, 6, 3, 3, 4, "This unit does +1 damage for every tile between this unit and its target", ""),
    new RangedCard("Venomtip Archer", 4, 4, 2, 3, 3, "On hit: Poison for 2 turns (2 dmg a turn)", ""),
    new RangedCard("Archer", 2, 3, 2, 3, 4, "Deals double damage to flying units", ""),
    new RangedCard("Musketeer", 4, 4, 5, 2, 5, "Can shoot through obstacles", ""),
    new RangedCard("Sniper", 5, 3, 7, 1, 6, "Can target any unit on the field", ""),
    new RangedCard("Crossbowman", 3, 4, 3, 2, 3, "Can attack twice per turn", ""),
    
    // Melee Cards
    new MeleeCard("Berserker", 4, 8, 5, 3, 1, "Gains +2 damage when below half health", ""),
    new MeleeCard("Knight", 3, 7, 4, 2, 1, "Takes reduced damage from ranged attacks", ""),
    new MeleeCard("Assassin", 2, 4, 6, 4, 1, "Can move through enemy units", ""),
    new MeleeCard("Warrior", 3, 6, 4, 2, 1, "Basic melee unit with balanced stats", "images/Warrior.png"),
    new MeleeCard("Paladin", 5, 9, 3, 2, 1, "Heals 1 health at the start of your turn", ""),
    
    // Flying Cards
    new FlyingCard("Phoenix", 5, 6, 3, 4, 2, "Can fly over obstacles", ""),
    new FlyingCard("Dragon", 7, 8, 6, 3, 3, "Deals splash damage to adjacent enemies", ""),
    new FlyingCard("Griffon", 4, 5, 4, 5, 1, "Can carry friendly units", ""),
    new FlyingCard("Harpy", 3, 4, 3, 4, 2, "Reduces enemy movement speed", ""),
    new FlyingCard("Sky Rider", 5, 5, 3, 6, 2, "Can move to any position on the field", ""),
    
    // Equipment Cards
    new EquipmentCard("Battle Axe", 2, 0, 3, -1, 0, "Equip to a melee unit to increase damage", ""),
    new EquipmentCard("Shield", 2, 2, -1, -1, 0, "Provides additional protection against attacks", ""),
    new EquipmentCard("Bow", 3, 0, 1, 0, 2, "Increases attack range and damage", ""),
    new EquipmentCard("Magic Cloak", 3, 1, 0, 1, 0, "Provides protection against spells", ""),
    new EquipmentCard("Boots of Speed", 1, 0, 0, 2, 0, "Increases movement speed", ""),
    
    // Buff Cards
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
    new TerrainCard("Holy Ground", 4, 1, 0, 0, 0, "Heals friendly units and damages enemy undead units", "2x2", "")
];