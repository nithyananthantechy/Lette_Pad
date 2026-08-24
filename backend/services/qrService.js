// services/qrService.js — QR Code Generation
const QRCode = require('qrcode');

/**
 * Generate a QR code data URL for document verification
 * @param {string} documentId - Unique document ID e.g. TN-DMK-2026-00001
 * @returns {string} Base64 Data URL of the QR code image
 */
const generateQRCode = async (documentId) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${documentId}`;
  
  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 150,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });

  return { dataUrl, verifyUrl };
};

/**
 * Generate QR code as SVG string
 */
const generateQRCodeSVG = async (documentId) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${documentId}`;
  const svg = await QRCode.toString(verifyUrl, { type: 'svg', width: 150 });
  return { svg, verifyUrl };
};

module.exports = { generateQRCode, generateQRCodeSVG };
