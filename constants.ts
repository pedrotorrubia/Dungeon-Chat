
import { RPGSystem, Book, GameSession, Item } from './types';

export const SYSTEMS: Record<string, RPGSystem> = {
  od2: {
    id: 'od2',
    name: 'Old Dragon 2e',
    description: 'Aventuras Clássicas de Fantasia. Um sistema OSR brasileiro focado em simplicidade.',
    attributes: ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'],
    races: ['Humano', 'Anão', 'Elfo', 'Halfling'],
    classes: ['Guerreiro', 'Clérigo', 'Mago', 'Ladrão', 'Bárbaro', 'Paladino', 'Druida', 'Ranger', 'Bardo']
  },
  t20: {
    id: 't20',
    name: 'Tormenta 20',
    description: 'O maior RPG do Brasil. Fantasia épica em Arton.',
    attributes: ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'],
    races: ['Humano', 'Lefou', 'Qareen', 'Minotauro', 'Goblin'],
    classes: ['Arcanista', 'Bárbaro', 'Bardo', 'Bucaneiro', 'Caçador', 'Cavaleiro', 'Clérigo', 'Druida', 'Guerreiro', 'Inventor', 'Ladino', 'Lutador', 'Nobre', 'Paladino']
  },
  alpha: {
    id: 'alpha',
    name: '3D&T Alpha',
    description: 'Defensores de Tóquio. Anime, mangá e aventuras exageradas.',
    attributes: ['F', 'H', 'R', 'A', 'PdF'],
    races: ['Humano', 'Elfo', 'Anão', 'Alienígena', 'Androide'],
    classes: ['Aventureiro']
  }
};

export const MOCK_GAMES: GameSession[] = [
  {
    id: '1',
    name: 'A Tumba do Rei Esqueleto',
    systemId: 'od2',
    gmId: 'gm1',
    gmName: 'Mestre Ancião',
    playerCount: 4,
    nextSession: 'Hoje, 20:00',
    description: 'Uma masmorra clássica cheia de perigos e tesouros antigos.',
    bannerUrl: 'https://picsum.photos/id/1036/400/200',
    inviteCode: 'SKEL123'
  },
  {
    id: '2',
    name: 'Coração de Rubi',
    systemId: 't20',
    gmId: 'gm2',
    gmName: 'Lady Dice',
    playerCount: 5,
    nextSession: 'Sábado, 19:00',
    description: 'A jornada épica para salvar Arton da Tormenta.',
    bannerUrl: 'https://picsum.photos/id/1040/400/200',
    inviteCode: 'RUBI456'
  }
];

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Old Dragon 2e: Livro I - Regras Básicas',
    systemId: 'od2',
    coverUrl: 'https://picsum.photos/200/300?random=1',
    owned: true,
    price: 0,
    description: 'Todas as regras essenciais para criar personagens e jogar.'
  },
  {
    id: '2',
    title: 'Old Dragon 2e: Livro II - Regras Expandidas',
    systemId: 'od2',
    coverUrl: 'https://picsum.photos/200/300?random=2',
    owned: false,
    price: 49.90,
    description: 'Regras de domínio, combate em massa e níveis altos.'
  },
  {
    id: '3',
    title: 'Tormenta 20: Edição Jogo do Ano',
    systemId: 't20',
    coverUrl: 'https://picsum.photos/200/300?random=3',
    owned: true,
    price: 0,
    description: 'O livro básico para aventuras em Arton.'
  }
];

export const OD2_STARTING_GEAR: Item[] = [
  { name: 'Espada Longa', cost: 10, type: 'WEAPON', damage: '1d8' },
  { name: 'Espada Curta', cost: 6, type: 'WEAPON', damage: '1d6' },
  { name: 'Adaga', cost: 2, type: 'WEAPON', damage: '1d4' },
  { name: 'Machado de Batalha', cost: 10, type: 'WEAPON', damage: '1d8' },
  { name: 'Arco Curto', cost: 25, type: 'WEAPON', damage: '1d6' },
  { name: 'Armadura de Couro', cost: 20, type: 'ARMOR', ac: 2 },
  { name: 'Cota de Malha', cost: 60, type: 'ARMOR', ac: 4 },
  { name: 'Escudo', cost: 10, type: 'ARMOR', ac: 1 },
  { name: 'Mochila', cost: 2, type: 'GEAR' },
  { name: 'Corda (15m)', cost: 1, type: 'GEAR' },
  { name: 'Tocha (5)', cost: 1, type: 'GEAR' },
  { name: 'Rações de Viagem (7)', cost: 5, type: 'GEAR' },
  { name: 'Cantil', cost: 1, type: 'GEAR' }
];

