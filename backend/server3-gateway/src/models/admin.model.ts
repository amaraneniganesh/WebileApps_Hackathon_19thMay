import { Request, Response } from 'express';
import { pool } from './../config/db';

export const createRealEstateProperty = (panNumber: string, name: string, address: string, price: number, date: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        INSERT INTO public.real_estate_properties (property_id, pan_number, property_name, address, purchase_price, purchase_date, current_status)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'OWNED')
      `;
      await pool.query(query, [panNumber, name, address, price, date]);
      resolve();
    } catch (error) { reject(error); }
  });
};

export const executeAtomicEquityIngestion = (data: any): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const upsertQuery = `
        INSERT INTO public.equity_holdings (investor_id, stock_symbol, quantity, avg_buy_price, current_market_price, exchange)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (investor_id, stock_symbol) 
        DO UPDATE SET 
          quantity = public.equity_holdings.quantity + EXCLUDED.quantity,
          current_market_price = EXCLUDED.current_market_price,
          updated_at = now()
      `;
      await client.query(upsertQuery, [data.investorId, data.stockSymbol, data.quantity, data.avgBuyPrice, data.currentMarketPrice, data.exchange]);

      const logQuery = `
        INSERT INTO public.equity_transactions (investor_id, stock_symbol, transaction_type, quantity, price, exchange, realized_gain, executed_at)
        VALUES ($1, $2, 'BUY', $3, $4, $5, 0, now())
      `;
      await client.query(logQuery, [data.investorId, data.stockSymbol, data.quantity, data.avgBuyPrice, data.exchange]);

      await client.query('COMMIT');
      resolve();
    } catch (err) { await client.query('ROLLBACK'); reject(err); }
    finally { client.release(); }
  });
};

export const executeAtomicMutualFundIngestion = (data: any): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const fundQuery = `
        INSERT INTO public.mf_customer_funds (customer_ref, scheme_code, units, invested_amount, current_value, investment_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(fundQuery, [data.customerRef, data.schemeCode, data.units, data.investedAmount, data.currentValue, data.investmentDate]);

      const logQuery = `
        INSERT INTO public.mf_transactions (customer_ref, scheme_code, transaction_type, amount, units, redemption_status, executed_at)
        VALUES ($1, $2, 'PURCHASE', $3, $4, 'COMPLETED', now())
      `;
      await client.query(logQuery, [data.customerRef, data.schemeCode, data.investedAmount, data.units]);

      await client.query('COMMIT');
      resolve();
    } catch (err) { await client.query('ROLLBACK'); reject(err); }
    finally { client.release(); }
  });
};

export const insertRealEstateValuation = (propertyId: string, marketValue: number, valuationDate: string, updatedBy: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        INSERT INTO public.real_estate_valuations (valuation_id, property_id, market_value, valuation_date, updated_by)
        VALUES (gen_random_uuid(), $1, $2, $3, $4)
      `;
      await pool.query(query, [propertyId, marketValue, valuationDate, updatedBy]);
      resolve();
    } catch (error) { reject(error); }
  });
};

export const getSystemAuditLogs = (): Promise<any[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = 'SELECT * FROM public.audit_logs ORDER BY timestamp DESC LIMIT 200';
      const result = await pool.query(query);
      resolve(result.rows);
    } catch (error) { reject(error); }
  });
};

// UPDATE: Modifies structural variables of a specific real estate record
export const updateRealEstatePropertyDetails = (
  propertyId: string, 
  name: string, 
  address: string, 
  price: number, 
  status: string
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        UPDATE public.real_estate_properties
        SET property_name = $2, address = $3, purchase_price = $4, current_status = $5, created_at = now()
        WHERE property_id = $1
      `;
      await pool.query(query, [propertyId, name, address, price, status || 'OWNED']);
      resolve();
    } catch (error) { reject(error); }
  });
};

// DELETE: Cascade purges an asset record position along with dependent table matrices
export const deleteRealEstatePropertyRecord = (propertyId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Purge dependent revaluation entries first to prevent foreign key errors
      await client.query('DELETE FROM public.real_estate_valuations WHERE property_id = $1', [propertyId]);
      await client.query('DELETE FROM public.real_estate_rental_income WHERE property_id = $1', [propertyId]);
      // Purge main asset row
      await client.query('DELETE FROM public.real_estate_properties WHERE property_id = $1', [propertyId]);
      await client.query('COMMIT');
      resolve();
    } catch (error) {
      await client.query('ROLLBACK');
      reject(error);
    } finally {
      client.release();
    }
  });
};

// HELPER READ: Locates owner mapping details for tenancy validation gates
export const getPropertyOwnerMetadata = (propertyId: string): Promise<any | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT p.*, m.user_id 
        FROM public.real_estate_properties p
        JOIN public.investor_identity_map m ON p.pan_number = m.pan_number
        WHERE p.property_id = $1
      `;
      const result = await pool.query(query, [propertyId]);
      if (result.rows.length === 0) return resolve(null);
      resolve(result.rows[0]);
    } catch (error) { reject(error); }
  });
};