/**
 * SSL/TLS Certificate Verification
 * Ensures secure connections to APIs
 */

import https from 'https';
import { logger } from './logger';

export class SSLVerification {
  /**
   * Verify SSL certificate for a given hostname
   */
  static async verifyCertificate(hostname: string, port: number = 443): Promise<boolean> {
    return new Promise((resolve) => {
      const options = {
        host: hostname,
        port: port,
        method: 'HEAD',
        rejectUnauthorized: true, // Enforce SSL verification
        checkServerIdentity: (host: string, cert: any) => {
          // Verify hostname matches certificate
          if (cert.subject.CN !== host) {
            logger.error(`Certificate hostname mismatch: ${cert.subject.CN} !== ${host}`);
            return new Error(`Hostname mismatch`);
          }
          return undefined;
        },
      };

      const req = https.request(options, (res) => {
        const cert = (res.socket as any).getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          logger.error('No SSL certificate found');
          resolve(false);
          return;
        }

        // Check if certificate is valid
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);

        if (now < validFrom || now > validTo) {
          logger.error(
            `SSL certificate expired or not yet valid. Valid from ${validFrom} to ${validTo}`
          );
          resolve(false);
          return;
        }

        logger.debug(`SSL certificate valid for ${hostname}`);
        resolve(true);
      });

      req.on('error', (error) => {
        logger.error(`SSL verification failed for ${hostname}:`, error);
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Verify all required API endpoints
   */
  static async verifyAllEndpoints(): Promise<boolean> {
    logger.info('Verifying SSL certificates for API endpoints...');

    const endpoints = [
      { name: 'Instagram', host: 'www.instagram.com' },
      { name: 'Twitter API', host: 'api.twitter.com' },
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        logger.info(`Verifying ${endpoint.name}...`);
        const valid = await this.verifyCertificate(endpoint.host);
        if (valid) {
          logger.info(`✓ ${endpoint.name} SSL certificate is valid`);
        } else {
          logger.error(`✗ ${endpoint.name} SSL certificate verification failed`);
        }
        return valid;
      })
    );

    const allValid = results.every((result) => result);

    if (allValid) {
      logger.info('All SSL certificates verified successfully');
    } else {
      logger.error('Some SSL certificate verifications failed');
    }

    return allValid;
  }

  /**
   * Get HTTPS agent with strict SSL verification
   */
  static getSecureAgent(): https.Agent {
    return new https.Agent({
      rejectUnauthorized: true, // Reject invalid certificates
      minVersion: 'TLSv1.2', // Minimum TLS version
      maxVersion: 'TLSv1.3', // Maximum TLS version
    });
  }
}
