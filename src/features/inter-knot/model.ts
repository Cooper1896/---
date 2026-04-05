/**
 * InterKnot page – Model
 */
export interface AILog {
  id: number;
  timestamp: string;
  type: string;
  model?: string;
  prompt: string;
  response: string;
}

export interface InterKnotModel {
  logs: AILog[];
  loading: boolean;
  selectedLogId: number | null;
}

export const initInterKnotModel: InterKnotModel = {
  logs: [],
  loading: true,
  selectedLogId: null,
};
