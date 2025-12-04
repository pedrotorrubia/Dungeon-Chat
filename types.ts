
export enum MessageType {
  TEXT = 'TEXT',
  ROLL = 'ROLL',
  SYSTEM = 'SYSTEM',
  AI = 'AI'
}

export enum UserRole {
  GM = 'GM',
  PLAYER = 'PLAYER'
}

export type AppView = 'LOGIN' | 'DASHBOARD' | 'CHARACTER_CREATION' | 'GAME' | 'LIBRARY';

export interface Attribute {
  name: string;
  code: string;
  value: number;
  modifier: number;
}

export interface Item {
  name: string;
  cost: number;
  type: 'WEAPON' | 'ARMOR' | 'GEAR';
  damage?: string;
  ac?: number;
}

export interface InventoryItem extends Item {
  instanceId: string;
  equipped: boolean;
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: { current: number; max: number };
  xp: number;
  attributes: Attribute[];
  equipment: InventoryItem[];
  systemId: string;
  avatarUrl?: string;
  gold: number;
  history?: string; // Backstory
  playerName?: string; // To identify who owns it
}

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  email?: string;
}

export interface GameSession {
  id: string;
  name: string;
  systemId: string;
  gmId: string;
  gmName: string;
  playerCount: number;
  nextSession?: string;
  description: string;
  bannerUrl?: string;
  inviteCode: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  rollData?: {
    formula: string;
    results: number[];
    total: number;
  };
  isGM: boolean;
}

export interface RPGSystem {
  id: string;
  name: string;
  description: string;
  attributes: string[];
  races: string[];
  classes: string[];
}

export interface Book {
  id: string;
  title: string;
  systemId: string;
  coverUrl: string;
  owned: boolean;
  price: number;
  description: string;
}

// Combat Types
export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  type: 'PLAYER' | 'MONSTER';
  ac: number;
}

export type RollingMethod = 'CLASSIC' | 'ADVENTURER' | 'HEROIC';