export const MOCK_MONSTERS = [
  { name: 'Goblin', hp: '1d6', ac: 12, initiative: 1, xp: 15 },
  { name: 'Orc', hp: '1d8+1', ac: 13, initiative: 0, xp: 35 },
  { name: 'Esqueleto', hp: '1d6', ac: 12, initiative: 0, xp: 15 },
  { name: 'Zumbi', hp: '2d8', ac: 11, initiative: -1, xp: 50 },
  { name: 'Gnoll', hp: '2d8', ac: 14, initiative: 1, xp: 65 },
  { name: 'Ogro', hp: '4d8+4', ac: 14, initiative: 0, xp: 200 },
  { name: 'Lobo', hp: '2d8', ac: 13, initiative: 2, xp: 65 },
  { name: 'Bandido', hp: '1d6', ac: 11, initiative: 1, xp: 15 },
  { name: 'Necromante', hp: '4d4', ac: 10, initiative: 1, xp: 150 },
  { name: 'Dragão Jovem', hp: '10d8', ac: 18, initiative: 2, xp: 2000 }
];

export const CLASS_FEATURES: Record<string, string> = {
  'Guerreiro': 'D10 PV/nível. Usa todas as armas e armaduras. Bônus de ataque progressivo.',
  'Clérigo': 'D8 PV/nível. Magia divina, expulsa mortos-vivos. Proibido armas de corte.',
  'Mago': 'D4 PV/nível. Magia arcana poderosa. Não usa armadura. Acesso a grimório.',
  'Ladrão': 'D6 PV/nível. Perícias de ladinagem, ataque furtivo. Armaduras leves apenas.',
};

export const RACE_FEATURES: Record<string, string> = {
  'Humano': 'Versáteis. +10% XP. +1 em uma jogada de proteção à escolha.',
  'Anão': 'Infravisão. Detectar construções. Resistência a veneno/magia. +1 ataque vs orcs.',
  'Elfo': 'Infravisão. Imune a paralisia ghouls. +1 ataque com arcos/espadas longas.',
  'Halfling': 'Furtividade natural. +1 ataque arremesso. +2 CA vs criaturas grandes.',
};

export const getOD2Modifier = (score: number): number => {
  if (score <= 3) return -3;
  if (score <= 5) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 14) return 1;
  if (score <= 16) return 2;
  if (score <= 18) return 3;
  return 4; // 19-20
};

export const OD2_KNOWLEDGE_BASE = `
SISTEMA: Old Dragon 2ª Edição (OD2).
CONCEITO: RPG Old School, focado em simplicidade, exploração e perigo.
ATRIBUTOS: Força (FOR), Destreza (DES), Constituição (CON), Inteligência (INT), Sabedoria (SAB), Carisma (CAR).
MODIFICADORES: 3(-3), 4-5(-2), 6-8(-1), 9-12(0), 13-14(+1), 15-16(+2), 17-18(+3).
CLASSES:
- Guerreiro: Combate, usa todas as armas/armaduras. D10 de vida.
- Clérigo: Magia divina, expulsa mortos-vivos. Usa armaduras, armas de impacto. D8 de vida.
- Mago: Magia arcana, frágil. Não usa armadura. D4 de vida.
- Ladrão: Perícias (abrir fechaduras, furtividade), ataque furtivo. D6 de vida.
REGRAS DE OURO:
1. O jogo é divertido.
2. O jogo é colaborativo.
3. O jogo é ficção (não ciência).
BASE DE ATAQUE (BA): Modificador somado ao D20 para atacar.
CLASSE DE ARMADURA (CA): Dificuldade para ser acertado. 10 + DES + Armadura.
TESTES: Role 1d20. Para atributos, tire MENOS ou IGUAL ao atributo. Para ataques, supere a CA.
`;