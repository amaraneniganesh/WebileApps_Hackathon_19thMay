import { Request, Response } from 'express';
import * as InternalModel from '../models/internal.model';

export const getOperationsDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const interruptedSips = await InternalModel.getInterruptedSipsReport();
    const dormantInvestors = await InternalModel.getDormantInvestorsReport();

    res.status(200).json({
      status: 'SUCCESS',
      timestamp: new Date(),
      data: {
        interruptedSipsSummary: { count: interruptedSips.length, rows: interruptedSips },
        concentrationRiskSummary: { count: dormantInvestors.length, rows: dormantInvestors }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};