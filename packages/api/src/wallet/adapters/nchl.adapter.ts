import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NCHLAdapter {
  private readonly logger = new Logger(NCHLAdapter.name);
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly appId: string;
  private readonly appName: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('NCHL_BASE_URL', 'https://uat.connectips.com:443/api');
    this.merchantId = this.config.get<string>('NCHL_MERCHANT_ID', '');
    this.appId = this.config.get<string>('NCHL_APP_ID', '');
    this.appName = this.config.get<string>('NCHL_APP_NAME', 'BATUWA');
  }

  /**
   * Generates the digital signature required by NCHL (HMAC-SHA256)
   */
  private generateSignature(data: string): string {
    const secret = this.config.get<string>('NCHL_API_SECRET', '');
    return crypto.createHmac('sha256', secret).update(data).digest('base64');
  }

  /**
   * Initiates a Bank Link request via ConnectIPS
   */
  async initiateBankLink(userId: string, accountDetails: any) {
    this.logger.log(`Initiating NCHL Bank Link for user: ${userId}`);
    
    // In a real NCHL flow, you would redirect the user to their gateway
    // This is the payload structure required by NCHL API
    const payload = {
      MERCHANTID: this.merchantId,
      APPID: this.appId,
      APPNAME: this.appName,
      TXNID: `LINK-${userId}-${Date.now()}`,
      TXNAMT: 0, // Linking is usually 0 or a nominal fee
      REFERENCEID: userId,
      REMARKS: 'BATUWA_BANK_LINK',
      PARTICULARS: 'Link Request',
      TOKEN: this.generateSignature(`${this.merchantId},${this.appId},${userId}`),
    };

    // If in UAT/SIMULATED mode, return mock redirect
    if (this.config.get('NODE_ENV') !== 'production') {
      return {
        redirectUrl: `${this.baseUrl}/bank-link-mock?token=${payload.TOKEN}`,
        txnId: payload.TXNID,
      };
    }

    // Real production call would go here
    return payload;
  }

  /**
   * Pulls money from a linked bank account (Direct Debit)
   */
  async pullFunds(token: string, amount: number, referenceId: string) {
    this.logger.log(`Executing NCHL Direct Debit: Rs. ${amount}`);

    const payload = {
      merchantId: this.merchantId,
      appId: this.appId,
      token, // The mandate token stored during linking
      amount: amount * 100, // NCHL usually expects Paisa
      txnId: `LOAD-${referenceId}`,
    };

    try {
      // Real API Call to NCHL
      // const response = await axios.post(`${this.baseUrl}/direct-debit`, payload);
      // return response.data;

      // Simulated success for now
      return { status: 'SUCCESS', nchlTxnId: `NCHL-${Math.random().toString(36).substring(7)}` };
    } catch (error) {
      this.logger.error('NCHL Pull Funds Failed', error.stack);
      throw error;
    }
  }
}
