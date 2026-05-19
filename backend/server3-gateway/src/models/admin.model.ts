import { pool } from '../config/db';

export const createRealEstateProperty = (panNumber: string, name: string, address: string, price: number, date: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        INSERT INTO public.real_estate_properties (pan_number, property_name, address, purchase_price, purchase_date)
        VALUES ($1, $2, $3, $4, $5)
      `;
      await pool.query(query, [panNumber, name, address, price, date]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const insertRealEstateValuation = (propertyId: string, marketValue: number, valuationDate: string, updatedBy: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        INSERT INTO public.real_estate_valuations (property_id, market_value, valuation_date, updated_by)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(query, [propertyId, marketValue, valuationDate, updatedBy]);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getSystemAuditLogs = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT * FROM public.audit_logs ORDER BY timestamp DESC LIMIT 200';
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) {
      reject(error);
    }
  });
};