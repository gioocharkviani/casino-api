import { gameMetaData } from './metaData.interface';

export interface GameInterface {
  gameUUID?: string;
  gameHumanReadableId: string;
  gameName: string;
  metaData: gameMetaData;
  description: string | null;
  rules: string | null;
  status: boolean;
  gameProviderName: string;
  gameProviderPrefix: string;
  thumbnail?: string;
  marketingMaterialsZip: string;
}
