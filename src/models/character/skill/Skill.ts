import { JsonObject, JsonReader } from "config_file.js";
import StarRail from "../../../client/StarRail";
import TextAssets from "../../assets/TextAssets";
import AssetsNotFoundError from "../../../errors/AssetsNotFoundError";
import ImageAssets from "../../assets/ImageAssets";
import CombatType, { CombatTypeId } from "../../CombatType";
import SkillLevel from "./SkillLevel";

/** @typedef */
export type AttackType = "Normal" | "Ultra" | "MazeNormal" | "Maze" | "BPSkill";

/** @typedef */
export type EffectType = "SingleAttack" | "AoEAttack" | "MazeAttack" | "Enhance" | "Blast" | "Impair" | "Bounce" | "Support" | "Defence" | "Restore";

/**
 * @en Skill
 */
class Skill {
    /**  */
    readonly id: number;
    /**  */
    readonly client: StarRail;

    /**  */
    readonly name: TextAssets;
    /**  */
    readonly tag: TextAssets;
    /**  */
    readonly skillTypeDescription: TextAssets;
    /**  */
    readonly attackType: AttackType | null;
    /**  */
    readonly combatType: CombatType | null;
    /**  */
    readonly effectType: EffectType;
    /**  */
    readonly maxLevel: number;
    /**  */
    readonly skillIcon: ImageAssets;
    /** Available only when [attackType](#attackType) is "Ultra" */
    readonly ultraSkillIcon: ImageAssets;

    readonly _skillsData: JsonObject[];

    /**
     * @param id
     * @param client
     * @param skillIndexToUse
     */
    constructor(id: number, client: StarRail, skillIndexToUse = 0) {
        this.id = id;
        this.client = client;

        const _data: JsonObject | undefined = client.cachedAssetsManager.getStarRailCacheData("AvatarSkillConfig")[this.id];
        if (!_data) throw new AssetsNotFoundError("Skill", this.id);
        this._skillsData = Object.values(_data) as JsonObject[];

        const json = new JsonReader(this._skillsData[skillIndexToUse]);

        this.name = new TextAssets(json.getAsNumber("SkillName", "Hash"), this.client);
        this.tag = new TextAssets(json.getAsNumber("SkillTag", "Hash"), this.client);
        this.skillTypeDescription = new TextAssets(json.getAsNumber("SkillTypeDesc", "Hash"), this.client);

        this.attackType = json.getAsStringWithDefault(null, "AttackType") as AttackType | null;
        const combatTypeId = json.getAsStringWithDefault(undefined, "StanceDamageType") as CombatTypeId | undefined;
        this.combatType = combatTypeId ? new CombatType(combatTypeId, this.client) : null;
        this.effectType = json.getAsString("SkillEffect") as EffectType;

        this.maxLevel = json.getAsNumber("MaxLevel");

        this.skillIcon = new ImageAssets(json.getAsString("SkillIcon"), this.client);
        this.ultraSkillIcon = new ImageAssets(json.getAsString("UltraSkillIcon"), this.client);

    }

    /**
     * @param level
     */
    getSkillByLevel(level: SkillLevel): LeveledSkill {
        return new LeveledSkill(this._skillsData[level.value - 1], level, this.client);
    }
}

export default Skill;

/**
 * @en LeveledSkill
 * @extends {Skill}
 */
export class LeveledSkill extends Skill {
    /**  */
    readonly level: SkillLevel;
    /**  */
    readonly description: TextAssets;
    /**  */
    readonly simpleDescription: TextAssets;

    readonly _data: JsonObject;

    /**
     * @param data
     * @param client
     */
    constructor(data: JsonObject, level: SkillLevel, client: StarRail) {
        const json = new JsonReader(data);
        const id = json.getAsNumber("SkillID");
        const totalLevel = json.getAsNumber("Level");
        if (totalLevel !== level.value) throw new Error("data[\"Level\"] must be the same as `level.value`.");

        super(id, client, totalLevel - 1);

        this._data = data;

        this.level = level;

        this.description = new TextAssets(json.getAsNumber("SkillDesc", "Hash"), this.client);
        this.simpleDescription = new TextAssets(json.getAsNumber("SimpleSkillDesc", "Hash"), this.client);
    }
}