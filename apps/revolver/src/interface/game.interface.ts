import { gameMetaData } from './metaData.interface';

export interface GameInterface {
  gameUUID?: string;
  gameHumanReadableId: string;
  gameName: string;
  metaData: gameMetaData;
  description: string | null;
  rules: string | null;
  status: number;
  gameProviderName: string;
  gameProviderPrefix: string;
  thumbnail?: string;
  marketingMaterialsZip: string;
}
