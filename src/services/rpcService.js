/**
 * HisabKitab 360 - PostgreSQL RPC Service
 * ---------------------------------------
 * Handles remote procedure calls to PostgreSQL stored procedures
 * with circuit breaker protection and offline queue fallback.
 */

import { supabase } from './supabaseClient';
import { circuitBreakerService } from './circuitBreakerService';
import { offlineSyncQueue } from './offlineSyncQueue';
import { idempotentRequestService } from './idempotentRequestService';

class RpcService {
  /**
   * Execute an atomic RPC function on Supabase PostgreSQL
   * @param {string} functionName - RPC name (e.g., 'process_pos_sale', 'verify_audit_chain')
   * @param {Object} params - JSON payload
   * @param {Object} options - { useIdempotency: boolean, fallbackToOffline: boolean }
   */
  async callRpc(functionName, params = {}, options = {}) {
    const { useIdempotency = true, fallbackToOffline = true } = options;

    let payload = { ...params };
    if (useIdempotency && !payload.idempotency_key) {
      payload.idempotency_key = idempotentRequestService.generateKey(functionName);
    }

    try {
      // Execute through circuit breaker
      const result = await circuitBreakerService.execute(async () => {
        if (!supabase) throw new Error('Supabase client not initialized');
        const { data, error } = await supabase.rpc(functionName, { payload });
        if (error) throw error;
        return data;
      });

      return { success: true, data: result, executedOnline: true };
    } catch (err) {
      console.warn(`[RpcService] RPC ${functionName} failed:`, err);

      // If network/server failure and fallback allowed, enqueue in offline queue
      if (fallbackToOffline) {
        await offlineSyncQueue.enqueue({
          table: 'rpc',
          action: functionName,
          data: payload,
          idempotencyKey: payload.idempotency_key
        });
        return {
          success: true,
          data: {
            offlineQueued: true,
            idempotency_key: payload.idempotency_key,
            message: 'অফলাইন মোডে সংরক্ষিত হয়েছে, ইন্টারনেট আসলে স্বয়ংক্রিয়ভাবে প্রসেস হবে'
          },
          executedOnline: false
        };
      }

      return { success: false, error: err.message };
    }
  }

  /**
   * Shortcut for atomic POS sale RPC
   */
  async processSaleAtomic(salePayload) {
    return this.callRpc('process_pos_sale', salePayload, { useIdempotency: true });
  }

  /**
   * Shortcut for cryptographic audit verification
   */
  async verifyAuditChain(organizationId) {
    return this.callRpc('verify_audit_chain', { organization_id: organizationId }, { fallbackToOffline: false });
  }
}

export const rpcService = new RpcService();
